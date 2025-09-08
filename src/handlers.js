import Player from './models/Player.js';
import Transaction from './models/Transaction.js';
import Game from './models/Game.js';

const strings = {
  en: {
    welcome: '🎉 Welcome to Bingo Bot!',
    menu_hint: 'Use the buttons below.',
    buy_card: 'Buy Card',
    balance: 'Balance',
    rules: 'Rules',
    my_wins: 'My Wins',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    history: 'Game History',
    next_game: 'Next Game',
    help: 'Help',
    language: 'Language / ቋንቋ',
    admin_menu: 'Admin Menu'
  },
  am: {
    welcome: '🎉 እንኳን ወደ ቢንጎ ቦት በደህና መጡ!',
    menu_hint: 'ከታች ያሉትን ቁልፎች ይጠቀሙ።',
    buy_card: 'ካርድ ግዢ',
    balance: 'ቀሪ መጠን',
    rules: 'መመሪያ',
    my_wins: 'ማሸነፌዎች',
    deposit: 'ተቀማጭ',
    withdraw: 'ማውጣት',
    history: 'የጨዋታ ታሪክ',
    next_game: 'ቀጣይ ጨዋታ',
    help: 'እገዛ',
    language: 'Language / ቋንቋ',
    admin_menu: 'Admin Menu'
  }
};

function t(lang, key) {
  return (strings[lang] && strings[lang][key]) || strings.en[key];
}

export function setupHandlers({ bot, gm, adminId }) {
  // main menu builder
  function mainMenu(lang) {
    return {
      reply_markup: {
        keyboard: [
          [{ text: t(lang, 'buy_card') }, { text: t(lang, 'balance') }],
          [{ text: t(lang, 'rules') }, { text: t(lang, 'my_wins') }],
          [{ text: t(lang, 'deposit') }, { text: t(lang, 'withdraw') }],
          [{ text: t(lang, 'history') }, { text: t(lang, 'next_game') }],
          [{ text: t(lang, 'help') }, { text: t(lang, 'language') }]
        ],
        resize_keyboard: true
      }
    };
  }

  // helper: get or create player
  async function ensurePlayer(msg) {
    const p = await gm.constructor.ensurePlayer(msg);
    return p;
  }

  // /start
  bot.onText(/\/start/, async (msg) => {
    const p = await ensurePlayer(msg);
    const lang = p.language || 'en';
    bot.sendMessage(msg.chat.id, `${t(lang, 'welcome')} \n${t(lang, 'menu_hint')}`, mainMenu(lang));
  });

  // admin menu (text command)
  bot.onText(/\/admin/, async (msg) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const text = `Admin commands:
    /pending - list pending transactions
    /games - list games
    /approve <txId> - approve tx
    /reject <txId> <note> - reject tx
    /force_stop <gameId> - stop a game
    `;
    bot.sendMessage(msg.chat.id, text);
  });

  // admin commands
  bot.onText(/\/pending/, async (msg) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const list = await Transaction.find({ status: 'pending' });
    if (!list.length) return bot.sendMessage(msg.chat.id, 'No pending transactions.');
    const lines = list.map((l) => `${l._id} | ${l.type} | ${l.playerId} | ${l.amount} ETB`);
    bot.sendMessage(msg.chat.id, lines.join('\n'));
  });

  bot.onText(/\/approve (.+)/, async (msg, match) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const txId = match[1];
    try {
      await gm.approveTransaction(txId, msg.from.id);
      bot.sendMessage(msg.chat.id, `Approved ${txId}`);
    } catch (e) {
      bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
    }
  });

  bot.onText(/\/reject (.+?) (.+)/, async (msg, match) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const txId = match[1];
    const note = match[2];
    try {
      await gm.rejectTransaction(txId, note);
      bot.sendMessage(msg.chat.id, `Rejected ${txId}`);
    } catch (e) {
      bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
    }
  });

  bot.onText(/\/games/, async (msg) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const games = await Game.find().sort({ createdAt: -1 }).limit(20);
    if (!games.length) return bot.sendMessage(msg.chat.id, 'No games yet');
    const lines = games.map(g => `${g._id} | stake ${g.stake} | status ${g.status} | pot ${g.pot}`);
    bot.sendMessage(msg.chat.id, lines.join('\n'));
  });

  bot.onText(/\/force_stop (.+)/, async (msg, match) => {
    if (msg.from.id.toString() !== adminId.toString()) return;
    const gid = match[1];
    // stop any timer and mark finished
    if (gm.activeTimers.has(gid)) {
      clearInterval(gm.activeTimers.get(gid));
      gm.activeTimers.delete(gid);
    }
    const g = await Game.findById(gid);
    if (g) {
      g.status = 'finished';
      await g.save();
    }
    bot.sendMessage(msg.chat.id, `Game ${gid} forced stopped.`);
  });

  // Generic message handler for menu buttons and actions
  bot.on('message', async (msg) => {
    if (!msg.text) return;
    // ignore commands already handled
    if (msg.text.startsWith('/')) return;

    // ensure player record exists
    const player = await Player.findOne({ telegramId: msg.from.id.toString() });
    if (!player) {
      await gm.constructor.ensurePlayer(msg);
    }

    const lang = (player && player.language) || 'en';

    // language toggle
    if (msg.text === t(lang, 'language')) {
      const next = lang === 'en' ? 'am' : 'en';
      const p = await Player.findOne({ telegramId: msg.from.id.toString() });
      p.language = next;
      await p.save();
      return bot.sendMessage(msg.chat.id, next === 'en' ? 'Language set to English.' : 'ቋንቋ ወደ አማርኛ ተቀይሯል።', mainMenu(next));
    }

    // menu actions
    switch (msg.text) {
      case t(lang, 'buy_card'):
        return handleBuyCard(msg, lang);
      case t(lang, 'balance'):
        return handleBalance(msg, lang);
      case t(lang, 'rules'):
        return handleRules(msg, lang);
      case t(lang, 'my_wins'):
        return handleWins(msg, lang);
      case t(lang, 'deposit'):
        return handleDeposit(msg, lang);
      case t(lang, 'withdraw'):
        return handleWithdraw(msg, lang);
      case t(lang, 'history'):
        return handleHistory(msg, lang);
      case t(lang, 'next_game'):
        return handleNextGame(msg, lang);
      case t(lang, 'help'):
        return bot.sendMessage(msg.chat.id, 'Contact admin if you need help.', mainMenu(lang));
      default:
        // maybe it's a card claim: "Bingo <gameId> <cardId>"
        if (msg.text.startsWith('Bingo ') || msg.text.startsWith('bingo ')) {
          const parts = msg.text.split(/\s+/);
          if (parts.length >= 3) {
            const gameId = parts[1];
            const cardId = parts[2];
            try {
              const res = await gm.claimBingo(msg.from.id.toString(), gameId, cardId);
              if (res.ok) {
                bot.sendMessage(msg.chat.id, `✅ Valid Bingo! You won ${res.winnerPrize} ETB.`);
              } else {
                bot.sendMessage(msg.chat.id, '❌ Invalid Bingo. You were disqualified.');
              }
            } catch (e) {
              bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
            }
            return;
          }
        }

        // unknown text
        return bot.sendMessage(msg.chat.id, "I didn't understand that. Use the menu.", mainMenu(lang));
    }
  });

  // Handler implementations
  async function handleBuyCard(msg, lang) {
    // Ask stake options
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '10 ETB', callback_data: 'buy_stake_10' }, { text: '20 ETB', callback_data: 'buy_stake_20' }],
          [{ text: '30 ETB', callback_data: 'buy_stake_30' }, { text: '50 ETB', callback_data: 'buy_stake_50' }],
          [{ text: '100 ETB', callback_data: 'buy_stake_100' }]
        ]
      }
    };
    bot.sendMessage(msg.chat.id, 'Choose stake:', opts);
  }

  async function handleBalance(msg, lang) {
    const p = await Player.findOne({ telegramId: msg.from.id.toString() });
    if (!p) return bot.sendMessage(msg.chat.id, 'Player record not found.');
    bot.sendMessage(msg.chat.id, `Balance: ${p.balance} ETB\nWins: ${p.wins || 0}`, mainMenu(lang));
  }

  async function handleRules(msg, lang) {
    const text = `Rules:
- Winning: any full row/col/diagonal or 4 corners.
- Press Bingo as: Bingo <gameId> <cardId>
- False Bingo -> disqualified.
- New round countdown 50 seconds between rounds.`;
    bot.sendMessage(msg.chat.id, text, mainMenu(lang));
  }

  async function handleWins(msg, lang) {
    const p = await Player.findOne({ telegramId: msg.from.id.toString() });
    bot.sendMessage(msg.chat.id, `You have ${p?.wins || 0} wins.`, mainMenu(lang));
  }

  async function handleDeposit(msg, lang) {
    // create pending deposit transaction
    bot.sendMessage(msg.chat.id, 'To deposit, send a screenshot / reference after transferring to the house account and reply with amount (numbers only).');

    // next message from user with amount will be captured here: simple approach — user types amount
  }

  async function handleWithdraw(msg, lang) {
    bot.sendMessage(msg.chat.id, 'To request withdrawal, reply with the amount you want to withdraw (numbers only).');
  }

  async function handleHistory(msg, lang) {
    const games = await Game.find({ players: msg.from.id.toString() }).sort({ createdAt: -1 }).limit(10);
    if (!games.length) return bot.sendMessage(msg.chat.id, 'No games found.', mainMenu(lang));
    const lines = games.map(g => `Game ${g._id} | stake ${g.stake} | status ${g.status} | pot ${g.pot}`).join('\n');
    bot.sendMessage(msg.chat.id, lines, mainMenu(lang));
  }

  async function handleNextGame(msg, lang) {
    // show waiting game info for any stake user is in; otherwise general next game info
    const waiting = await Game.find({ status: 'waiting' }).sort({ createdAt: 1 }).limit(5);
    if (!waiting.length) return bot.sendMessage(msg.chat.id, 'No upcoming games yet.', mainMenu(lang));
    const lines = waiting.map(g => `Game ${g._id} | stake ${g.stake} ETB | players ${g.players.length} | pot ${g.pot}`).join('\n');
    bot.sendMessage(msg.chat.id, lines, mainMenu(lang));
  }

  // Callback Query handler (for inline buttons)
  bot.on('callback_query', async (q) => {
    const data = q.data;
    const from = q.from;
    if (data.startsWith('buy_stake_')) {
      const stake = Number(data.split('_')[2]);
      // perform buy card flow: ensure player exists, check balance, if insufficient instruct deposit; else buy
      const player = await Player.findOne({ telegramId: from.id.toString() });
      if (!player) {
        await gm.constructor.ensurePlayer({ from });
      }
      const p2 = await Player.findOne({ telegramId: from.id.toString() });
      if (p2.balance < stake) {
        bot.sendMessage(from.id, `Insufficient balance. Your balance: ${p2.balance} ETB. Please deposit first.`);
        return bot.answerCallbackQuery(q.id, { text: 'Insufficient balance' });
      }
      try {
        const res = await gm.buyCard(from.id.toString(), stake);
        // auto-start game when at least 1 card bought; in real product you may require multiple players
        await gm.startGameIfReady(stake);
        bot.sendMessage(from.id, `✅ Card bought. Game: ${res.gameId}\nCard ID: ${res.cardId}\nUse "Bingo ${res.gameId} ${res.cardId}" to claim if you win.`);
        bot.answerCallbackQuery(q.id, { text: 'Card purchased' });
      } catch (e) {
        bot.sendMessage(from.id, `Error buying card: ${e.message}`);
        bot.answerCallbackQuery(q.id, { text: 'Error' });
      }
    }
  });

  // intercept numeric messages for deposit/withdraw requests
  bot.on('message', async (msg) => {
    if (!msg.text) return;
    if (!/^\d+$/.test(msg.text.trim())) return; // only plain numbers we handle here
    const amount = Number(msg.text.trim());
    if (amount <= 0) return;

    // Determine whether user was asking deposit or withdraw recently — simple approach:
    // If user balance less than amount and they asked deposit earlier we'd create deposit. Because we don't keep conversation state,
    // we'll ask them to start with "deposit" or "withdraw" button. But to support quicker flow, if amount <= balance we'll treat as withdrawal request otherwise deposit.

    const p = await Player.findOne({ telegramId: msg.from.id.toString() });
    if (!p) {
      await gm.constructor.ensurePlayer(msg);
    }
    const player = await Player.findOne({ telegramId: msg.from.id.toString() });

    if (amount <= player.balance) {
      // create withdrawal request
      const tx = await gm.createTransaction('withdrawal', msg.from.id.toString(), amount);
      bot.sendMessage(msg.chat.id, `Withdrawal request created (ID: ${tx._id}). Admin will approve manually.`);
      bot.sendMessage(adminId, `New withdrawal request: ${tx._id} | user ${msg.from.id} | amount ${amount} ETB`);
    } else {
      // create deposit record for admin to approve after user sends proof
      const tx = await gm.createTransaction('deposit', msg.from.id.toString(), amount);
      bot.sendMessage(msg.chat.id, `Deposit request created (ID: ${tx._id}). Please send proof (screenshot/ref) to admin now.`);
      bot.sendMessage(adminId, `New deposit request: ${tx._id} | user ${msg.from.id} | amount ${amount} ETB`);
    }
  });
}

export function setupPlayHandler(bot, gm) {
  bot.onText(/\/play/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, '🎲 Generating your cartela...');

      const cartela = await gm.generateCartela(chatId); // or gm.startGame(chatId)

      if (!cartela) {
        await bot.sendMessage(chatId, '⚠️ Failed to generate cartela. Please try again.');
        return;
      }

      await bot.sendMessage(chatId, `🧩 Your cartela:\n${cartela}`);
    } catch (error) {
      console.error('Error in /play handler:', error);
      await bot.sendMessage(chatId, '🚫 An error occurred while starting the game. Please try again later.');
    }
  });
}

import Game from './models/Game.js';
import Player from './models/Player.js';
import Transaction from './models/Transaction.js';
import { generateCard, checkBingo } from './utils/cards.js';
import { splitPot } from './utils/payouts.js';

export class GameManager {
  constructor({ bot, adminId }) {
    this.bot = bot;
    this.adminId = adminId;
    this.games = new Map();
    this.callInterval = parseInt(process.env.CALL_INTERVAL_MS || '2500', 10);
    this.activeTimers = new Map();
  }

  async getOrCreateWaitingGame(stake) {
    let dbGame = await Game.findOne({ stake, status: 'waiting' });
    if (!dbGame) {
      dbGame = new Game({ stake, status: 'waiting', pot: 0, players: [], cards: [], calledNumbers: [] });
      await dbGame.save();
    }
    return dbGame;
  }

  async buyCard(telegramId, stake) {
    const player = await Player.findOne({ telegramId });
    if (!player) throw new Error('player-not-found');
    if (player.balance < stake) throw new Error('insufficient-balance');

    const dbGame = await this.getOrCreateWaitingGame(stake);
    player.balance -= stake;
    await player.save();

    const { cardId, numbers } = generateCard();
    dbGame.cards.push({ playerId: telegramId, cardId, numbers });
    dbGame.players.push(telegramId);
    dbGame.pot += stake;
    await dbGame.save();

    return { cardId, numbers, pot: dbGame.pot, gameId: dbGame._id.toString() };
  }

  async startGameIfReady(stake) {
    const dbGame = await Game.findOne({ stake, status: 'waiting' });
    if (!dbGame) return null;

    dbGame.status = 'running';
    dbGame.calledNumbers = [];
    await dbGame.save();

    this.scheduleCalls(dbGame._id.toString(), stake);
    return dbGame;
  }

  async callNumber(gameId, stake) {
    const dbGame = await Game.findById(gameId);
    if (!dbGame || dbGame.status !== 'running') return null;

    const all = Array.from({ length: 75 }, (_, i) => i + 1);
    const called = new Set(dbGame.calledNumbers.map(Number));
    const available = all.filter((n) => !called.has(n));

    if (available.length === 0) {
      dbGame.status = 'finished';
      await dbGame.save();
      return null;
    }

    const pick = available[Math.floor(Math.random() * available.length)];
    dbGame.calledNumbers.push(pick);
    await dbGame.save();

    const uniquePlayers = Array.from(new Set(dbGame.players));
    uniquePlayers.forEach((tid) => {
      const text = `🔔 Number called: *${pick}*\nStake: ${dbGame.stake} ETB\nCalled count: ${dbGame.calledNumbers.length}`;
      this.bot.sendMessage(tid, text, { parse_mode: 'Markdown' }).catch(() => {});
    });

    return pick;
  }

  scheduleCalls(gameId, stake) {
    if (this.activeTimers.has(gameId)) return;

    const timer = setInterval(async () => {
      const pick = await this.callNumber(gameId, stake);
      if (!pick) {
        clearInterval(timer);
        this.activeTimers.delete(gameId);
        await this.finishGame(gameId);
      }
    }, this.callInterval);

    this.activeTimers.set(gameId, timer);
  }

  async claimBingo(telegramId, gameId, cardId) {
    const dbGame = await Game.findById(gameId);
    if (!dbGame || (dbGame.status !== 'running' && dbGame.status !== 'finished')) {
      throw new Error('no-running-game');
    }

    const card = dbGame.cards.find((c) => c.cardId === cardId && c.playerId === telegramId);
    if (!card) throw new Error('card-not-found');

    const calledSet = new Set(dbGame.calledNumbers);
    const valid = checkBingo(card.numbers, calledSet);

    if (!valid) {
      dbGame.cards = dbGame.cards.filter((c) => c.playerId !== telegramId);
      dbGame.players = dbGame.players.filter((p) => p !== telegramId);
      await dbGame.save();

      const player = await Player.findOne({ telegramId });
      if (player) {
        this.bot.sendMessage(telegramId, '❌ False Bingo — you are disqualified from this round.');
        this.bot.sendMessage(this.adminId, `Player ${telegramId} disqualified for false Bingo in game ${gameId}.`);
      }

      return { ok: false, reason: 'false' };
    }

    dbGame.winner = telegramId;
    dbGame.status = 'finished';
    await dbGame.save();

    if (this.activeTimers.has(gameId)) {
      clearInterval(this.activeTimers.get(gameId));
      this.activeTimers.delete(gameId);
    }

    const pot = dbGame.pot;
    const { winner, admin, jackpot } = splitPot(pot);

    const player = await Player.findOne({ telegramId });
    if (player) {
      player.balance += winner;
      player.wins = (player.wins || 0) + 1;
      await player.save();
    }

    const uniquePlayers = Array.from(new Set(dbGame.players));
    uniquePlayers.forEach((tid) =>
      this.bot.sendMessage(tid, `🏆 Bingo! Winner: ${telegramId}\nPot: ${pot} ETB\nWinner prize: ${winner} ETB`)
    );

    this.bot.sendMessage(this.adminId, `Game finished. Winner ${telegramId}. Payout - Winner:${winner}, Admin:${admin}, Jackpot:${jackpot}`);

    return { ok: true, winnerPrize: winner, admin, jackpot };
  }

  async finishGame(gameId) {
    const dbGame = await Game.findById(gameId);
    if (!dbGame || dbGame.status === 'finished') return;

    dbGame.status = 'finished';
    await dbGame.save();
    this.bot.sendMessage(this.adminId, `Game ${gameId} ended without winner (numbers exhausted). Pot: ${dbGame.pot}`);
  }

  async createTransaction(type, telegramId, amount) {
    const t = new Transaction({ type, playerId: telegramId, amount });
    await t.save();
    return t;
  }

  async approveTransaction(txId, approverId) {
    const tx = await Transaction.findById(txId);
    if (!tx) throw new Error('tx-not-found');
    if (approverId.toString() !== this.adminId.toString()) throw new Error('not-admin');

    tx.status = 'approved';
    await tx.save();

    const p = await Player.findOne({ telegramId: tx.playerId });
    if (p) {
      if (tx.type === 'deposit') {
        p.balance += tx.amount;
        this.bot.sendMessage(tx.playerId, `✅ Deposit approved: +${tx.amount} ETB. New balance: ${p.balance} ETB`);
      } else if (tx.type === 'withdrawal') {
        p.balance -= tx.amount;
        this.bot.sendMessage(tx.playerId, `✅ Withdrawal approved: -${tx.amount} ETB. New balance: ${p.balance} ETB`);
      }
      await p.save();
    }

    return tx;
  }

  async rejectTransaction(txId, note) {
    const tx = await Transaction.findById(txId);
    if (!tx) throw new Error('tx-not-found');

    tx.status = 'rejected';
    tx.adminNote = note;
    await tx.save();

    this.bot.sendMessage(tx.playerId, `❌ Your transaction ${txId} was rejected. Note: ${note}`);
    return tx;
  }

  async requestDeposit({ userId, amount }) {
    const tx = new Transaction({
      type: 'deposit',
      playerId: userId,
      amount,
      status: 'pending',
      requestedAt: new Date()
    });

    await tx.save();
    await this.bot.sendMessage(this.adminId, `📥 New deposit request:\nPlayer: ${userId}\nAmount: ${amount} ETB\nTxID: ${tx._id}`);
    return tx;
  }

  static async ensurePlayer(telegramMsg) {
    const telegramId = telegramMsg.from.id.toString();
    let p = await Player.findOne({ telegramId });

    if (!p) {
      p = new Player({
        telegramId,
        username: telegramMsg.from.username || `${telegramMsg.from.first_name || ''} ${telegramMsg.from.last_name || ''}`
      });
      await p.save();
    }

    return p;
  }

  async handlePlayCommand(msg) {
  const telegramId = msg.from.id.toString();
  const chatId = msg.chat.id;
  const stake = 10;

  try {
    await GameManager.ensurePlayer(msg);

    const { cardId, numbers, pot, gameId } = await this.buyCard(telegramId, stake);
    const cardText = numbers.join(', ');

    await this.bot.sendMessage(chatId, 
      `🧾 *Card ID:* \`${cardId}\`\n*Numbers:* \`${cardText}\`\n*Pot:* ${pot} ETB\n*Game ID:* \`${gameId}\``, 
      { parse_mode: 'Markdown' }
    );

    await this.bot.sendMessage(chatId, 
      `🎮 *Game started!*\nNumbers will be called every *${this.callInterval / 1000} seconds*.`, 
      { parse_mode: 'Markdown' }
    );

    await this.startGameIfReady(stake);
  } catch (err) {
  await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
}
} // Ends handlePlayCommand method

} // ✅ Ends GameManager class

export function playGame(msg, bot, adminId) {
  const manager = new GameManager({ bot, adminId });
  manager.handlePlayCommand(msg);
}

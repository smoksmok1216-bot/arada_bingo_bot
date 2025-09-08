// src/handlers/depositHandler.js
import Transaction from '../models/Transaction.js';
import Player from '../models/Player.js';

export function setupDepositHandler(bot, gm, adminId) {
  // 💰 /deposit <amount>
  bot.onText(/\/deposit (\d+)/, async (msg, match) => {
    const amount = parseInt(match[1]);
    const userId = msg.from.id.toString();

    try {
      let player = await Player.findOne({ telegramId: userId });
      if (!player) {
        player = await Player.create({ telegramId: userId, balance: 0 });
      }

      const tx = await Transaction.create({
        playerId: player._id,
        amount,
        approved: false,
      });

      await bot.sendMessage(msg.chat.id, `💰 Deposit of ${amount} received. Awaiting admin approval.\nTransaction ID: ${tx._id}`);
    } catch (error) {
      console.error('Deposit error:', error);
      await bot.sendMessage(msg.chat.id, '🚫 Failed to process deposit. Please try again.');
    }
  });

  // 📊 /status
  bot.onText(/\/status/, async (msg) => {
    const userId = msg.from.id.toString();

    try {
      const player = await Player.findOne({ telegramId: userId });
      if (!player) {
        return bot.sendMessage(msg.chat.id, '❌ No account found. Please make a deposit first.');
      }

      const txs = await Transaction.find({ playerId: player._id }).sort({ createdAt: -1 }).limit(3);
      const statusText = `
🧾 Your Balance: ${player.balance}
📄 Recent Transactions:
${txs.map(tx => `• ${tx.amount} birr – ${tx.approved ? '✅ Approved' : '⏳ Pending'} (ID: ${tx._id})`).join('\n')}
      `;
      await bot.sendMessage(msg.chat.id, statusText);
    } catch (error) {
      console.error('Status error:', error);
      await bot.sendMessage(msg.chat.id, '🚫 Failed to fetch status. Try again later.');
    }
  });
}

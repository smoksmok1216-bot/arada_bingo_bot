// src/handlers/gameFlowHandler.js

export function setupGameFlowHandler(bot, gm) {
  // 🔢 /call – Call next Bingo number
  bot.onText(/\/call/, async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id.toString();

    try {
      const nextNumber = await gm.callNextNumber(chatId);
      if (!nextNumber) {
        return bot.sendMessage(chatId, '🎉 All numbers have been called!');
      }

      await bot.sendMessage(chatId, `🔔 Next number: ${nextNumber}`);
    } catch (error) {
      console.error('Error in /call:', error);
      await bot.sendMessage(chatId, '🚫 Failed to call next number.');
    }
  });

  // 🏆 /checkwin – Check if user has won
  bot.onText(/\/checkwin/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    try {
      const result = await gm.checkWin(chatId, userId);

      if (result?.won) {
        await bot.sendMessage(chatId, `🏆 Bingo! You’ve won with card ID: ${result.cardId}`);
      } else {
        await bot.sendMessage(chatId, '❌ No win detected yet. Keep playing!');
      }
    } catch (error) {
      console.error('Error in /checkwin:', error);
      await bot.sendMessage(chatId, '🚫 Failed to check win status.');
    }
  });
}

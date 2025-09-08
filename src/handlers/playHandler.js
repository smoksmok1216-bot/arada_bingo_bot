export function setupPlayHandler(bot, gm) {
  bot.onText(/\/play(@\w+)?/, async (msg) => {
    try {
      await gm.handlePlayCommand(msg);
    } catch (error) {
      const chatId = msg.chat.id;
      console.error('Error in /play handler:', error);
      await bot.sendMessage(chatId, '🚫 An error occurred while processing your /play request.');
    }
  });
}

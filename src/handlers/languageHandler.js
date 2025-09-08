export function setupLanguageHandler(bot, gm) {
  bot.onText(/\/language/, async (msg) => {
    const chatId = msg.chat.id;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇪🇹 አማርኛ', callback_data: 'lang_amharic' },
            { text: '🇬🇧 English', callback_data: 'lang_english' }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, 'Please choose your language:', options);
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const choice = query.data;

    if (choice === 'lang_amharic') {
      await bot.sendMessage(chatId, 'ቋንቋዎ አማርኛ ተመርጧል።');
    } else if (choice === 'lang_english') {
      await bot.sendMessage(chatId, 'You selected English.');
    }

    await bot.answerCallbackQuery(query.id);
  });
}

// src/handlers/demoHandler.js
export function setupDemoHandler(bot, gm) {
  bot.onText(/\/demo/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await bot.sendMessage(chatId, '🎉 Welcome to Demo Mode! You’ll get a free Bingo card and simulated calls.');

    // Generate a demo card
    const card = gm.generateCard(); // Assumes gm has a generateCard() method
    const cardText = formatCard(card);
    await bot.sendMessage(chatId, `🃏 Your Bingo Card:\n${cardText}`);

    // Simulate calls
    const calls = gm.generateCalls(); // Assumes gm has a generateCalls() method
    await bot.sendMessage(chatId, `📣 Simulated Calls:\n${calls.join(', ')}`);

    // Check win
    const result = gm.checkWin(card, calls); // Assumes gm has a checkWin(card, calls) method
    if (result.win) {
      await bot.sendMessage(chatId, `🏆 You got Bingo! Pattern: ${result.pattern}`);
    } else {
      await bot.sendMessage(chatId, `😅 No Bingo this time. Try again with /demo`);
    }
  });
}

// Helper to format card as text
function formatCard(card) {
  return card.map(row => row.map(num => num.toString().padStart(2, ' ')).join(' | ')).join('\n');
}

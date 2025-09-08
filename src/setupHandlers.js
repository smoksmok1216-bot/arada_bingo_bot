// src/setupHandlers.js
import { setupDepositHandler } from './handlers/depositHandler.js';
import { setupLanguageHandler } from './handlers/languageHandler.js';
import { setupAdminHandler } from './handlers/adminHandler.js';
import { setupGameFlowHandler } from './handlers/gameFlowHandler.js';
import { setupDemoHandler } from './handlers/demoHandler.js';

export function setupHandlers({ bot, gm, adminId }) {
  // --- /start command ---
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '👋 Welcome to Bingo Bot! Type /play to begin or /help to see all commands.');
  });

  // --- /help command ---
  bot.onText(/\/help/, async (msg) => {
    const helpText = `
📜 Available Commands:
/start – Welcome message
/play – Generate your Bingo cartela
/deposit <amount> – Send deposit request
/status – Check your deposit/game status
/language – Switch language (Amharic/English)
/call – Call next Bingo number
/checkwin – Check if you’ve won
/demo – Try demo mode
/approve <txId> – Admin: approve deposit
/reject <txId> – Admin: reject deposit
/sendcard <userId> – Admin: send Bingo card image
/help – Show this help message
    `;
    await bot.sendMessage(msg.chat.id, helpText);
  });

  // --- /play command ---
  bot.onText(/\/play/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, '🎲 Generating your cartela...');
      const cartela = await gm.generateCartela(chatId);

      if (!cartela) {
        await bot.sendMessage(chatId, '⚠️ Failed to generate cartela. Please try again.');
        return;
      }

      await bot.sendMessage(chatId, `🧩 Your cartela:\n${cartela}`);
    } catch (error) {
      console.error('Error in /play handler:', error);
      await bot.sendMessage(chatId, '🚫 An error occurred while starting the game. Please contact support or try again later.');
    }
  });

  // --- Modular command handlers ---
  setupDepositHandler(bot, gm, adminId);       // /deposit, /status
  setupLanguageHandler(bot, gm);               // /language
  setupAdminHandler(bot, gm, adminId);         // /approve, /reject, /sendcard
  setupGameFlowHandler(bot, gm);               // /call, /checkwin
  setupDemoHandler(bot, gm);                   // /demo
}

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Load commands dynamically
const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadCommands(fullPath); // Recursive for subfolders
    } else if (file.endsWith('.js')) {
      const command = require(fullPath);
      if (typeof command === 'function') command(bot);
    }
  });
};

// Load all player commands
loadCommands(path.join(__dirname, 'commands', 'player'));

// Load all admin commands
loadCommands(path.join(__dirname, 'commands', 'admin'));

// Health check
bot.onText(/\/health/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Bot is alive and running.');
});

// Fallback for unknown messages
bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, '🤖 Please use a command like /instruction or /play to get started.');
  }
});

console.log('✅ Telegram Bingo bot is live and polling for commands');

module.exports = bot;

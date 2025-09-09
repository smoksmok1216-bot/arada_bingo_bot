const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true, required: true },
  name: String,
  username: String,
  coins: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  referralCode: String,
  referredBy: String,
  isAdmin: { type: Boolean, default: false },
  language: { type: String, default: 'am' },
  createdAt: { type: Date, default: Date.now }
});

playerSchema.methods.addCoins = function(amount) { this.coins += amount; };
playerSchema.methods.subtractCoins = function(amount) { this.coins = Math.max(0, this.coins - amount); };
playerSchema.methods.incrementWins = function() { this.wins += 1; };

mongoose.model('Player', playerSchema);

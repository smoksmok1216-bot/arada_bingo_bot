const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  cards: Number,
  cost: Number,
  win: Boolean,
  coinsBefore: Number,
  coinsAfter: Number,
  createdAt: { type: Date, default: Date.now }
});

mongoose.model('Game', gameSchema);

import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
  playerId: String,
  cardId: String,
  numbers: [[Number]] // 5x5
}, { _id: false });

const GameSchema = new mongoose.Schema({
  stake: { type: Number, required: true },
  status: { type: String, enum: ['waiting','running','finished'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  players: [String], // telegramId array
  cards: [CardSchema],
  calledNumbers: [Number],
  winner: String, // telegramId
  pot: { type: Number, default: 0 },
  roundCountdownEnd: Date
});

export default mongoose.model('Game', GameSchema);

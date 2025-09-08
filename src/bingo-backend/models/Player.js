import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  username: { type: String },
  referralCode: { type: String },
  referrals: [{ type: String }],
  referralCoins: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  banned: { type: Boolean, default: false }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

const Player = mongoose.model('Player', PlayerSchema);
export default Player;

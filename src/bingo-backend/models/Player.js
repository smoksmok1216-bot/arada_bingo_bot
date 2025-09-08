import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  username: { type: String },
  referralCode: { type: String }, // used to invite others
  referrals: [{ type: String }],  // list of telegramIds invited
  referralCoins: { type: Number, default: 0 }, // reward tracker
  balance: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', PlayerSchema);
export default Player;

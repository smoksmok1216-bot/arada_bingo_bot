import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  username: { type: String },
  referralCode: { type: String }, // used to invite others
  referrals: [{ type: String }],  // list of telegramIds invited
  referralCoins: { type: Number, default: 0 }, // reward tracker
  balance: { type: Number, default: 0 }, // for payouts or future features
  coins: { type: Number, default: 0 }, // used for gameplay
  wins: { type: Number, default: 0 }, // total Bingo wins
  isAdmin: { type: Boolean, default: false }, // admin access
  banned: { type: Boolean, default: false } // moderation flag
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const Player = mongoose.model('Player', PlayerSchema);
export default Player;

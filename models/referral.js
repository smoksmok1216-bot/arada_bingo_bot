const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  inviterId: { type: String, required: true },
  invitedId: { type: String, required: true },
  bonusGiven: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

mongoose.model('Referral', referralSchema);

const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  amount: { type: Number, required: true },
  screenshot: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: String
});

mongoose.model('Deposit', depositSchema);

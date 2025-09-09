const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['telebirr', 'cbe', 'amole', 'other'], required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
  reviewedBy: String,
  adminNote: String
});

mongoose.model('Payout', payoutSchema);

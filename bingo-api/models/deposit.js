const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  screenshot: {
    type: String, // base64 string or image URL
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: String // optional: admin name or ID
});

mongoose.model('Deposit', depositSchema);

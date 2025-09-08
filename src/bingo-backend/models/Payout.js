import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  username: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: Date.now }
});

const Payout = mongoose.model('Payout', PayoutSchema);
export default Payout;

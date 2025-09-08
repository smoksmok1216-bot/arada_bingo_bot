import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit','withdrawal'], required: true },
  playerId: String,
  amount: Number,
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  adminNote: String
});

export default mongoose.model('Transaction', TransactionSchema);

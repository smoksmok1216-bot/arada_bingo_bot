import mongoose from 'mongoose';

const DepositConfirmationSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  username: { type: String },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CBE', 'CBE_BIRR', 'TELEBIRR'], required: true },
  txId: { type: String, required: true },
  phone: { type: String }, // optional phone number
  screenshot: { type: String }, // optional image path
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

export default mongoose.model('DepositConfirmation', DepositConfirmationSchema);

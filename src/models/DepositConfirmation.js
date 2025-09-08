import mongoose from 'mongoose';

const DepositConfirmationSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, index: true },
  username: { type: String },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CBE', 'CBE_BIRR', 'TELEBIRR'], required: true },
  txId: { type: String, required: true },
  phone: { type: String },
  screenshot: { type: String }, // path to uploaded file
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const DepositConfirmation = mongoose.model('DepositConfirmation', DepositConfirmationSchema);
export default DepositConfirmation;

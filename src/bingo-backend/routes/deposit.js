import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import DepositConfirmation from '../models/DepositConfirmation.js';

const router = express.Router();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup for screenshot uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /deposit/confirm — user submits deposit
router.post('/confirm', upload.single('screenshot'), async (req, res) => {
  const { telegramId, username, amount, method, txId, phone } = req.body;
  const screenshotPath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!telegramId || !amount || !method || !txId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const deposit = new DepositConfirmation({
      telegramId,
      username,
      amount,
      method,
      txId,
      phone,
      screenshot: screenshotPath,
      status: 'pending',
      submittedAt: new Date()
    });

    await deposit.save();

    res.status(200).json({
      success: true,
      message: '✅ Deposit submitted successfully',
      depositId: deposit._id
    });
  } catch (err) {
    console.error('❌ Deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during deposit submission' });
  }
});

export default router;

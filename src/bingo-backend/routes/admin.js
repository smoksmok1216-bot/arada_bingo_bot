import express from 'express';
import multer from 'multer';
import { Player } from '../models/Player.js';
import { DepositConfirmation } from '../models/DepositConfirmation.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /deposit/confirm — user submits deposit with screenshot
router.post('/confirm', upload.single('screenshot'), async (req, res) => {
  const { telegramId, amount, method, txId, phone } = req.body;
  const screenshotPath = req.file?.path;

  // Basic validation
  if (!telegramId || !amount || !method || !txId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (Number(amount) < 30) {
    return res.status(400).json({ success: false, message: 'Minimum deposit is 30 Br' });
  }

  if (!['CBE', 'CBE_BIRR', 'TELEBIRR'].includes(method)) {
    return res.status(400).json({ success: false, message: 'Invalid deposit method' });
  }

  try {
    const player = await Player.findOne({ telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const confirmation = new DepositConfirmation({
      telegramId,
      username: player.username,
      amount,
      method,
      txId,
      phone,
      screenshot: screenshotPath,
      status: 'pending',
      submittedAt: new Date()
    });

    await confirmation.save();
    res.status(200).json({ success: true, message: '✅ Deposit submitted with screenshot' });
  } catch (err) {
    console.error('❌ Deposit confirm error:', err);
    res.status(500).json({ success: false, message: 'Server error during deposit confirmation' });
  }
});

export default router;

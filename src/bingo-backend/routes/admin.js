import express from 'express';
import DepositConfirmation from '../models/DepositConfirmation.js';
import Player from '../models/Player.js';

const router = express.Router();

// ✅ View all deposit confirmations
router.get('/deposits', async (req, res) => {
  try {
    const deposits = await DepositConfirmation.find().sort({ submittedAt: -1 });
    res.status(200).json({ success: true, deposits });
  } catch (err) {
    console.error('Admin deposits error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching deposits' });
  }
});

// ✅ Approve deposit and credit coins
router.post('/approve-deposit/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deposit = await DepositConfirmation.findById(id);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Deposit not found or already processed' });
    }

    const player = await Player.findOne({ telegramId: deposit.telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    player.coins += deposit.amount;
    await player.save();

    deposit.status = 'approved';
    deposit.processedAt = new Date();
    await deposit.save();

    res.status(200).json({ success: true, message: `✅ Deposit approved and ${deposit.amount} coins credited` });
  } catch (err) {
    console.error('Approve deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during approval' });
  }
});

// ✅ Reject deposit
router.post('/reject-deposit/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deposit = await DepositConfirmation.findById(id);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Deposit not found or already processed' });
    }

    deposit.status = 'rejected';
    deposit.processedAt = new Date();
    await deposit.save();

    res.status(200).json({ success: true, message: '❌ Deposit rejected' });
  } catch (err) {
    console.error('Reject deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during rejection' });
  }
});

export default router;

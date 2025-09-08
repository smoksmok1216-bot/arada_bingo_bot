import express from 'express';
import mongoose from 'mongoose';
import DepositConfirmation from '../models/DepositConfirmation.js';
import Player from '../models/Player.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// ✅ View all deposit confirmations
router.get('/deposits', adminAuth, async (req, res) => {
  try {
    const deposits = await DepositConfirmation.find().sort({ submittedAt: -1 });
    res.status(200).json({ success: true, deposits });
  } catch (err) {
    console.error('❌ Admin deposits error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching deposits' });
  }
});

// ✅ Approve deposit and credit coins
router.post('/approve-deposit/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid deposit ID' });
  }

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

    res.status(200).json({
      success: true,
      message: `✅ Deposit approved and ${deposit.amount} coins credited`,
      depositId: deposit._id,
      playerId: player._id,
      newBalance: player.coins
    });
  } catch (err) {
    console.error('❌ Approve deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during approval' });
  }
});

// ✅ Reject deposit with optional reason
router.post('/reject-deposit/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid deposit ID' });
  }

  try {
    const deposit = await DepositConfirmation.findById(id);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Deposit not found or already processed' });
    }

    deposit.status = 'rejected';
    deposit.processedAt = new Date();
    if (reason) deposit.notes = reason;
    await deposit.save();

    res.status(200).json({
      success: true,
      message: '❌ Deposit rejected',
      depositId: deposit._id,
      reason: reason || 'No reason provided'
    });
  } catch (err) {
    console.error('❌ Reject deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during rejection' });
  }
});

export default router;

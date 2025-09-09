import express from 'express';
import Payout from '../models/Payout.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// ✅ Admin: view all payouts
router.get('/', adminAuth, async (req, res) => {
  try {
    const payouts = await Payout.find().sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      total: payouts.length,
      payouts: payouts.map(p => ({
        telegramId: p.telegramId,
        username: p.username,
        amount: p.amount,
        status: p.status,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        notes: p.notes || ''
      }))
    });
  } catch (err) {
    console.error('❌ Admin payout fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching payouts' });
  }
});

// ✅ User: view own payout history
router.get('/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const payouts = await Payout.find({ telegramId }).sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      total: payouts.length,
      payouts: payouts.map(p => ({
        amount: p.amount,
        status: p.status,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        notes: p.notes || ''
      }))
    });
  } catch (err) {
    console.error('❌ User payout fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching payout history' });
  }
});

export default router;

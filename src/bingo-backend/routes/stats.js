import express from 'express';
import Player from '../models/Player.js';
import DepositConfirmation from '../models/DepositConfirmation.js';
import Payout from '../models/Payout.js';

const router = express.Router();

// GET /stats — system-wide analytics
router.get('/', async (req, res) => {
  try {
    const totalPlayers = await Player.countDocuments();
    const totalDeposits = await DepositConfirmation.countDocuments();
    const totalPayouts = await Payout.countDocuments();
    const totalCoins = await Player.aggregate([
      { $group: { _id: null, total: { $sum: '$coins' } } }
    ]);
    const topReferrer = await Player.findOne().sort({ referralCoins: -1 }).select('telegramId username referralCoins');
    const topWinner = await Player.findOne().sort({ wins: -1 }).select('telegramId username wins');

    res.status(200).json({
      success: true,
      stats: {
        totalPlayers,
        totalDeposits,
        totalPayouts,
        totalCoins: totalCoins[0]?.total || 0,
        topReferrer,
        topWinner
      }
    });
  } catch (err) {
    console.error('❌ Stats error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching stats' });
  }
});

export default router;

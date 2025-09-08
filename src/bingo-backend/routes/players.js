import express from 'express';
import Player from '../models/Player.js';
import Payout from '../models/Payout.js';

const router = express.Router();

// ✅ Health check
router.get('/', (req, res) => {
  res.send('Players route is working ✅');
});

// ✅ Play Bingo — adds coins and win count
router.post('/:telegramId/play', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const player = await Player.findOne({ telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    player.coins += 5;
    player.wins += 1;
    await player.save();

    res.status(200).json({
      success: true,
      message: '🎉 Bingo played successfully',
      coins: player.coins,
      wins: player.wins
    });
  } catch (err) {
    console.error('❌ Play error:', err);
    res.status(500).json({ success: false, message: 'Server error during play' });
  }
});

// ✅ Leaderboard — top 10 by wins
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await Player.find({})
      .sort({ wins: -1 })
      .limit(10)
      .select('telegramId username wins referralCoins');

    res.status(200).json({ success: true, leaderboard: topPlayers });
  } catch (err) {
    console.error('❌ Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching leaderboard' });
  }
});

// ✅ Payout request with rules
router.post('/:telegramId/payout', async (req, res) => {
  const { telegramId } = req.params;
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  try {
    const player = await Player.findOne({ telegramId });
    if (!player || player.coins < amount) {
      return res.status(400).json({ success: false, message: 'Not enough coins for this payout' });
    }

    if (amount < 50 || amount > 500) {
      return res.status(400).json({ success: false, message: 'Amount must be between 50 and 500 Br' });
    }

    const lastPayout = await Payout.findOne({ telegramId }).sort({ requestedAt: -1 });
    if (lastPayout) {
      const now = new Date();
      const diff = (now - lastPayout.requestedAt) / 1000;
      if (diff < 300) {
        return res.status(400).json({ success: false, message: 'Please wait 5 minutes before next payout' });
      }
    }

    const payout = new Payout({
      telegramId,
      username: player.username,
      amount,
      status: 'approved',
      requestedAt: new Date(),
      processedAt: new Date()
    });

    player.coins -= amount;
    await player.save();
    await payout.save();

    res.status(200).json({
      success: true,
      message: '✅ Payout approved',
      payoutId: payout._id
    });
  } catch (err) {
    console.error('❌ Payout error:', err);
    res.status(500).json({ success: false, message: 'Server error during payout request' });
  }
});

// ✅ Payout history
router.get('/:telegramId/payouts', async (req, res) => {
  const { telegramId } = req.params;

  try {
    const payouts = await Payout.find({ telegramId }).sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      payouts: payouts.map(p => ({
        amount: p.amount,
        status: p.status,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt
      }))
    });
  } catch (err) {
    console.error('❌ Payout history error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching payout history' });
  }
});

export default router;

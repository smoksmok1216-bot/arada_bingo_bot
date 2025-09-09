const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

const Player = mongoose.model('Player');
const Deposit = mongoose.model('Deposit');
const Payout = mongoose.model('Payout');

// 🔐 Admin token check
const checkAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Unauthorized admin access' });
  }
  next();
};

// 👤 Get player profile
router.get('/players/:telegramId', async (req, res) => {
  const player = await Player.findOne({ telegramId: req.params.telegramId });
  if (!player) return res.status(404).json({ message: 'Player not found' });

  res.json({
    name: player.name,
    username: player.username,
    coins: player.coins,
    wins: player.wins,
    referralCode: player.referralCode,
    referredBy: player.referredBy,
    isAdmin: player.isAdmin,
    language: player.language
  });
});

// 🎮 Start game
router.post('/game/start', async (req, res) => {
  const { telegramId, cards } = req.body;
  const cost = parseInt(cards) * 2;
  const player = await Player.findOne({ telegramId });

  if (!player || player.coins < cost) {
    return res.json({ win: false, message: 'Not enough coins' });
  }

  player.subtractCoins(cost);
  const win = Math.random() < 0.3;
  if (win) {
    player.incrementWins();
    player.addCoins(5);
  }

  await player.save();
  res.json({ win, message: win ? 'You won!' : 'Better luck next time' });
});

// 💰 Submit deposit
router.post('/deposit', async (req, res) => {
  const { telegramId, amount, screenshot } = req.body;
  const deposit = new Deposit({ telegramId, amount, screenshot, status: 'pending' });
  await deposit.save();
  res.json({ message: 'Deposit submitted' });
});

// 📋 View all deposits (admin)
router.get('/deposit/all', checkAdmin, async (req, res) => {
  const deposits = await Deposit.find().sort({ createdAt: -1 });
  res.json({ deposits });
});

// ✅ Approve deposit (admin)
router.post('/admin/approve/:id', checkAdmin, async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);
  if (!deposit || deposit.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid deposit' });
  }

  const player = await Player.findOne({ telegramId: deposit.telegramId });
  if (!player) return res.status(404).json({ message: 'Player not found' });

  player.addCoins(deposit.amount);
  deposit.status = 'approved';
  deposit.reviewedAt = new Date();
  await player.save();
  await deposit.save();
  res.json({ message: 'Deposit approved' });
});

// ❌ Reject deposit (admin)
router.post('/admin/reject/:id', checkAdmin, async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);
  if (!deposit || deposit.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid deposit' });
  }

  deposit.status = 'rejected';
  deposit.reviewedAt = new Date();
  await deposit.save();
  res.json({ message: 'Deposit rejected' });
});

// 📊 Stats (admin)
router.get('/stats', checkAdmin, async (req, res) => {
  const totalPlayers = await Player.countDocuments();
  const totalDeposits = await Deposit.countDocuments();
  const totalPayouts = await Payout.countDocuments();
  res.json({ totalPlayers, totalDeposits, totalPayouts });
});

module.exports = router;

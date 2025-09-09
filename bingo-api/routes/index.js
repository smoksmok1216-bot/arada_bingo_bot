const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

const Player = mongoose.model('Player');
const Deposit = mongoose.model('Deposit');
const Payout = mongoose.model('Payout');
const Referral = mongoose.model('Referral');

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

// 🧑‍🤝‍🧑 Track referral
router.post('/referral/track', async (req, res) => {
  const { inviterId, invitedId } = req.body;
  const existing = await Referral.findOne({ invitedId });
  if (existing) return res.status(200).json({ message: 'Already tracked' });

  const referral = new Referral({ inviterId, invitedId });
  await referral.save();
  res.status(200).json({ message: 'Referral tracked' });
});

// 🎁 Give referral bonus
router.post('/referral/bonus', async (req, res) => {
  const { invitedId } = req.body;
  const referral = await Referral.findOne({ invitedId });
  if (!referral || referral.bonusGiven) return res.status(400).json({ message: 'Invalid or already rewarded' });

  const inviter = await Player.findOne({ telegramId: referral.inviterId });
  if (!inviter) return res.status(404).json({ message: 'Inviter not found' });

  inviter.addCoins(5);
  referral.bonusGiven = true;
  await inviter.save();
  await referral.save();
  res.status(200).json({ message: 'Bonus given' });
});

// 🏆 Leaderboard
router.get('/leaderboard', async (req, res) => {
  const topPlayers = await Player.find().sort({ wins: -1 }).limit(10);
  res.status(200).json({ leaderboard: topPlayers });
});

// 💸 Submit payout
router.post('/payout/submit', async (req, res) => {
  const { telegramId, amount, method } = req.body;
  if (!telegramId || !amount || !method) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const payout = new Payout({ telegramId, amount, method, status: 'pending' });
  await payout.save();
  res.status(200).json({ message: 'Payout request submitted' });
});

// 📜 Get payout history
router.get('/payouts', async (req, res) => {
  const { telegramId } = req.query;
  const payouts = await Payout.find({ telegramId }).sort({ createdAt: -1 });
  res.status(200).json({ payouts });
});

// 📋 View all payouts (admin)
router.get('/payout/all', checkAdmin, async (req, res) => {
  const payouts = await Payout.find().sort({ createdAt: -1 });
  res.json({ payouts });
});

// ✅ Approve payout (admin)
router.post('/admin/payout/approve/:id', checkAdmin, async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout || payout.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid payout' });
  }

  payout.status = 'sent';
  payout.processedAt = new Date();
  payout.reviewedBy = 'admin';
  await payout.save();
  res.json({ message: 'Payout approved' });
});

// ❌ Reject payout (admin)
router.post('/admin/payout/reject/:id', checkAdmin, async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout || payout.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid payout' });
  }

  payout.status = 'failed';
  payout.processedAt = new Date();
  payout.reviewedBy = 'admin';
  payout.adminNote = req.body.note || 'Rejected';
  await payout.save();
  res.json({ message: 'Payout rejected' });
});

module.exports = router;

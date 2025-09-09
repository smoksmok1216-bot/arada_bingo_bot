const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

const Player = mongoose.model('Player');
const Deposit = mongoose.model('Deposit');
const Payout = mongoose.model('Payout');
const Referral = mongoose.model('Referral');
const Game = mongoose.model('Game');

// 🔐 Admin token check
const checkAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Unauthorized admin access' });
  }
  next();
};

// 👤 Ensure player exists (helper)
async function ensurePlayer(telegramId) {
  let player = await Player.findOne({ telegramId });
  if (!player) {
    player = new Player({ telegramId, coins: 0, wins: 0 });
    await player.save();
  }
  return player;
}

// 👤 Get player profile
router.get('/players/:telegramId', async (req, res) => {
  try {
    const player = await ensurePlayer(req.params.telegramId);
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
  } catch (e) {
    res.status(500).json({ message: 'Error loading profile' });
  }
});

// 🎮 Start game
router.post('/game/start', async (req, res) => {
  try {
    const { telegramId, cards } = req.body;
    if (!telegramId || !cards) {
      return res.status(400).json({ win: false, message: 'Missing telegramId or cards' });
    }

    const cardsInt = parseInt(cards, 10);
    if (isNaN(cardsInt) || cardsInt <= 0) {
      return res.status(400).json({ win: false, message: 'Invalid cards value' });
    }

    const cost = cardsInt * 2;
    const player = await ensurePlayer(telegramId);

    if (player.coins < cost) {
      return res.json({ win: false, message: 'Not enough coins' });
    }

    const coinsBefore = player.coins;
    player.subtractCoins(cost);

    // Simple win chance; adjust as needed
    const win = Math.random() < 0.3;

    if (win) {
      player.incrementWins();
      player.addCoins(5); // reward
    }

    await player.save();

    // Save game history
    const game = new Game({
      telegramId,
      cards: cardsInt,
      cost,
      win,
      coinsBefore,
      coinsAfter: player.coins
    });
    await game.save();

    res.json({ win, message: win ? 'You won!' : 'Better luck next time' });
  } catch (e) {
    res.status(500).json({ win: false, message: 'Error starting game' });
  }
});

// 📈 Game history
router.get('/game/history/:telegramId', async (req, res) => {
  try {
    const history = await Game.find({ telegramId: req.params.telegramId }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (e) {
    res.status(500).json({ message: 'Error loading history' });
  }
});

// 💰 Submit deposit
router.post('/deposit', async (req, res) => {
  try {
    const { telegramId, amount, screenshot } = req.body;
    if (!telegramId || !amount || !screenshot) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    await ensurePlayer(telegramId);

    const deposit = new Deposit({
      telegramId,
      amount: amountNum,
      screenshot,
      status: 'pending'
    });
    await deposit.save();
    res.json({ message: 'Deposit submitted' });
  } catch (e) {
    res.status(500).json({ message: 'Error submitting deposit' });
  }
});

// 📋 View all deposits (admin)
router.get('/deposit/all', checkAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.json({ deposits });
  } catch (e) {
    res.status(500).json({ message: 'Error loading deposits' });
  }
});

// ✅ Approve deposit (admin)
router.post('/admin/approve/:id', checkAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid deposit' });
    }

    const player = await ensurePlayer(deposit.telegramId);
    player.addCoins(deposit.amount);

    deposit.status = 'approved';
    deposit.reviewedAt = new Date();
    deposit.reviewedBy = req.headers['x-admin-name'] || 'admin';

    await player.save();
    await deposit.save();
    res.json({ message: 'Deposit approved' });
  } catch (e) {
    res.status(500).json({ message: 'Error approving deposit' });
  }
});

// ❌ Reject deposit (admin)
router.post('/admin/reject/:id', checkAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid deposit' });
    }

    deposit.status = 'rejected';
    deposit.reviewedAt = new Date();
    deposit.reviewedBy = req.headers['x-admin-name'] || 'admin';
    await deposit.save();
    res.json({ message: 'Deposit rejected' });
  } catch (e) {
    res.status(500).json({ message: 'Error rejecting deposit' });
  }
});

// 💸 Submit payout
router.post('/payout/submit', async (req, res) => {
  try {
    const { telegramId, amount, method } = req.body;
    if (!telegramId || !amount || !method) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!['telebirr', 'cbe', 'amole', 'other'].includes(String(method))) {
      return res.status(400).json({ message: 'Invalid method' });
    }

    await ensurePlayer(telegramId);

    const payout = new Payout({ telegramId, amount: amountNum, method, status: 'pending' });
    await payout.save();
    res.status(200).json({ message: 'Payout request submitted' });
  } catch (e) {
    res.status(500).json({ message: 'Error submitting payout' });
  }
});

// 📜 Get payout history (player)
router.get('/payouts', async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ message: 'Missing telegramId' });
    const payouts = await Payout.find({ telegramId }).sort({ createdAt: -1 });
    res.status(200).json({ payouts });
  } catch (e) {
    res.status(500).json({ message: 'Error loading payouts' });
  }
});

// 📋 View all payouts (admin)
router.get('/payout/all', checkAdmin, async (req, res) => {
  try {
    const payouts = await Payout.find().sort({ createdAt: -1 });
    res.json({ payouts });
  } catch (e) {
    res.status(500).json({ message: 'Error loading payouts' });
  }
});

// ✅ Approve payout (admin)
router.post('/admin/payout/approve/:id', checkAdmin, async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout || payout.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid payout' });
    }

    payout.status = 'sent';
    payout.processedAt = new Date();
    payout.reviewedBy = req.headers['x-admin-name'] || 'admin';
    await payout.save();
    res.json({ message: 'Payout approved' });
  } catch (e) {
    res.status(500).json({ message: 'Error approving payout' });
  }
});

// ❌ Reject payout (admin)
router.post('/admin/payout/reject/:id', checkAdmin, async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout || payout.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid payout' });
    }

    payout.status = 'failed';
    payout.processedAt = new Date();
    payout.reviewedBy = req.headers['x-admin-name'] || 'admin';
    payout.adminNote = req.body?.note || 'Rejected';
    await payout.save();
    res.json({ message: 'Payout rejected' });
  } catch (e) {
    res.status(500).json({ message: 'Error rejecting payout' });
  }
});

// 🧑‍🤝‍🧑 Track referral
router.post('/referral/track', async (req, res) => {
  try {
    const { inviterId, invitedId } = req.body;
    if (!inviterId || !invitedId) {
      return res.status(400).json({ message: 'Missing inviterId or invitedId' });
    }
    const existing = await Referral.findOne({ invitedId });
    if (existing) return res.status(200).json({ message: 'Already tracked' });

    await ensurePlayer(invitedId);
    await ensurePlayer(inviterId);

    const referral = new Referral({ inviterId, invitedId });
    await referral.save();
    res.status(200).json({ message: 'Referral tracked' });
  } catch (e) {
    res.status(500).json({ message: 'Error tracking referral' });
  }
});

// 🎁 Give referral bonus (to inviter)
router.post('/referral/bonus', async (req, res) => {
  try {
    const { invitedId } = req.body;
    if (!invitedId) return res.status(400).json({ message: 'Missing invitedId' });

    const referral = await Referral.findOne({ invitedId });
    if (!referral || referral.bonusGiven) {
      return res.status(400).json({ message: 'Invalid or already rewarded' });
    }

    const inviter = await ensurePlayer(referral.inviterId);
    inviter.addCoins(5); // referral bonus
    referral.bonusGiven = true;

    await inviter.save();
    await referral.save();
    res.status(200).json({ message: 'Bonus given' });
  } catch (e) {
    res.status(500).json({ message: 'Error giving bonus' });
  }
});

// 🏆 Leaderboard (top by wins)
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await Player.find().sort({ wins: -1 }).limit(10);
    res.status(200).json({ leaderboard: topPlayers });
  } catch (e) {
    res.status(500).json({ message: 'Error loading leaderboard' });
  }
});

// 📊 Stats (admin)
router.get('/stats', checkAdmin, async (req, res) => {
  try {
    const totalPlayers = await Player.countDocuments();
    const totalDeposits = await Deposit.countDocuments();
    const totalPayouts = await Payout.countDocuments();
    res.json({ totalPlayers, totalDeposits, totalPayouts });
  } catch (e) {
    res.status(500).json({ message: 'Error loading stats' });
  }
});

module.exports = router;

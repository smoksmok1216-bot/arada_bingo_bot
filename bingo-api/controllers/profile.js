const mongoose = require('mongoose');
const Player = mongoose.model('Player');

module.exports.profileRead = async function (req, res) {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).json({ message: 'Missing telegramId' });

  const player = await Player.findOne({ telegramId });
  if (!player) return res.status(404).json({ message: 'Player not found' });

  res.status(200).json({
    name: player.name,
    username: player.username,
    coins: player.coins,
    wins: player.wins,
    referralCode: player.referralCode,
    referredBy: player.referredBy,
    isAdmin: player.isAdmin,
    language: player.language
  });
};

module.exports.setNewBalance = async function (req, res) {
  const { telegramId, newSum, spending } = req.body;
  const player = await Player.findOne({ telegramId });
  if (!player) return res.status(404).json({ message: 'Player not found' });

  spending ? player.subtractCoins(newSum) : player.addCoins(newSum);
  await player.save();
  res.status(200).json({ coins: player.coins });
};

module.exports.setWins = async function (req, res) {
  const { telegramId, wins } = req.body;
  const player = await Player.findOne({ telegramId });
  if (!player) return res.status(404).json({ message: 'Player not found' });

  player.wins += wins;
  await player.save();
  res.status(200).json({ wins: player.wins });
};

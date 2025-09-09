const mongoose = require('mongoose');
const Player = mongoose.model('Player');

module.exports.getLeaderboard = async function (req, res) {
  const topPlayers = await Player.find().sort({ wins: -1 }).limit(10);
  res.status(200).json({ leaderboard: topPlayers });
};

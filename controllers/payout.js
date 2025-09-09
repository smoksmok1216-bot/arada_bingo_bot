const mongoose = require('mongoose');
const Payout = mongoose.model('Payout');

module.exports.submitPayout = async function (req, res) {
  const { telegramId, amount, method } = req.body;
  if (!telegramId || !amount || !method) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const payout = new Payout({ telegramId, amount, method, status: 'pending' });
  await payout.save();
  res.status(200).json({ message: 'Payout request submitted' });
};

module.exports.getPayouts = async function (req, res) {
  const { telegramId } = req.query;
  const payouts = await Payout.find({ telegramId }).sort({ createdAt: -1 });
  res.status(200).json({ payouts });
};

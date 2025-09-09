const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Referral = mongoose.model('Referral');

module.exports.trackReferral = async function (req, res) {
  const { inviterId, invitedId } = req.body;
  const existing = await Referral.findOne({ invitedId });
  if (existing) return res.status(200).json({ message: 'Already tracked' });

  const referral = new Referral({ inviterId, invitedId });
  await referral.save();
  res.status(200).json({ message: 'Referral tracked' });
};

module.exports.giveBonus = async function (req, res) {
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
};

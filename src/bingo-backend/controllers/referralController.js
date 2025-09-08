import Player from '../models/Player.js';

// GET /referral/:telegramId — show referral stats
export const getReferralStats = async (req, res) => {
  const { telegramId } = req.params;

  try {
    const player = await Player.findOne({ telegramId });

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.status(200).json({
      success: true,
      referralCode: player.referralCode || telegramId,
      referrals: player.referrals?.length || 0,
      coinsEarned: player.referralCoins || 0
    });
  } catch (err) {
    console.error('Error fetching referral stats:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching referral stats' });
  }
};

// POST /referral/:referralCode — triggered when a user joins via referral
export const updateReferralStats = async (req, res) => {
  const { referralCode } = req.params;
  const { newUserId } = req.body;

  try {
    const inviter = await Player.findOne({ referralCode });

    if (!inviter) {
      return res.status(404).json({ success: false, message: 'Referral code not found' });
    }

    if (inviter.referrals.includes(newUserId)) {
      return res.status(200).json({ success: false, message: 'User already referred' });
    }

    inviter.referrals.push(newUserId);
    inviter.referralCoins += 2;
    await inviter.save();

    console.log(`✅ Referral recorded: ${referralCode} → ${newUserId}`);

    res.status(200).json({ success: true, message: 'Referral recorded and coins rewarded' });
  } catch (err) {
    console.error('Referral update error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating referral stats' });
  }
};

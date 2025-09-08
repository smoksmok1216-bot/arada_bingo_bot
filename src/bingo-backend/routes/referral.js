import express from 'express';
import { getReferralStats, updateReferralStats } from '../controllers/referralController.js';

const router = express.Router();

// GET referral stats for a player
router.get('/:telegramId', getReferralStats);

// POST new referral — triggered when a user joins via referral link
router.post('/:referralCode', updateReferralStats);

export default router;

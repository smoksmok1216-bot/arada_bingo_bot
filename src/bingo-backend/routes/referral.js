import express from 'express';
import { getReferralStats, updateReferralStats, getTopReferrers } from '../controllers/referralController.js';
import { body, param } from 'express-validator';

const router = express.Router();

// ✅ GET referral stats for a player
router.get('/:telegramId', [
  param('telegramId').notEmpty().withMessage('telegramId is required')
], getReferralStats);

// ✅ POST new referral — triggered when a user joins via referral link
router.post('/:referralCode', [
  param('referralCode').notEmpty().withMessage('referralCode is required'),
  body('telegramId').notEmpty().withMessage('telegramId is required'),
  body('username').optional()
], updateReferralStats);

// ✅ GET top referrers — optional leaderboard
router.get('/top/list', getTopReferrers);

export default router;

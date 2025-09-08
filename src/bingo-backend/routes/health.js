// src/bingo-backend/routes/health.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Health check passed ✅');
});

export default router;

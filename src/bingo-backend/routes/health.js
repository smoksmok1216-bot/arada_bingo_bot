import express from 'express';
const router = express.Router();

// GET /health — basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    message: '🩺 Arada Bingo backend is healthy'
  });
});

export default router;

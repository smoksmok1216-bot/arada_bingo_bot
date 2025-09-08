import express from 'express';
import Player from '../models/Player.js';

const router = express.Router();

// In-memory game state (replace with DB later if needed)
const gameState = {};

// ✅ Generate Bingo card
router.get('/card/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  // Generate a 5x5 Bingo card with random numbers
  const card = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => Math.floor(Math.random() * 75) + 1)
  );

  gameState[telegramId] = {
    card,
    marked: [],
    hasWon: false
  };

  res.status(200).json({
    success: true,
    message: '🎯 Bingo card generated',
    card
  });
});

// ✅ Mark a number
router.post('/mark/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  const { number } = req.body;

  const game = gameState[telegramId];
  if (!game) {
    return res.status(404).json({ success: false, message: 'No active game for this user' });
  }

  if (game.marked.includes(number)) {
    return res.status(400).json({ success: false, message: 'Number already marked' });
  }

  game.marked.push(number);

  // Simple win check: 5 numbers marked
  if (game.marked.length >= 5) {
    game.hasWon = true;
  }

  res.status(200).json({
    success: true,
    message: `✅ Number ${number} marked`,
    marked: game.marked,
    hasWon: game.hasWon
  });
});

// ✅ Get game status
router.get('/status/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  const game = gameState[telegramId];

  if (!game) {
    return res.status(404).json({ success: false, message: 'No active game for this user' });
  }

  res.status(200).json({
    success: true,
    card: game.card,
    marked: game.marked,
    hasWon: game.hasWon
  });
});

export default router;

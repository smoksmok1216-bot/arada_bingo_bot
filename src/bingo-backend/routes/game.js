import express from 'express';
import Player from '../models/Player.js';
import { getAudioPath } from '../utils/audioPlayer.js';

const router = express.Router();

// In-memory game state (replace with DB later if needed)
const gameState = {};

// ✅ Generate Bingo card
router.get('/card/:telegramId', async (req, res) => {
  const { telegramId } = req.params;

  // Generate a 5x5 Bingo card with unique numbers
  const used = new Set();
  const card = Array.from({ length: 5 }, () => {
    const row = [];
    while (row.length < 5) {
      const num = Math.floor(Math.random() * 75) + 1;
      if (!used.has(num)) {
        used.add(num);
        row.push(num);
      }
    }
    return row;
  });

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

  // Find and mark the number
  let found = false;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (game.card[row][col] === number) {
        game.marked.push({ row, col });
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    return res.status(400).json({ success: false, message: 'Number not found on card' });
  }

  // Check for win
  const hasWon = checkWin(game.marked);
  game.hasWon = hasWon;

  let audio = getAudioPath('row-filled');
  let message = `✅ Number ${number} marked`;

  if (hasWon) {
    audio = getAudioPath('bingo-win');
    message = '🎉 ቢንጎ አሸንፈህ!';

    // Optional: reward coins
    const player = await Player.findOne({ telegramId });
    if (player) {
      player.coins = (player.coins || 0) + 5;
      await player.save();
    }
  }

  res.status(200).json({
    success: true,
    message,
    marked: game.marked,
    hasWon,
    audio
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

// ✅ Smart win detection
function checkWin(marked) {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
  marked.forEach(({ row, col }) => {
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      grid[row][col] = true;
    }
  });

  for (let i = 0; i < 5; i++) {
    if (grid[i].every(cell => cell)) return true; // row
    if (grid.map(r => r[i]).every(cell => cell)) return true; // column
  }

  const diag1 = [0, 1, 2, 3, 4].every(i => grid[i][i]);
  const diag2 = [0, 1, 2, 3, 4].every(i => grid[i][4 - i]);

  return diag1 || diag2;
}

export default router;

import Player from '../models/Player.js';
import { getAudioPath } from '../utils/audioPlayer.js';

// Generate a 5x5 Bingo card with numbers 1–75
export async function generateCard(req, res) {
  const card = [];
  const used = new Set();

  for (let i = 0; i < 5; i++) {
    const row = [];
    while (row.length < 5) {
      const num = Math.floor(Math.random() * 75) + 1;
      if (!used.has(num)) {
        used.add(num);
        row.push(num);
      }
    }
    card.push(row);
  }

  res.status(200).json({ success: true, card });
}

// Mark a cell and check for win
export async function markCell(req, res) {
  const { telegramId, row, col } = req.body;

  if (row == null || col == null || !telegramId) {
    return res.status(400).json({ success: false, message: 'Missing row, col, or telegramId' });
  }

  try {
    const player = await Player.findOne({ telegramId });

    if (!player || !player.card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    player.marked = player.marked || [];
    player.marked.push({ row, col });

    const hasWon = checkWin(player.marked);

    if (hasWon) {
      player.coins += 5;
      await player.save();

      return res.status(200).json({
        success: true,
        message: '🎉 ቢንጎ አሸንፈህ!',
        audio: getAudioPath('bingo-win'),
        coins: player.coins
      });
    }

    await player.save();

    return res.status(200).json({
      success: true,
      message: '✅ Cell marked',
      audio: getAudioPath('row-filled')
    });
  } catch (err) {
    console.error('❌ Error marking cell:', err);
    res.status(500).json({ success: false, message: 'Server error while marking cell' });
  }
}

// Check for win: full row, column, or diagonal
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

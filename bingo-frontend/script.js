const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo123';

async function playBingo() {
  const loading = document.getElementById('loading');
  loading.style.display = 'block';

  try {
    const response = await fetch(`https://arada-bingo-bot.onrender.com/game/card/${telegramId}`);
    const data = await response.json();

    if (data.success) {
      renderCard(data.card);
      document.getElementById('status-message').textContent = '🎯 Card loaded. Tap to play!';
      document.getElementById('win-popup').style.display = 'none';
    } else {
      document.getElementById('status-message').textContent = '❌ Failed to load card';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to start game. Please try again.');
  } finally {
    loading.style.display = 'none';
  }
}

function renderCard(card) {
  const container = document.getElementById('bingo-card');
  container.innerHTML = '';

  card.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'bingo-row';

    row.forEach((cell, colIndex) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'bingo-cell';
      cellDiv.textContent = cell;
      cellDiv.onclick = () => markCell(rowIndex, colIndex, cellDiv);
      rowDiv.appendChild(cellDiv);
    });

    container.appendChild(rowDiv);
  });
}

async function markCell(row, col, cellDiv) {
  try {
    const response = await fetch(`https://arada-bingo-bot.onrender.com/game/mark/${telegramId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col })
    });

    const data = await response.json();

    if (data.success) {
      cellDiv.classList.add('marked');
      document.getElementById('status-message').textContent = data.message;

      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play();
      }

      if (data.hasWon) {
        document.getElementById('win-popup').style.display = 'block';
        updateCoins(data.coins || 0);
      }
    } else {
      document.getElementById('status-message').textContent = '❌ Invalid move';
    }
  } catch (error) {
    console.error('Error marking cell:', error);
    alert('Failed to mark cell. Try again.');
  }
}

function updateCoins(count) {
  document.getElementById('coin-count').textContent = count;
}

// Auto-start game on load
playBingo();

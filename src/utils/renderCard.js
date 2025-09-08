import { createCanvas } from 'canvas';

function renderCard(cardData) {
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 60, 0);
    ctx.lineTo(i * 60, 300);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * 60);
    ctx.lineTo(300, i * 60);
    ctx.stroke();
  }

  // Numbers
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const value = cardData[row][col];
      const x = col * 60 + 30;
      const y = row * 60 + 30;
      ctx.fillText(value, x, y);
    }
  }

  return canvas.toBuffer('image/png');
}

export default renderCard;

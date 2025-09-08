import { nanoid } from 'nanoid';

/**
 * Generates a standard 5x5 Bingo card (numbers 1..75) with B I N G O columns ranges:
 * B:1-15, I:16-30, N:31-45 (center free), G:46-60, O:61-75
 */
export function generateCard() {
  function sample(rangeStart, rangeEnd, count) {
    const arr = [];
    for (let i = rangeStart; i <= rangeEnd; i++) arr.push(i);
    // Fisher-Yates shuffle then slice
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  }

  const card = [[], [], [], [], []]; // 5 rows, each row has 5 columns
  const cols = [
    sample(1, 15, 5),
    sample(16, 30, 5),
    sample(31, 45, 5),
    sample(46, 60, 5),
    sample(61, 75, 5)
  ];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      card[r][c] = cols[c][r];
    }
  }
  // center free
  card[2][2] = 0;

  return { cardId: nanoid(), numbers: card };
}

// check bingo patterns: rows, cols, diagonals, 4 corners
export function checkBingo(cardNumbers, calledSet) {
  const isCalled = (n) => n === 0 || calledSet.has(n);

  // rows
  for (let r = 0; r < 5; r++) {
    let ok = true;
    for (let c = 0; c < 5; c++) if (!isCalled(cardNumbers[r][c])) ok = false;
    if (ok) return true;
  }

  // cols
  for (let c = 0; c < 5; c++) {
    let ok = true;
    for (let r = 0; r < 5; r++) if (!isCalled(cardNumbers[r][c])) ok = false;
    if (ok) return true;
  }

  // main diagonal
  let ok = true;
  for (let i = 0; i < 5; i++) if (!isCalled(cardNumbers[i][i])) ok = false;
  if (ok) return true;

  // anti-diagonal
  ok = true;
  for (let i = 0; i < 5; i++) if (!isCalled(cardNumbers[i][4 - i])) ok = false;
  if (ok) return true;

  // four corners
  if (
    isCalled(cardNumbers[0][0]) &&
    isCalled(cardNumbers[0][4]) &&
    isCalled(cardNumbers[4][0]) &&
    isCalled(cardNumbers[4][4])
  ) return true;

  return false;
}

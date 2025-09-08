export function splitPot(pot) {
  const winner = Math.round((pot * 80) / 100);
  const admin = Math.round((pot * 18) / 100);
  const jackpot = pot - winner - admin; // remainder ~2%
  return { winner, admin, jackpot };
}

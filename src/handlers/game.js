bot.onText(/\/bingo/, (msg) => {
  const playerId = msg.from.id.toString();
  handleBingoClaim(playerId);
});

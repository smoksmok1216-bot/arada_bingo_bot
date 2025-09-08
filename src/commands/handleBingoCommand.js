const { isBingo } = require('../utils/bingoValidator');
const { getRoomByPlayerId } = require('../utils/roomManager');
const { triggerPayment } = require('../utils/payment');

module.exports = async function handleBingoCommand(ctx) {
  const playerId = ctx.from.id.toString();
  const room = getRoomByPlayerId(playerId);

  if (!room) {
    return ctx.reply("❌ You are not in a game room.");
  }

  const player = room.players[playerId];
  if (!player || !player.card) {
    return ctx.reply("❌ You don't have a Bingo card yet.");
  }

  if (player.hasWon) {
    return ctx.reply("✅ You've already won this round.");
  }

  const calledNumbers = room.numberCaller.getCalledNumbers();
  const hasBingo = isBingo(player.card.grid, calledNumbers);

  if (hasBingo) {
    player.hasWon = true;
    room.winners.push(playerId);

    const winMessage = player.language === 'am'
      ? '🎉 ቢንጎ! አሸንፈህ! እንኳን ደስ አለዎት!'
      : '🎉 Bingo! You won! Congratulations!';
    await ctx.reply(winMessage);

    await triggerPayment(playerId, room.prizeAmount);

    // Optional: log win, notify admin, end round
  } else {
    const missMessage = player.language === 'am'
      ? '⏳ አሁን ጊዜ አይደለም። ቢንጎ አልተሳካም።'
      : '⏳ Not yet. That’s not a valid Bingo.';
    await ctx.reply(missMessage);
  }
};

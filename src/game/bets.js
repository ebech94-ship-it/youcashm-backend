let bets = [];

function placeBet(userId, amount, roundId) {
  const bet = {
    id: Date.now() + Math.random(),
    userId,
    amount,
    roundId,
    status: "active",
    cashoutMultiplier: null,
    winAmount: 0,
  };

  bets.push(bet);
  return bet;
}

function getBetsByRound(roundId) {
  return bets.filter(b => b.roundId === roundId);
}


function getActiveBetsByRound(roundId) {
  return bets.filter(
    b => b.roundId === roundId && b.status === "active"
  );
}
function cashout(betId, multiplier) {
  const bet = bets.find(b => b.id === betId);

  if (!bet || bet.status !== "active") return null;

  bet.status = "cashed_out";
  bet.cashoutMultiplier = multiplier;
  bet.winAmount = +(bet.amount * multiplier).toFixed(2);

  return bet;
}

module.exports = {
  placeBet,
  getBetsByRound,
 
  getActiveBetsByRound,
   cashout,
};
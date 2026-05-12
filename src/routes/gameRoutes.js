const express = require("express");
const router = express.Router();

const { startRound, getCurrentRound } = require("../game/roundEngine");
const { placeBet } = require("../game/bets");
const { getBalance } = require("../services/wallet");

// 👉 START ROUND (TEST ONLY)
router.get("/start", (req, res) => {
  startRound();
  res.json({ message: "Round started" });
});

// 👉 GET ROUND
router.get("/round", (req, res) => {
  res.json(getCurrentRound());
});

// 👉 PLACE BET
router.post("/bet", (req, res) => {
  const { userId, amount, roundId } = req.body;

  if (!userId || !amount || !roundId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const bet = placeBet(userId, amount, roundId);

  res.json(bet);
});

// 👉 WALLET BALANCE
router.get("/wallet/:userId", (req, res) => {
  const balance = getBalance(req.params.userId);
  res.json({ balance });
});
router.post("/cashout", (req, res) => {
  const { betId } = req.body;

  const round = getCurrentRound();

  if (!round || round.status !== "running") {
    return res.status(400).json({ error: "Round not active" });
  }

  const result = cashout(betId, round.multiplier);

  if (!result) {
    return res.status(400).json({ error: "Invalid bet or already cashed out" });
  }

  // 💰 credit wallet
  credit(result.userId, result.winAmount);

  console.log(
    `💰 CASHOUT: ${result.userId} | WIN: ${result.winAmount}`
  );

  res.json(result);
});
module.exports = router;
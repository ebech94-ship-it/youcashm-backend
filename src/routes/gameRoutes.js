const express = require("express");
const router = express.Router();

const { startRound, getCurrentRound } = require("../game/roundEngine");
const { placeBet, cashout } = require("../game/bets");
const { getBalance, credit } = require("../services/wallet");

// 👉 START ROUND (SAFE)
router.get("/start", (req, res) => {
  startRound();
  res.json({ message: "Round start requested" });
});

// 👉 GET ROUND
router.get("/round", (req, res) => {
  res.json(getCurrentRound());
});

// 👉 PLACE BET
router.post("/bet", (req, res) => {
  const { userId, amount, roundId } = req.body;

  if (!userId || !amount || !roundId) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  const currentRound = getCurrentRound();

  if (!currentRound || currentRound.status !== "running") {
    return res.status(400).json({
      success: false,
      message: "No active round",
    });
  }

  if (currentRound.roundId !== roundId) {
    return res.status(400).json({
      success: false,
      message: "Invalid round",
    });
  }

  const bet = placeBet(userId, amount, roundId);

  return res.json({
    success: true,
    bet,
  });
});

// 👉 WALLET
router.get("/wallet/:userId", (req, res) => {
  const balance = getBalance(req.params.userId);
  res.json({ balance });
});

// 👉 CASHOUT
router.post("/cashout", (req, res) => {
  const { betId } = req.body;

  const round = getCurrentRound();

  if (!round || round.status !== "running") {
    return res.status(400).json({
      success: false,
      message: "Round not active",
    });
  }

  const result = cashout(betId, round.multiplier);

  if (!result) {
    return res.status(400).json({
      success: false,
      message: "Invalid bet or already cashed out",
    });
  }

  credit(result.userId, result.winAmount);

  return res.json({
    success: true,
    bet: result,
  });
});

module.exports = router;
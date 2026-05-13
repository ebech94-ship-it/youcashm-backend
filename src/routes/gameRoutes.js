const express = require("express");
const router = express.Router();

const { startRound, getCurrentRound } = require("../game/roundEngine");
const { placeBet,  cashout,  } = require("../game/bets");
const { getBalance, credit, } = require("../services/wallet");

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

  // 1. basic validation
  if (!userId || !amount || !roundId) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  // 2. safety check (optional but important)
  const currentRound = getCurrentRound();

  if (!currentRound || currentRound.status !== "running") {
    return res.status(400).json({
      success: false,
      message: "No active round",
    });
  }

  if (currentRound.id !== roundId) {
    return res.status(400).json({
      success: false,
      message: "Invalid round",
    });
  }

  // 3. place bet
  const bet = placeBet(userId, amount, roundId);

  return res.json({
    success: true,
    bet,
  });
});

// 👉 WALLET BALANCE
router.get("/wallet/:userId", (req, res) => {
  const balance = getBalance(req.params.userId);
  res.json({ balance });
});

router.post("/cashout", (req, res) => {
  const { betId } = req.body;

  const round = getCurrentRound();

  // 1. validate round
  if (!round || round.status !== "running") {
    return res.status(400).json({
      success: false,
      message: "Round not active",
    });
  }

  // 2. validate betId
  if (!betId) {
    return res.status(400).json({
      success: false,
      message: "Missing betId",
    });
  }

  // 3. cashout bet
  const result = cashout(betId, round.multiplier);

  if (!result) {
    return res.status(400).json({
      success: false,
      message: "Invalid bet or already cashed out",
    });
  }

  // 4. credit wallet
  credit(result.userId, result.winAmount);

  console.log(
    `💰 CASHOUT SUCCESS: ${result.userId} | WIN: ${result.winAmount}`
  );

  // 5. response
  return res.json({
    success: true,
    bet: result,
  });
});
module.exports = router;
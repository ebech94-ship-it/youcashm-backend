const { getActiveBetsByRound, cashout } = require("./bets");
const { credit } = require("../services/wallet");

console.log("🎮 ENGINE FILE LOADED");

let currentRound = null;
let interval = null;

// 🔥 GLOBAL ENGINE LOCK
let engineLocked = false;

// ======================
// 🎯 ANTI-PREDICTABLE ENGINE
// ======================

let recentRanges = [];

function pickRange() {
  const rand = Math.random();

  // probabilities
  if (rand < 0.35) return "low";       // 35%
  if (rand < 0.75) return "medium";    // 40%
  if (rand < 0.95) return "high";      // 20%
  return "extreme";                    // 5%
}

function generateCrashPoint() {
  const instantRand = Math.random();

  // 💥 EXACT 1.00x instant crash (2%)
  if (instantRand < 0.02) {
    return 1.0;
  }

  let range = pickRange();

  // ======================
  // 🧠 STREAK BALANCER
  // ======================

  const recentMediums = recentRanges
    .slice(-3)
    .filter((r) => r === "medium").length;

  const recentHighs = recentRanges
    .slice(-5)
    .filter((r) => r === "high" || r === "extreme").length;

  // punish easy streaks
  if (recentMediums >= 3 && Math.random() < 0.7) {
    range = "low";
  }

  // reduce repeated huge wins
  if (recentHighs >= 2 && Math.random() < 0.8) {
    range = "low";
  }

  recentRanges.push(range);

  // keep memory short
  if (recentRanges.length > 15) {
    recentRanges.shift();
  }

  // ======================
  // 🎲 MULTIPLIER GENERATION
  // ======================

  switch (range) {
    case "low":
      return +(1 + Math.random()).toFixed(2); // 1.00x - 2.00x

    case "medium":
      return +(2 + Math.random() * 8).toFixed(2); // 2x - 10x

    case "high":
      return +(10 + Math.random() * 10).toFixed(2); // 10x - 20x

    case "extreme":
      return +(20 + Math.random() * 80).toFixed(2); // 20x - 100x

    default:
      return 1.0;
  }
}

// ======================
// 🚀 START ROUND
// ======================

function startRound() {
  console.log("🚀 ROUND START FUNCTION CALLED");

  // 🚨 prevent double engine
  if (engineLocked) {
    console.log("⚠️ Engine already running — ignored");
    return;
  }

  engineLocked = true;

  const crashPoint = generateCrashPoint();

  currentRound = {
    roundId: Date.now(),
    status: "running",
    multiplier: 1.0,
    crashPoint,
    bets: [],
    startedAt: Date.now(),
  };

  console.log(
    "🔥 New round started:",
    currentRound.roundId,
    "Crash at:",
    crashPoint
  );

  // ======================
  // 📡 ROUND START
  // 🚨 DO NOT SEND crashPoint
  // ======================

  global.io?.emit("roundStart", {
    roundId: currentRound.roundId,
  });

  // clear previous interval
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  // ======================
  // 🎮 GAME LOOP
  // ======================

  interval = setInterval(() => {
    if (!currentRound) return;

    const elapsed =
      (Date.now() - currentRound.startedAt) / 1000;

    // 🚀 multiplier growth
    currentRound.multiplier =
      Math.exp(0.12 * elapsed);

    // 📡 LIVE MULTIPLIER
    global.io?.emit("multiplier", {
      multiplier: currentRound.multiplier,
      roundId: currentRound.roundId,
      status: currentRound.status,
    });

    // ======================
    // 💰 AUTO CASHOUT
    // ======================

    const activeBets =
      getActiveBetsByRound(currentRound.roundId);

    activeBets.forEach((bet) => {
      if (
        !bet.autoCashoutTriggered &&
        currentRound.multiplier >= 1.5
      ) {
        bet.autoCashoutTriggered = true;

        const result = cashout(
          bet.id,
          currentRound.multiplier
        );

        if (result) {
          credit(result.userId, result.winAmount);

          console.log(
            `💰 USER CASHED OUT: ${result.userId} | WIN: ${result.winAmount}`
          );
        }
      }
    });

    // ======================
    // 💥 CRASH CHECK
    // ======================

    if (
      currentRound.multiplier >= crashPoint
    ) {
      clearInterval(interval);
      interval = null;

      // 🔥 FORCE EXACT VALUE
      currentRound.multiplier = crashPoint;

      currentRound.status = "crashed";

      engineLocked = false;

      // 📡 FINAL EXACT MULTIPLIER
      global.io?.emit("multiplier", {
        multiplier: crashPoint,
        roundId: currentRound.roundId,
        status: "crashed",
      });

      // 💥 CRASH EVENT
      global.io?.emit("roundCrash", {
        roundId: currentRound.roundId,
        crashPoint,
      });

      console.log(
        "💥 Crashed at:",
        crashPoint
      );

      currentRound.status = "waiting";

      // ⏳ WAITING PHASE
      global.io?.emit("roundWaiting", {
        countdown: 5,
      });

      // 🔄 SAFE RESTART
      setTimeout(() => {
        startRound();
      }, 5000);
    }
  }, 50);
}

function getCurrentRound() {
  return currentRound;
}

module.exports = {
  startRound,
  getCurrentRound,
};
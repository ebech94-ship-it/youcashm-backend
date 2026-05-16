const { getActiveBetsByRound, cashout } = require("./bets");
const { credit } = require("../services/wallet");

console.log("🎮 ENGINE FILE LOADED");

let currentRound = null;
let interval = null;

// 🔥 GLOBAL ENGINE LOCK (VERY IMPORTANT)
let engineLocked = false;

function generateCrashPoint() {
  const rand = Math.random();
  if (rand < 0.5) return +(1.2 + Math.random() * 2).toFixed(2);
  if (rand < 0.8) return +(2 + Math.random() * 5).toFixed(2);
  return +(5 + Math.random() * 10).toFixed(2);
}

function startRound() {
  console.log("🚀 ROUND START FUNCTION CALLED");

  // 🚨 HARD LOCK (prevents double start)
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

  // 📡 ROUND START EVENT
  global.io?.emit("roundStart", {
    roundId: currentRound.roundId,
    crashPoint,
  });

  // 🚨 clear previous interval if any (VERY IMPORTANT)
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  interval = setInterval(() => {
    if (!currentRound) return;

    const elapsed = (Date.now() - currentRound.startedAt) / 1000;
    currentRound.multiplier = +(1.02 ** elapsed).toFixed(2);

    global.io?.emit("multiplier", {
      multiplier: currentRound.multiplier,
      roundId: currentRound.roundId,
      status: currentRound.status,
    });

    // 💰 AUTO CASHOUT
    const activeBets = getActiveBetsByRound(currentRound.roundId);

    activeBets.forEach((bet) => {
      if (!bet.autoCashoutTriggered && currentRound.multiplier >= 1.5) {
        bet.autoCashoutTriggered = true;

        const result = cashout(bet.id, currentRound.multiplier);

        if (result) {
          credit(result.userId, result.winAmount);

          console.log(
            `💰 USER CASHED OUT: ${result.userId} | WIN: ${result.winAmount}`
          );
        }
      }
    });

    // 💥 CRASH CHECK
    if (currentRound.multiplier >= crashPoint) {
      clearInterval(interval);
      interval = null;

      currentRound.status = "crashed";
      engineLocked = false; // 🔥 unlock engine here

      global.io?.emit("roundCrash", {
        roundId: currentRound.roundId,
        crashPoint,
      });

      console.log("💥 Crashed at:", crashPoint);

      currentRound.status = "waiting";

      global.io?.emit("roundWaiting", {
        countdown: 5,
      });

      // 🔥 SAFE RESTART
      setTimeout(() => {
        startRound();
      }, 5000);
    }
  }, 150);
}

function getCurrentRound() {
  return currentRound;
}

module.exports = {
  startRound,
  getCurrentRound,
};
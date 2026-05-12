const { getActiveBetsByRound, cashout } = require("./bets");
const { credit } = require("../services/wallet");

let currentRound = null;
let interval = null;
let isRunning = false;

function generateCrashPoint() {
  const rand = Math.random();
  if (rand < 0.5) return +(1.2 + Math.random() * 2).toFixed(2);
  if (rand < 0.8) return +(2 + Math.random() * 5).toFixed(2);
  return +(5 + Math.random() * 10).toFixed(2);
}

function startRound() {
  // 🚨 HARD LOCK
  if (isRunning) {
    console.log("⚠️ Round already running — ignored");
    return;
  }

  isRunning = true;

  const crashPoint = generateCrashPoint();

  currentRound = {
    id: Date.now(),
    status: "running",
    multiplier: 1.0,
    crashPoint,
    bets: [],
    startedAt: Date.now(),
  };

  console.log("🔥 New round started:", currentRound.id, "Crash at:", crashPoint);

  // 📡 ROUND START EVENT
  global.io?.emit("roundStart", {
    roundId: currentRound.id,
    crashPoint,
  });

  interval = setInterval(() => {
    // 📈 MULTIPLIER UPDATE
    currentRound.multiplier = +(currentRound.multiplier + 0.05).toFixed(2);

    // 📡 BROADCAST MULTIPLIER
    global.io?.emit("multiplier", {
      multiplier: currentRound.multiplier,
      roundId: currentRound.id,
      status: currentRound.status,
    });

    // 💰 AUTO CASHOUT LOGIC
    const activeBets = getActiveBetsByRound(currentRound.id);

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

      currentRound.status = "crashed";
      isRunning = false;

      // 📡 CRASH EVENT
      global.io?.emit("roundCrash", {
        roundId: currentRound.id,
        crashPoint,
      });

      console.log("💥 Crashed at:", crashPoint);
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
let users = {}; // temporary in-memory store

function createUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      balance: 0,
    };
  }
  return users[userId];
}

function getBalance(userId) {
  return users[userId]?.balance || 0;
}

function credit(userId, amount) {
  createUser(userId);
  users[userId].balance += amount;
  return users[userId].balance;
}

function debit(userId, amount) {
  createUser(userId);

  if (users[userId].balance < amount) {
    return false;
  }

  users[userId].balance -= amount;
  return true;
}

module.exports = {
  createUser,
  getBalance,
  credit,
  debit,
};
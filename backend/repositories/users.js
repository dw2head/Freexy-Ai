const db = require("../db/mongoDb");

function toApiUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    id: user._id,
    username: user.username,
    email: user.email,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    credits: user.credits !== undefined ? user.credits : 25,
    lastCreditsReset: user.lastCreditsReset,
    isAdmin: user.isAdmin || false,
    avatar: user.avatar || "",
    onboardingCompleted: user.onboardingCompleted || false,
    onboarding: user.onboarding || null,
  };
}

async function findUserByEmail(email) {
  return await db.findOne("users", { email: email.toLowerCase().trim() });
}

async function findUserById(id) {
  return await db.findOne("users", { _id: id });
}

async function createUser({ username, email, password }) {
  const today = new Date().toISOString().slice(0, 10);
  return await db.insert("users", {
    username,
    email: email.toLowerCase().trim(),
    password,
    lastLogin: null,
    credits: 25,
    lastCreditsReset: today,
    isAdmin: false,
    avatar: "",
    onboardingCompleted: false,
    onboarding: null,
  });
}

async function updateLastLogin(id) {
  return await db.update("users", id, { lastLogin: new Date().toISOString() });
}

async function verifyAndResetCredits(id) {
  const user = await db.findOne("users", { _id: id });
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastCreditsReset !== today || user.credits === undefined) {
    return await db.update("users", id, {
      credits: 25,
      lastCreditsReset: today
    });
  }
  return user;
}

async function updateUserProfile(id, updates) {
  return await db.update("users", id, updates);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  toApiUser,
  updateLastLogin,
  verifyAndResetCredits,
  updateUserProfile,
};

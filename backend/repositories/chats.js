const db = require("../db/mongoDb");

async function createChat({ userId, prompt, response }) {
  return await db.insert("chats", {
    userId,
    prompt,
    response,
  });
}

async function getChatsByUserId(userId) {
  return await db.find("chats", { userId });
}

module.exports = {
  createChat,
  getChatsByUserId
};

const express = require("express");
const router = express.Router();

const askAI = require("../nvidia");
const authMiddleware = require("../middleware/authMiddleware");
const { createChat, getChatsByUserId } = require("../repositories/chats");
const { verifyAndResetCredits } = require("../repositories/users");
const db = require("../db/mongoDb");
const { sendServerError } = require("../utils/apiError");

function formatChatSession(chat) {
  if (!chat) return null;
  if (!chat.messages) {
    return {
      _id: chat._id,
      userId: chat.userId,
      title: chat.title || chat.prompt?.slice(0, 30) || "Chat Session",
      messages: [
        { role: "user", content: chat.prompt || "", createdAt: chat.createdAt },
        { role: "assistant", content: chat.response || "", createdAt: chat.createdAt }
      ],
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt || chat.createdAt
    };
  }
  return chat;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const RETENTION_LIMIT_DAYS = 7; // Change to 30 to extend retention
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_LIMIT_DAYS);

    // Read all chats and prune expired logs
    const allChats = await db.readData("chats");
    const activeChats = allChats.filter(chat => {
      const date = new Date(chat.createdAt);
      return date >= cutoff;
    });

    if (activeChats.length < allChats.length) {
      await db.writeData("chats", activeChats);
    }

    // Filter to return only current user's chats, mapped and sorted by updatedAt desc
    const userChats = activeChats
      .filter(chat => chat.userId === req.user.id)
      .map(formatChatSession)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(userChats);
  } catch (err) {
    console.error(err);
    sendServerError(res, err, "Failed to fetch chat history");
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { prompt, chatId, mode } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    // Check and reset credits if new day
    const user = await verifyAndResetCredits(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits <= 0) {
      return res.status(403).json({
        message: "You have used all your daily credits (25/25). Credits reset daily.",
      });
    }

    let chatSession = null;
    let isNew = false;

    if (chatId) {
      const existing = await db.findOne("chats", { _id: chatId });
      if (existing && existing.userId === req.user.id) {
        chatSession = formatChatSession(existing);
      }
    }

    if (!chatSession) {
      isNew = true;
      chatSession = {
        userId: req.user.id,
        title: prompt.slice(0, 30) || "New Chat",
        messages: []
      };
    }

    // Append user message
    const userMsg = {
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString()
    };
    chatSession.messages.push(userMsg);

    let response;
    let apiErrorOccurred = false;

    try {
      // Get response from AI using messages array and mode
      response = await askAI(chatSession.messages, mode);

      // Check if response contains OpenRouter rate limit or credit issues to intercept them
      if (typeof response === "string" && (
        response.toLowerCase().includes("openrouter free tier") ||
        response.toLowerCase().includes("daily rate limit") ||
        (response.toLowerCase().includes("openrouter") && (
          response.toLowerCase().includes("rate limit") ||
          response.toLowerCase().includes("limit reached") ||
          response.toLowerCase().includes("add credits") ||
          response.toLowerCase().includes(".env") ||
          response.toLowerCase().includes("api key")
        ))
      )) {
        throw {
          message: response,
          status: 429
        };
      }
    } catch (apiError) {
      apiErrorOccurred = true;
      console.error("OpenRouter API Error:", apiError);

      // Log the error to api_logs database
      await db.insert("api_logs", {
        userId: req.user.id,
        userEmail: user.email,
        username: user.username,
        error: apiError.message || apiError.error?.message || "Unknown API Error",
        status: apiError.status || apiError.code || 429,
        prompt: prompt,
      });

      // User-friendly polite response to keep the user's trust styled by mode
      if (mode === "script") {
        response = `**Scene 1: The Quiet Connection**\n\n**NARRATOR**\nA brief pause in the digital realm. The system is experiencing a temporary connection issue.\n\n**FREEXY AI**\n*(Smiling warmly)*\nLet's take a brief moment. Please try sending your message again in a few moments, and we will resume our script writing right away!`;
      } else {
        response = "I am currently experiencing a temporary connection issue. Please try sending your message again in a few moments!";
      }
    }

    // Append assistant message
    const assistantMsg = {
      role: "assistant",
      content: response,
      createdAt: new Date().toISOString()
    };
    chatSession.messages.push(assistantMsg);

    let savedSession;
    if (isNew) {
      savedSession = await db.insert("chats", chatSession);
    } else {
      savedSession = await db.update("chats", chatSession._id, {
        messages: chatSession.messages
      });
    }

    // Decrement credits only if the API call succeeded
    let updatedUser = user;
    if (!apiErrorOccurred) {
      updatedUser = await db.update("users", user._id || user.id, {
        credits: user.credits - 1,
      });
    }

    res.json({
      response,
      chat: formatChatSession(savedSession),
      credits: updatedUser.credits,
    });
  } catch (err) {
    console.error(err);
    sendServerError(res, err, "AI Error");
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findOne("chats", { _id: id });
    if (!existing) {
      return res.status(404).json({ message: "Chat not found" });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this chat" });
    }
    await db.remove("chats", id);
    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error(err);
    sendServerError(res, err, "Failed to delete chat");
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const existing = await db.findOne("chats", { _id: id });
    if (!existing) {
      return res.status(404).json({ message: "Chat not found" });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to rename this chat" });
    }
    const updated = await db.update("chats", id, { title: title.trim() });
    res.json(formatChatSession(updated));
  } catch (err) {
    console.error(err);
    sendServerError(res, err, "Failed to rename chat");
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const db = require("../db/mongoDb");
const { toApiUser } = require("../repositories/users");
const { sendServerError } = require("../utils/apiError");

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await db.readData("users");
    // Format each user to API format
    const apiUsers = users.map(user => toApiUser(user));
    res.json(apiUsers);
  } catch (err) {
    console.error("Failed to fetch admin users:", err);
    sendServerError(res, err, "Failed to fetch users list");
  }
});

// GET /api/admin/stats - Get system stats
router.get("/stats", async (req, res) => {
  try {
    const users = await db.readData("users");
    const chats = await db.readData("chats");

    const totalUsers = users.length;
    const totalChats = chats.length;
    const totalCredits = users.reduce((sum, user) => sum + (user.credits !== undefined ? user.credits : 25), 0);

    res.json({
      totalUsers,
      totalChats,
      totalCredits,
    });
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    sendServerError(res, err, "Failed to fetch stats");
  }
});

// POST /api/admin/users/:id/credits - Update user credits
router.post("/users/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const { credits } = req.body;

    if (credits === undefined || typeof credits !== "number" || credits < 0) {
      return res.status(400).json({
        message: "Valid credits number (0 or positive) is required.",
      });
    }

    const user = await db.findOne("users", { _id: id });
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const updatedUser = await db.update("users", id, {
      credits,
    });

    res.json({
      message: "User credits updated successfully.",
      user: toApiUser(updatedUser),
    });
  } catch (err) {
    console.error("Failed to update user credits:", err);
    sendServerError(res, err, "Failed to update user credits");
  }
});

// GET /api/admin/logs - Get all API error logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await db.readData("api_logs");
    // Sort by createdAt descending (newest first)
    const sortedLogs = logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedLogs);
  } catch (err) {
    console.error("Failed to fetch admin API logs:", err);
    sendServerError(res, err, "Failed to fetch logs");
  }
});

// DELETE /api/admin/logs/:id - Delete a log entry
router.delete("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.remove("api_logs", id);
    res.json({ success: true, message: "Log deleted successfully." });
  } catch (err) {
    console.error("Failed to delete log:", err);
    sendServerError(res, err, "Failed to delete log");
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  createUser,
  findUserByEmail,
  toApiUser,
  updateLastLogin,
  verifyAndResetCredits,
} = require("../repositories/users");
const { sendServerError } = require("../utils/apiError");

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const existingUser = await findUserByEmail(email);


    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: newUser._id || newUser.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      success: true,
      message: "User Registered",
      token,
      user: toApiUser(newUser),
    });
  } catch (err) {
    console.log(err);
    sendServerError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email);


    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Wrong Password",
      });
    }

    const updatedUser = await updateLastLogin(user._id || user.id);
    const userWithCredits = await verifyAndResetCredits(updatedUser._id || updatedUser.id || user._id || user.id);

    const token = jwt.sign(
      {
        id: user._id || user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: toApiUser(userWithCredits),
    });

  } catch (err) {
    console.log(err);

    sendServerError(res, err);
  }
});

const authMiddleware = require("../middleware/authMiddleware");
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userWithCredits = await verifyAndResetCredits(req.user.id);
    if (!userWithCredits) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      user: toApiUser(userWithCredits),
    });
  } catch (err) {
    console.error(err);
    sendServerError(res, err);
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, password, avatar } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (username && username.trim()) {
      updates.username = username.trim();
    }
    if (avatar !== undefined) {
      updates.avatar = avatar;
    }
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const { findUserById, updateUserProfile } = require("../repositories/users");
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username already exists if username is being changed
    if (updates.username && updates.username.toLowerCase() !== user.username.toLowerCase()) {
      const { findOne } = require("../db/mongoDb");
      const nameExists = await findOne("users", { username: updates.username });
      if (nameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await updateUserProfile(userId, updates);
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: toApiUser(updatedUser),
    });
  } catch (err) {
    console.error("Profile update error:", err);
    sendServerError(res, err);
  }
});

router.post("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { name, age, heardFrom } = req.body;
    const userId = req.user.id;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updates = {
      username: name.trim(),
      onboardingCompleted: true,
      onboarding: {
        age: age || "",
        heardFrom: heardFrom || "",
        completedAt: new Date().toISOString()
      }
    };

    const { findUserById, updateUserProfile } = require("../repositories/users");
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username already taken
    if (updates.username.toLowerCase() !== user.username.toLowerCase()) {
      const { findOne } = require("../db/mongoDb");
      const nameExists = await findOne("users", { username: updates.username });
      if (nameExists) {
        return res.status(400).json({ message: "Name/Username is already taken" });
      }
    }

    const updatedUser = await updateUserProfile(userId, updates);
    res.json({
      success: true,
      message: "Onboarding completed successfully",
      user: toApiUser(updatedUser),
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    sendServerError(res, err);
  }
});

module.exports = router;

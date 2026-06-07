// Polyfill global crypto for Node.js < v20
if (!globalThis.crypto) {
  globalThis.crypto = require("crypto");
}

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db/mongoDb");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FREEXY Backend Running 🚀",
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start Server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Server Running On Port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

startServer();
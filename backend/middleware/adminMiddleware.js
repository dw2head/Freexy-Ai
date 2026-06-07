const db = require("../db/mongoDb");

const ALLOWED_ADMIN_EMAILS = [
  "admin1@freexy.ai",
  "admin2@freexy.ai",
  "admin3@freexy.ai",
  "admin4@freexy.ai"
];

module.exports = async (req, res, next) => {
  try {
    const user = await db.findOne("users", { _id: req.user.id });
    if (!user || !user.isAdmin || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    next();
  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ message: "Server error during admin verification." });
  }
};

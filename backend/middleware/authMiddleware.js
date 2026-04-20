const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ detail: "Authentication required." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.user_id).select("-password");
    if (!user) {
      return res.status(401).json({ detail: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ detail: "Access denied." });
    }

    next();
  };
}

module.exports = { authMiddleware, requireRole };
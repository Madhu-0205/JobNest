// backend/routes/user.js

import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Get user profile by user ID (authenticated)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Update user profile (authenticated)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    // Prevent password updates here to keep secure (use separate route)
    if ("password" in updates) {
      return res.status(400).json({ message: "Password updates not allowed here." });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;

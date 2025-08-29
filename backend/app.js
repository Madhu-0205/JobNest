// backend/app.js (or backend/server.js depending on your structure)

import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/authmiddleware.js";

dotenv.config();

const app = express();

app.use(express.json());

// Public Routes
app.use("/api/auth", authRoutes);

// Example protected route:
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import userRoutes from "./routes/user.js";

app.use("/api/user", userRoutes);

import gigsRoutes from "./routes/Gig.js";

app.use("/api/gigs", gigsRoutes);
import authRoutes from "./routes/auth.js";
import gigsRoutes from "./routes/gigs.js";

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigsRoutes);

import communityRoutes from "./routes/community.js";

app.use("/api/community", communityRoutes);

import paymentsRoutes from "./routes/payments.js";

app.use("/api/payments", paymentsRoutes);

import paymentsRoutes from "./routes/payments.js";

app.use("/api/payments", paymentsRoutes);

import searchRoutes from "./routes/search.js";

app.use("/api/search", searchRoutes);

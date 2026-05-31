// server.js — CivicFix Backend Entry Point
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const rateLimit = require("express-rate-limit");

// ─── App Setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow your frontend origin. In production replace with your real domain.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Prevents abuse — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
const complaintsRouter = require("./routes/complaints");
const usersRouter      = require("./routes/users");
const statsRouter      = require("./routes/stats");

app.use("/api/complaints", complaintsRouter);
app.use("/api/users",      usersRouter);
app.use("/api/stats",      statsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ CivicFix API is running",
    version: "1.0.0",
    endpoints: {
      complaints: "/api/complaints",
      users:      "/api/users",
      stats:      "/api/stats",
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CivicFix server running at http://localhost:${PORT}`);
});

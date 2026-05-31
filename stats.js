// routes/stats.js
// Dashboard statistics — used by your report.html / admin view.

const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// ─── GET /api/stats/overview ──────────────────────────────────────────────────
// Returns counts of complaints by status and category.
// No auth required — public dashboard.
router.get("/overview", async (req, res) => {
  try {
    const snapshot = await db.collection("complaints").get();
    const complaints = snapshot.docs.map((d) => d.data());

    const total      = complaints.length;
    const pending    = complaints.filter((c) => c.status === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved   = complaints.filter((c) => c.status === "Resolved").length;
    const rejected   = complaints.filter((c) => c.status === "Rejected").length;

    // Count by category
    const byCategory = complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    // Count by priority
    const byPriority = complaints.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});

    // Last 7 days activity
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
    }).reverse();

    const dailyCounts = last7Days.map((day) => ({
      date: day,
      count: complaints.filter((c) => c.createdAt?.startsWith(day)).length,
    }));

    return res.json({
      total,
      byStatus: { pending, inProgress, resolved, rejected },
      byCategory,
      byPriority,
      dailyActivity: dailyCounts,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── GET /api/stats/heatmap ───────────────────────────────────────────────────
// Returns all complaint locations (lat,lng) for the heatmap.html page.
router.get("/heatmap", async (req, res) => {
  try {
    const snapshot = await db.collection("complaints").get();

    const points = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.location) {
        const [lat, lng] = data.location.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ lat, lng, category: data.category, status: data.status });
        }
      }
    });

    return res.json({ points });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch heatmap data." });
  }
});

module.exports = router;

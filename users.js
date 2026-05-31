// routes/users.js
// User profile management endpoints.

const express = require("express");
const router = express.Router();
const { db, auth } = require("../config/firebase");
const { verifyToken } = require("../middleware/auth");

// ─── POST /api/users/register ─────────────────────────────────────────────────
// Called after Firebase Auth registration to save extra profile data in Firestore.
// Your register.html already does this with setDoc — this is the server-side version.
router.post("/register", verifyToken, async (req, res) => {
  try {
    const { name, role, phone } = req.body;
    const uid = req.user.uid;

    const userData = {
      uid,
      name: name || req.user.name || "",
      email: req.user.email,
      role: role || "citizen",           // 'citizen' or 'authority'
      phone: phone || "",
      totalComplaints: 0,
      resolvedComplaints: 0,
      points: 0,
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userData, { merge: true });
    return res.status(201).json({ message: "Profile created.", user: userData });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Failed to create profile." });
  }
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────
// Get the logged-in user's own profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Profile not found." });
    return res.json({ user: { id: doc.id, ...doc.data() } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
// Update the logged-in user's profile (name, phone only — not role/email)
router.patch("/me", verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name)  updates.name  = name.trim();
    if (phone) updates.phone = phone.trim();
    updates.updatedAt = new Date().toISOString();

    await db.collection("users").doc(req.user.uid).update(updates);
    return res.json({ message: "Profile updated." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// ─── GET /api/users/leaderboard ───────────────────────────────────────────────
// Top 10 citizens by points (for the rewards section)
router.get("/leaderboard", async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "citizen")
      .orderBy("points", "desc")
      .limit(10)
      .get();

    const leaders = snapshot.docs.map((doc, i) => ({
      rank: i + 1,
      name: doc.data().name || "Anonymous",
      points: doc.data().points || 0,
      totalComplaints: doc.data().totalComplaints || 0,
    }));

    return res.json({ leaderboard: leaders });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
});

module.exports = router;

// routes/complaints.js
// All complaint-related API endpoints.

const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { verifyToken } = require("../middleware/auth");
const multer = require("multer");

// Store uploaded images in memory (use Firebase Storage / S3 in production)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

// ─── POST /api/complaints ─────────────────────────────────────────────────────
// Submit a new complaint (must be logged in)
router.post("/", verifyToken, upload.array("images", 4), async (req, res) => {
  try {
    const { title, category, priority, location, landmark, description } = req.body;

    // Basic validation
    if (!title || !category || !location) {
      return res.status(400).json({ error: "Title, category, and location are required." });
    }

    const complaintData = {
      title: title.trim(),
      category,
      priority: priority || "Medium",
      location,                         // "lat,lng" string or address
      landmark: landmark || "",
      description: description || "",
      status: "Pending",                // Pending → In Progress → Resolved
      submittedBy: req.user.uid,
      submittedByEmail: req.user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      imageCount: req.files ? req.files.length : 0,
      // In production: store image URLs from Firebase Storage here
    };

    const docRef = await db.collection("complaints").add(complaintData);

    // Increment the user's complaint count
    const userRef = db.collection("users").doc(req.user.uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update({
        totalComplaints: (userDoc.data().totalComplaints || 0) + 1,
      });
    }

    return res.status(201).json({
      message: "Complaint submitted successfully.",
      complaintId: docRef.id,
    });
  } catch (err) {
    console.error("Submit complaint error:", err);
    return res.status(500).json({ error: "Failed to submit complaint." });
  }
});

// ─── GET /api/complaints ──────────────────────────────────────────────────────
// Fetch all complaints (public — anyone can view the map/list)
// Optional query params: ?category=Roads&status=Pending&limit=20
router.get("/", async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    let query = db.collection("complaints").orderBy("createdAt", "desc");

    if (category) query = query.where("category", "==", category);
    if (status)   query = query.where("status", "==", status);

    query = query.limit(Number(limit));
    const snapshot = await query.get();

    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ complaints, total: complaints.length });
  } catch (err) {
    console.error("Fetch complaints error:", err);
    return res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// ─── GET /api/complaints/mine ─────────────────────────────────────────────────
// Fetch complaints submitted by the logged-in user
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("complaints")
      .where("submittedBy", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const complaints = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ complaints });
  } catch (err) {
    console.error("Fetch my complaints error:", err);
    return res.status(500).json({ error: "Failed to fetch your complaints." });
  }
});

// ─── GET /api/complaints/:id ──────────────────────────────────────────────────
// Get a single complaint by ID
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("complaints").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Complaint not found." });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch complaint." });
  }
});

// ─── PATCH /api/complaints/:id/status ────────────────────────────────────────
// Update complaint status (authority only — or logged-in user for now)
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const ref = db.collection("complaints").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Complaint not found." });

    await ref.update({
      status,
      updatedAt: new Date().toISOString(),
      statusNote: note || "",
      resolvedBy: req.user.uid,
    });

    return res.json({ message: "Status updated successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// ─── POST /api/complaints/:id/upvote ─────────────────────────────────────────
// Upvote a complaint (logged-in users)
router.post("/:id/upvote", verifyToken, async (req, res) => {
  try {
    const ref = db.collection("complaints").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Complaint not found." });

    const upvoters = doc.data().upvoters || [];
    if (upvoters.includes(req.user.uid)) {
      return res.status(400).json({ error: "You have already upvoted this complaint." });
    }

    await ref.update({
      upvotes: (doc.data().upvotes || 0) + 1,
      upvoters: [...upvoters, req.user.uid],
    });

    return res.json({ message: "Upvote recorded." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to upvote." });
  }
});

module.exports = router;

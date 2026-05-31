// middleware/auth.js
// Every protected route passes the request through here first.
// The frontend sends:  Authorization: Bearer <Firebase ID Token>

const { auth } = require("../config/firebase");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.user = decoded; // { uid, email, name, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
}

// Optional: only allow 'authority' role users
async function requireAuthority(req, res, next) {
  if (req.user?.role !== "authority") {
    return res.status(403).json({ error: "Forbidden: Authorities only." });
  }
  next();
}

module.exports = { verifyToken, requireAuthority };

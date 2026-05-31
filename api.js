// api.js  ← Place this file alongside your HTML files (login.html, index.html etc.)
// ─────────────────────────────────────────────────────────────────────────────
// CivicFix API Helper
// Wraps all calls to your Node.js backend. Import this in your HTML pages.
// Usage: import { api } from './api.js';
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000/api"; // Change to your deployed URL in production

// Gets the Firebase ID token from the currently logged-in user.
// Requires Firebase Auth to already be initialized on the page.
async function getToken() {
  // firebase/auth must be available on the page
  const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not logged in.");
  return user.getIdToken();
}

async function request(method, path, body = null, requiresAuth = true) {
  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = await getToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const api = {
  // ── Complaints ──────────────────────────────────────────────
  submitComplaint: (payload) => request("POST", "/complaints", payload),
  getComplaints:  (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/complaints${q ? "?" + q : ""}`, null, false);
  },
  getMyComplaints:    ()           => request("GET",   "/complaints/mine"),
  getComplaint:       (id)         => request("GET",   `/complaints/${id}`, null, false),
  updateStatus:       (id, status, note) => request("PATCH", `/complaints/${id}/status`, { status, note }),
  upvoteComplaint:    (id)         => request("POST",  `/complaints/${id}/upvote`),

  // ── Users ───────────────────────────────────────────────────
  registerProfile: (payload) => request("POST",  "/users/register", payload),
  getMyProfile:    ()        => request("GET",   "/users/me"),
  updateProfile:   (payload) => request("PATCH", "/users/me", payload),
  getLeaderboard:  ()        => request("GET",   "/users/leaderboard", null, false),

  // ── Stats ───────────────────────────────────────────────────
  getStats:        ()        => request("GET",   "/stats/overview",  null, false),
  getHeatmapData:  ()        => request("GET",   "/stats/heatmap",   null, false),
};

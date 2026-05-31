# CivicFix — Node.js Backend

A REST API backend for the CivicFix civic issue reporting platform, built with **Express.js** and **Firebase Admin SDK**.

---

## Project Structure

```
civicfix-backend/
├── server.js               ← App entry point
├── package.json
├── .env.example            ← Copy to .env and fill in your values
├── api.js                  ← Drop into your frontend folder
├── config/
│   └── firebase.js         ← Firebase Admin SDK init
├── middleware/
│   └── auth.js             ← JWT token verification
└── routes/
    ├── complaints.js        ← Complaint CRUD + upvote
    ├── users.js            ← Profile management + leaderboard
    └── stats.js            ← Dashboard stats + heatmap data
```

---

## ✅ Step-by-Step Setup

### 1. Install dependencies
```bash
cd civicfix-backend
npm install
```

### 2. Get your Firebase Service Account key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **civicfix-17bd0**
3. Click ⚙️ **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"** → download the JSON file

### 3. Create your `.env` file
```bash
cp .env.example .env
```
Open `.env` and paste values from the downloaded JSON:
- `FIREBASE_PROJECT_ID` → `project_id`
- `FIREBASE_CLIENT_EMAIL` → `client_email`
- `FIREBASE_PRIVATE_KEY` → `private_key` (keep the quotes)

### 4. Run the server
```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```
Server starts at → http://localhost:5000

---

## API Endpoints

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/` | No | Health check |
| POST | `/api/complaints` | ✅ Yes | Submit a complaint |
| GET | `/api/complaints` | No | List all complaints |
| GET | `/api/complaints/mine` | ✅ Yes | My complaints |
| GET | `/api/complaints/:id` | No | Single complaint |
| PATCH | `/api/complaints/:id/status` | ✅ Yes | Update status |
| POST | `/api/complaints/:id/upvote` | ✅ Yes | Upvote |
| POST | `/api/users/register` | ✅ Yes | Create profile |
| GET | `/api/users/me` | ✅ Yes | Get my profile |
| PATCH | `/api/users/me` | ✅ Yes | Update profile |
| GET | `/api/users/leaderboard` | No | Top 10 citizens |
| GET | `/api/stats/overview` | No | Dashboard stats |
| GET | `/api/stats/heatmap` | No | Map data points |

---

## Connecting the Frontend

Copy `api.js` to your HTML folder, then use it like this:

```html
<script type="module">
  // In report.html — submit a complaint
  import { api } from './api.js';

  async function submitComplaint() {
    try {
      const result = await api.submitComplaint({
        title: "Broken streetlight on MG Road",
        category: "Street Lights",
        priority: "High",
        location: "22.5726,88.3639",
        landmark: "Near Park Street Metro",
        description: "Light has been out for 2 weeks.",
      });
      console.log("Submitted:", result.complaintId);
    } catch (err) {
      console.error(err.message);
    }
  }
</script>
```

---

## Firestore Collections

The backend reads/writes these Firestore collections:

| Collection | What's stored |
|------------|--------------|
| `complaints` | All civic issue reports |
| `users` | User profiles and stats |

Make sure Firestore is enabled in your Firebase project.

---

## Next Steps (when you're ready)

- 🖼 **Image uploads** → Add Firebase Storage upload in `routes/complaints.js`
- 📧 **Email notifications** → Add Nodemailer or Firebase Extensions
- 🚀 **Deploy** → Use [Railway](https://railway.app), [Render](https://render.com), or [Vercel](https://vercel.com)
- 🔐 **Authority roles** → Use Firebase custom claims to enforce authority-only routes

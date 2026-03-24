# TaskFlow — Vite + React + Firebase

Full-stack Task Manager: React 18, Vite 5, Tailwind CSS 3, Firebase (Auth + Firestore + Hosting).

---

## Project Structure

```
taskflow/
├── index.html                          ← Vite entry HTML
├── vite.config.js                      ← Vite config (port 3000, code splitting)
├── tailwind.config.js
├── postcss.config.js
├── firebase.json                       ← Hosting (public: dist) + Firestore
├── firestore.rules
├── firestore.indexes.json
├── .env.example                        ← Copy → .env, fill Firebase values
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                        ← createRoot entry
    ├── App.jsx                         ← providers + auth gate
    ├── index.css                       ← Tailwind directives
    ├── context/
    │   ├── AuthContext.jsx             ← Firebase auth state
    │   └── ThemeContext.jsx            ← Dark/light + localStorage
    ├── hooks/
    │   ├── useCategories.js            ← Real-time onSnapshot
    │   └── useTasks.js                 ← Real-time + search/filter/stats
    ├── services/
    │   ├── firebase.js                 ← init (reads VITE_ env vars)
    │   ├── authService.js              ← Google sign-in / logout
    │   ├── categoryService.js          ← Category CRUD
    │   └── taskService.js              ← Task CRUD + batch delete
    └── components/
        ├── Auth/Login.jsx
        ├── Layout/
        │   ├── Header.jsx
        │   ├── Sidebar.jsx
        │   └── AppLayout.jsx
        ├── Tasks/
        │   ├── TaskList.jsx            ← DnD container
        │   ├── TaskCard.jsx
        │   ├── TaskForm.jsx            ← Add/Edit modal
        │   └── TaskFilters.jsx
        ├── Dashboard/DashboardSummary.jsx
        └── UI/
            ├── Modal.jsx
            └── Loading.jsx
```

---

## ① Firebase Setup

### 1. Create project
1. https://console.firebase.google.com → **Add project**
2. Name it (e.g. `taskflow-app`) → Continue → Create

### 2. Enable Google Auth
Firebase Console → **Authentication** → Get Started
→ Sign-in method → **Google** → Enable → Save

### 3. Create Firestore
Firebase Console → **Firestore Database** → Create database
→ **Production mode** → Choose region (`asia-south1` for India) → Enable

### 4. Register Web App & copy config
Firebase Console → Project Overview → **</>** (Web)
→ Register app → Copy the `firebaseConfig` object

---

## ② Local Setup

```bash
# 1. Copy env template
cp .env.example .env

# 2. Open .env and paste your Firebase values:
#    VITE_FIREBASE_API_KEY=AIza...
#    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
#    VITE_FIREBASE_PROJECT_ID=your-project-id
#    VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
#    VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
#    VITE_FIREBASE_APP_ID=1:123...

# 3. Install dependencies
npm install

# 4. Start dev server (opens at http://localhost:3000)
npm run dev
```

---

## ③ Deploy to Firebase Hosting

```bash
# Install Firebase CLI (once globally)
npm install -g firebase-tools

# Login
firebase login

# Init Firebase (first time only)
firebase init
# Select: Firestore, Hosting
# Hosting public dir: dist
# Single-page app: Yes
# Auto build: No

# Deploy rules + indexes
firebase deploy --only firestore

# Build + deploy hosting (one command)
npm run deploy
# This runs: npm run build && firebase deploy
```

Live at → `https://YOUR_PROJECT_ID.web.app`

---

## Firestore Rules Summary

```
categories/{id}
  read   → auth user & owns doc
  create → auth + name≤100 chars + userId matches
  update → only 'name' field allowed
  delete → auth + owns doc

tasks/{id}
  read   → auth user & owns doc
  create → auth + title≤120 + valid status/priority
  update → auth + userId unchanged
  delete → auth + owns doc
```

---

## Why Vite over CRA?

| Feature         | CRA          | Vite          |
|-----------------|--------------|---------------|
| Dev start       | ~15s         | **< 300ms**   |
| HMR updates     | 2-5s         | **< 50ms**    |
| Build size      | Larger       | **Smaller**   |
| Config          | Hidden       | **Open**      |
| Maintained      | Deprecated   | **Active**    |
| env prefix      | `REACT_APP_` | `VITE_`       |

---

## Common Issues

**"Missing or insufficient permissions"**
→ `firebase deploy --only firestore:rules`

**"The query requires an index"**
→ `firebase deploy --only firestore:indexes`
→ Or click the console link — Firebase auto-creates the index

**Google Sign-In popup blocked**
→ Firebase Console → Authentication → Settings → Authorized domains
→ Add `localhost` (already there) + your production domain

**Env vars not loading**
→ Must prefix with `VITE_` (not `REACT_APP_`)
→ Restart dev server after editing `.env`
→ Never commit `.env` to Git!

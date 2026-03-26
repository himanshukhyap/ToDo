# ✦ NoteTask v2

**React + Vite + Firebase** — Notes & Task Manager

Live URL (after deploy): **https://todo-ec064.web.app**

---

## ⚡ Deploy in 3 Steps (Local Machine)

### Step 1 — Enable Firebase Services

Go to [Firebase Console → todo-ec064](https://console.firebase.google.com/project/todo-ec064)

**Authentication:**
1. Build → Authentication → Get started
2. Sign-in method → Enable **Google**
3. Add your email as support email → Save

**Firestore:**
1. Build → Firestore Database → Create database
2. Start in **production mode**
3. Select region: `asia-south1` (India) → Enable

**Authorized Domain:**
1. Authentication → Settings → Authorized domains
2. Add `todo-ec064.web.app` (already there by default)

---

### Step 2 — Run deploy script

```bash
# Extract the zip, then:
chmod +x deploy.sh
./deploy.sh
```

This will:
- Build the app
- Open browser for Firebase login
- Deploy Firestore rules + indexes
- Deploy app to hosting

---

### Step 3 — Done! 🎉

App live at: **https://todo-ec064.web.app**

---

## Manual Deploy (if script doesn't work)

```bash
npm install
npm run build

npm install -g firebase-tools
firebase login
firebase deploy --project todo-ec064
```

---

## Firestore Index Fix

If you get "index required" error in browser console:
1. Open the link shown in the console error
2. Click "Create Index" in Firebase Console
3. Wait ~2 min, refresh the app

---

## Features

| Feature | Details |
|---|---|
| Google Auth | One-click sign-in |
| Notes | Content-only, add/edit/delete/copy |
| Tasks | Inline add from main screen |
| Subtasks | Per task, add/edit/delete/toggle |
| Three-dot menu | Edit, Copy, Delete, Add Subtask |
| Categories | Create/edit/delete, assign to tasks |
| Category filter | Filter tasks by category |
| Pending/Done sections | Collapsible, progress bar |
| Real-time sync | Firestore onSnapshot |
| Error handling | All Firestore errors shown |
| Offline support | IndexedDB persistence |
| Responsive | Mobile-ready |

---

## Project Structure

```
src/
├── firebase.js                  ← Firebase init (your config hardcoded)
├── App.jsx                      ← Root + tab nav
├── context/AuthContext.jsx      ← Google auth state
├── hooks/
│   ├── useNotes.js              ← Notes CRUD
│   ├── useTasks.js              ← Tasks + subtasks CRUD
│   └── useCategories.js        ← Categories CRUD
└── components/
    ├── LoginPage.jsx
    ├── Notes.jsx                ← Content-only notes
    ├── Tasks.jsx                ← Inline add, 3-dot menu, subtasks
    └── CategoryManager.jsx     ← Category modal
```

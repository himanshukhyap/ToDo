# 🚀 Firebase Deploy — Step by Step

## Your Project ID: `todo-ec064`
## Live URL: `https://todo-ec064.web.app`

---

## ✅ One-Click Deploy (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Manual Commands (Copy-Paste Ready)

### 1. Install dependencies
```bash
npm install
```

### 2. Build the app
```bash
npm run build
```

### 3. Install Firebase CLI (only once ever)
```bash
npm install -g firebase-tools
```

### 4. Login to Firebase (opens browser)
```bash
firebase login
```

### 5. Deploy Firestore rules + indexes
```bash
firebase deploy --only firestore --project todo-ec064
```

### 6. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting --project todo-ec064
```

### 7. Deploy EVERYTHING at once
```bash
firebase deploy --project todo-ec064
```

---

## 🔁 Re-deploy after code changes

```bash
npm run build && firebase deploy --only hosting --project todo-ec064
```

> Just this one command every time you make changes!

---

## 🔍 Check deploy status

```bash
firebase hosting:channel:list --project todo-ec064
```

---

## ⚠️ Firestore Index Fix (First Run)

First time use karne par browser console mein ye error aa sakta hai:

```
FirebaseError: The query requires an index.
https://console.firebase.google.com/...createIndex...
```

**Solution:** Us link pe click karo → "Create Index" → 2-3 min wait karo → Done!

---

## 🛑 Common Errors & Fixes

| Error | Fix |
|---|---|
| `Error: Failed to authenticate` | Run `firebase login` again |
| `Error: project not found` | Check `.firebaserc` has `"default": "todo-ec064"` |
| `Error: Hosting site not found` | Firebase Console → Hosting → Get started |
| White screen after deploy | Run `npm run build` again, then re-deploy |
| Data not saving | Check Firestore rules are deployed |

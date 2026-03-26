#!/bin/bash
# ════════════════════════════════════════════
#  NoteTask — Firebase Deploy Script
#  Run once on your local machine
# ════════════════════════════════════════════
set -e

echo ""
echo "  ✦ NoteTask — Firebase Deploy"
echo "  ══════════════════════════════"

# ── Step 1: Install dependencies
echo ""
echo "  [1/5] Installing dependencies..."
npm install

# ── Step 2: Build
echo ""
echo "  [2/5] Building production app..."
npm run build
echo "  ✅ Build complete → dist/"

# ── Step 3: Install Firebase CLI
if ! command -v firebase &> /dev/null; then
  echo ""
  echo "  [3/5] Installing Firebase CLI..."
  npm install -g firebase-tools
else
  echo ""
  echo "  [3/5] Firebase CLI already installed ✓"
fi

# ── Step 4: Login to Firebase
echo ""
echo "  [4/5] Login to Firebase (browser will open)..."
firebase login

# ── Step 5: Deploy everything
echo ""
echo "  [5/5] Deploying to Firebase..."

# Deploy Firestore rules + indexes
firebase deploy --only firestore --project todo-ec064

# Deploy Hosting
firebase deploy --only hosting --project todo-ec064

echo ""
echo "  ══════════════════════════════"
echo "  ✅ DEPLOYED SUCCESSFULLY!"
echo "  🔗 https://todo-ec064.web.app"
echo "  ══════════════════════════════"
echo ""

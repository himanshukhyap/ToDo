#!/bin/bash
# ─────────────────────────────────────────────────
# NoteTask — One-click Deploy Script
# Run this once on your local machine
# ─────────────────────────────────────────────────

set -e
echo ""
echo "🚀 NoteTask — Firebase Deploy"
echo "────────────────────────────────"

# 1. Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# 2. Build
echo "🔨 Building production bundle..."
npm run build
echo "✅ Build complete!"

# 3. Install Firebase CLI if not present
if ! command -v firebase &> /dev/null; then
  echo "📥 Installing Firebase CLI..."
  npm install -g firebase-tools
fi

# 4. Login (opens browser)
echo ""
echo "🔐 Logging into Firebase..."
firebase login

# 5. Deploy Firestore rules + indexes
echo ""
echo "📋 Deploying Firestore rules & indexes..."
firebase deploy --only firestore --project todo-ec064

# 6. Deploy hosting
echo ""
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project todo-ec064

echo ""
echo "────────────────────────────────"
echo "✅ DEPLOYED SUCCESSFULLY!"
echo "🔗 Live URL: https://todo-ec064.web.app"
echo "────────────────────────────────"

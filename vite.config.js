import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update service worker when new version available
      registerType: 'autoUpdate',

      // Include these files in the PWA cache
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable.png'],

      // Web App Manifest — makes it installable on phone/desktop
      manifest: {
        name:             'NoteTask',
        short_name:       'NoteTask',
        description:      'Notes, Tasks & Notebook — works offline',
        theme_color:      '#6366f1',
        background_color: '#0f1117',
        display:          'standalone',
        orientation:      'portrait-primary',
        start_url:        '/',
        scope:            '/',
        icons: [
          {
            src:   'icon-192.png',
            sizes: '192x192',
            type:  'image/png',
          },
          {
            src:   'icon-512.png',
            sizes: '512x512',
            type:  'image/png',
          },
          {
            src:     'icon-maskable.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable',   // Android adaptive icon
          },
        ],
      },

      // Workbox configuration — what gets cached and how
      workbox: {
        // Cache app shell (HTML/CSS/JS) — StaleWhileRevalidate
        // App loads from cache instantly, updates in background
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          // Google Fonts — cache first (fonts don't change)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries:    10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts-webfonts',
              expiration: {
                maxEntries:    30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Firestore API — NetworkFirst
          // Try network first; fall back to cache if offline
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries:    200,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Auth API
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-auth-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Never skip waiting — ensures clean update
        skipWaiting:    true,
        clientsClaim:   true,

        // Fallback to index.html for all navigation (SPA routing)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },

      // Dev options — enable in development too for testing
      devOptions: {
        enabled: false,   // Set true to test PWA locally
        type:    'module',
      },
    }),
  ],
});

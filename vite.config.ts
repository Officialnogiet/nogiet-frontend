
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icon-teal.png', 'assets/logo-full.png'],
      manifest: {
        name: 'NOGIET - Methane Monitoring Portal',
        short_name: 'NOGIET',
        description: 'Nigerian Oil & Gas Methane Emissions Tracking Portal',
        theme_color: '#009688',
        background_color: '#0b0e14',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'assets/icon-teal.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/icon-teal.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'assets/icon-teal.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Discard any caches left over from previous SW versions (the old
        // `*-cache` names below) — prevents stale satellite/dashboard responses
        // surviving deploys.
        cleanupOutdatedCaches: true,
        // Take control of open tabs as soon as the new SW activates — without
        // this the user would keep seeing the previous cached responses until
        // every tab is closed and re-opened.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // Facilities are nearly-static reference data; serve from network with
          // a fast timeout, fall back to cache when offline.
          {
            urlPattern: /\/api\/v1\/facilities/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'facilities-cache-v2',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          // Satellite & dashboard contain LIVE methane data. Previously these
          // were StaleWhileRevalidate which served day-old cached responses
          // before going to the network — which is exactly why the live map
          // appeared empty when the backend actually had data. Now we always
          // try the network first; cache is only used as an offline fallback
          // and only kept for 5 minutes so it can never look "wrong" for long.
          {
            urlPattern: /\/api\/v1\/satellite/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'satellite-cache-v2',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\/api\/v1\/alerts/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'alerts-cache-v2',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /\/api\/v1\/dashboard/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dashboard-cache-v2',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl'],
          'charts': ['recharts'],
          'export': ['html2canvas', 'xlsx', 'pptxgenjs'],
          'vendor': ['react', 'react-dom', '@tanstack/react-query', 'zustand', 'axios'],
        },
      },
    },
  }
});

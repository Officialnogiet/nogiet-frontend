
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
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/facilities/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'facilities-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/v1\/satellite/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'satellite-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/v1\/alerts/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'alerts-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /\/api\/v1\/dashboard/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dashboard-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
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

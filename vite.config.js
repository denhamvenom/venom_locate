import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')) {
            return 'react-vendor'
          }
          if (id.includes('/node_modules/firebase/') ||
              id.includes('/node_modules/@firebase/')) {
            return 'firebase-vendor'
          }
          if (id.includes('/node_modules/dexie/')) {
            return 'dexie-vendor'
          }
        },
      },
    },
  },
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['venom-logo.png', 'venom-logo-192.png', 'venom-logo-512.png'],
      manifest: {
        name: 'Venom Locate',
        short_name: 'VLocate',
        description: 'FRC 8044 Denham Venom — Real-time student location tracker',
        start_url: '/',
        display: 'standalone',
        background_color: '#1A1A1A',
        theme_color: '#461D7C',
        icons: [
          {
            src: '/venom-logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/venom-logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
})

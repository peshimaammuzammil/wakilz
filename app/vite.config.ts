import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import Sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    inspectAttr(), 
    react(),
    Sitemap({ 
      hostname: 'https://wakilz.com/',
      exclude: ['/404', '404'],
      dynamicRoutes: ['/conversations', '/ai-isa-real-estate', '/multilingual-voice-agent', '/wakilz-vs-human-isa', '/ai-voice-agent-luxury-real-estate']
    })
  ],
  server: {
    port: 3000,
    proxy: {
      // Proxy all backend API calls during local dev → avoids CORS and hard-coded base URL
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

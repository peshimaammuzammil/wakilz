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
      dynamicRoutes: ['/conversations', '/ai-isa-real-estate', '/multilingual-voice-agent']
    })
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

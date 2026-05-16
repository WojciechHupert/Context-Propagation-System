import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        foundations: resolve(__dirname, 'foundations.html'),
        blog: resolve(__dirname, 'blog.html'),
        system: resolve(__dirname, 'system.html'),
        contact: resolve(__dirname, 'contact.html'),
        purpose: resolve(__dirname, 'what-is-cps.html'),
      },
    },
  },
})

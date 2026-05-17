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
        howDoesItWork: resolve(__dirname, 'how-does-it-work.html'),
        useCases: resolve(__dirname, 'use-cases.html'),
        blog: resolve(__dirname, 'blog.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
})

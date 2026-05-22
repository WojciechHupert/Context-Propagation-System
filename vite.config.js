import { copyFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootStaticFiles = ['ai.txt', 'llms.txt', 'robots.txt', 'sitemap.xml']

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-root-static-files',
      closeBundle() {
        for (const file of rootStaticFiles) {
          copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file))
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        foundations: resolve(__dirname, 'foundations.html'),
        howDoesItWork: resolve(__dirname, 'how-does-it-work.html'),
        useCases: resolve(__dirname, 'use-cases.html'),
        blog: resolve(__dirname, 'blog.html'),
        contact: resolve(__dirname, 'contact.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        cookiePolicy: resolve(__dirname, 'cookie-policy.html'),
      },
    },
  },
})

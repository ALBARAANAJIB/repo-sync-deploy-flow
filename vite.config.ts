
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { crx } from '@crxjs/vite-plugin'
import manifestJson from './public/manifest.json'
import { componentTagger } from "lovable-tagger"

const manifest = manifestJson as any;

export default defineConfig(({mode}) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    crx({ manifest }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: "::",
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: 'index.html',
        popup: 'public/popup.html',
        dashboard: 'public/dashboard.html',
        content: 'public/content.js',
      },
    }
  }
}))

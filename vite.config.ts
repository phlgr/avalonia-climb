import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages project site is served from /<repo>/. Change to '/' for a custom
// domain or user/org page. The router reads this back via import.meta.env.BASE_URL.
const BASE = '/avalonia-climb/'

// GitHub Pages has no SPA server fallback: a hard refresh on /forecast 404s.
// Copying index.html to 404.html after the build lets the client router take over.
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), spaFallback()],
})

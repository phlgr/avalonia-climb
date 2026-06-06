import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Served at the root of the custom domain isavaloniadry.gartz.dev (see public/CNAME),
// so the base is '/'. For a project page without a custom domain this would be
// '/<repo>/'. The router reads this back via import.meta.env.BASE_URL.
const BASE = '/'

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
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
    }),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    spaFallback(),
  ],
})

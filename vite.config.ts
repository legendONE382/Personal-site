import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Two build modes:
 *
 *  • `npm run build:static` → the DEPLOY build. Standard Vite output with real
 *    code splitting: the first screen is ~70 KB; three.js, gsap and the whole
 *    WebGL world arrive as separate cacheable chunks only after that paints.
 *    Use this for Vercel / Netlify / any static host.
 *
 *  • `npm run build` → one self-contained index.html. Everything inlines, so
 *    the site works when a single file is served alone. Slower first paint on
 *    bad networks; keep it for previews and single-file hand-offs.
 */
const STATIC = process.env.STATIC_BUILD === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(STATIC ? [] : [viteSingleFile()])],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    // keep the small screenshots as separate, cacheable files in the deploy build
    assetsInlineLimit: STATIC ? 1024 : 100000,
    chunkSizeWarningLimit: 1200,
    rollupOptions: STATIC
      ? {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/three/')) return 'three'
              if (id.includes('node_modules/postprocessing/')) return 'three'
              if (id.includes('node_modules/gsap/') || id.includes('node_modules/lenis/')) return 'motion'
              if (id.includes('node_modules/lil-gui/')) return 'gui'
              if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
              return undefined
            },
          },
        }
      : undefined,
  },
})

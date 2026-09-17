import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site under /<repo>/, but asset paths in src are written
// root-absolute as plain strings, which Vite's base option does not rewrite.
const ASSET_RE = /(?<![\w/.-])\/(?:offers|brand|venue)\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|svg)/g

const prefixAssets = (base: string): Plugin => ({
  name: 'prefix-public-assets',
  apply: 'build',
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'chunk') file.code = file.code.replace(ASSET_RE, (p) => base + p.slice(1))
      else if (typeof file.source === 'string') file.source = file.source.replace(ASSET_RE, (p) => base + p.slice(1))
    }
  },
})

export default defineConfig(({ mode }) => {
  const base = loadEnv(mode, '.', 'PAGES_').PAGES_BASE || '/'
  return {
    base,
    plugins: [react(), ...(base === '/' ? [] : [prefixAssets(base)])],
    server: { port: 5180 },
  }
})

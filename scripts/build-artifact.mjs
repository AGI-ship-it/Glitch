// Folds the built site into one HTML file: the bundle, the stylesheet and every
// asset it references become inline text or data: URIs, because an artifact is
// served from a sandbox that cannot fetch anything alongside the page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const OUT = process.argv[2] ?? 'dist/artifact.html'

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
}

const assets = readdirSync(join(DIST, 'assets'))
const jsName = assets.find((f) => f.endsWith('.js'))
const cssName = assets.find((f) => f.endsWith('.css'))
let js = readFileSync(join(DIST, 'assets', jsName), 'utf8')
let css = readFileSync(join(DIST, 'assets', cssName), 'utf8')

const dataUri = (path) => {
  const ext = path.slice(path.lastIndexOf('.'))
  const buf = readFileSync(join(DIST, path))
  // SVG stays as text — base64 would roughly double a file that is already tiny.
  if (ext === '.svg') {
    return `data:image/svg+xml,${encodeURIComponent(buf.toString('utf8')).replace(/'/g, '%27')}`
  }
  return `data:${MIME[ext]};base64,${buf.toString('base64')}`
}

const RE = /\/(?:offers|brand|venue)\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|svg)/g
const seen = new Map()
const resolve = (path) => {
  if (!seen.has(path)) {
    if (!existsSync(join(DIST, path))) throw new Error(`missing asset: ${path}`)
    seen.set(path, dataUri(path))
  }
  return seen.get(path)
}

js = js.replace(RE, resolve)
css = css.replace(RE, resolve)

// A second argument names the build, so variants are told apart in the gallery.
const title = process.argv[3] ?? 'Glitch Sports — Book a court in Deira'
const html = `<title>${title}</title>
<meta name="description" content="Book basketball and volleyball courts at Glitch Sports, Al Ghurair Centre, Deira. Pick a slot, pay online, show your QR code at reception." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Gantari:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`

writeFileSync(OUT, html)
const mb = (Buffer.byteLength(html) / 1048576).toFixed(2)
console.log(`${OUT} — ${mb} MB — ${seen.size} assets inlined`)

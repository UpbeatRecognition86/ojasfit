// Converts the images in demo-src/ into what the app serves:
//   public/demo/<id>-a.webp (and -b.webp), 720px square, plus public/demo/manifest.json.
// Reports anything missing or misnamed. Usage: node scripts/import-demos.mjs
import { readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { EXERCISES } from '../src/data/exercises.js'

const src = new URL('../demo-src/', import.meta.url).pathname
const out = new URL('../public/demo/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const ids = new Set(EXERCISES.map((e) => e.id))
const files = readdirSync(src).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
const manifest = {}
const unknown = []
for (const f of files) {
  const m = /^(.+)-([ab])\.\w+$/i.exec(f)
  if (!m || !ids.has(m[1])) { unknown.push(f); continue }
  const [, id, frame] = m
  const dest = `${out}${id}-${frame.toLowerCase()}.webp`
  // Centre-crop to a square, resize, and encode as WebP.
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src + f,
    '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=720:720:flags=lanczos", '-c:v', 'libwebp', '-quality', '82', dest])
  manifest[id] = Math.max(manifest[id] || 0, frame.toLowerCase() === 'b' ? 2 : 1)
}
// A "-b" without its "-a" cannot be shown.
for (const id of Object.keys(manifest)) {
  if (!existsSync(`${out}${id}-a.webp`)) { delete manifest[id]; rmSync(`${out}${id}-b.webp`, { force: true }); unknown.push(`${id}-b (no ${id}-a)`) }
}
writeFileSync(out + 'manifest.json', JSON.stringify(manifest))
const missing = EXERCISES.filter((e) => !manifest[e.id]).map((e) => e.id)
console.log(`Imported ${Object.keys(manifest).length} of ${EXERCISES.length} exercises.`)
if (missing.length) console.log(`Still using the drawn figure (${missing.length}): ${missing.join(', ')}`)
if (unknown.length) console.log(`Skipped, name not recognised: ${unknown.join(', ')}`)

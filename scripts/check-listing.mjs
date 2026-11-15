// Checks store/listing.md against Play Store character limits.
import { readFileSync } from 'node:fs'
const md = readFileSync(new URL('../store/listing.md', import.meta.url), 'utf8')
const LIMITS = { 'App name': 30, 'Short description': 80, 'Full description': 4000, "What's new": 500 }
let ok = true
for (const lang of md.split(/\n## /).slice(1)) {
  const name = lang.split('\n')[0]
  for (const m of lang.matchAll(/### ([^(\n]+?)\s*\(.*?\)\n```\n([\s\S]*?)\n```/g)) {
    const field = m[1].replace(/ \(release notes.*/, '').trim()
    const limit = LIMITS[field]
    const len = [...m[2]].length
    const pass = len <= limit
    ok &&= pass
    console.log(`${pass ? 'ok  ' : 'OVER'} ${name.padEnd(28)} ${field.padEnd(18)} ${String(len).padStart(4)} / ${limit}`)
  }
}
process.exit(ok ? 0 : 1)

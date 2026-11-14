// Splits one long recording into per-line clips by detecting the silences between lines.
//   node scripts/split-voice.mjs hi recordings/voice-hi.m4a [--noise -35] [--gap 0.9] [--skip 4,17]
// --skip drops the given segment numbers (e.g. a fumbled take that was repeated).
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { VOICE_LINES } from '../src/data/voice.js'

const [lang, file, ...rest] = process.argv.slice(2)
const opt = (name, def) => { const i = rest.indexOf('--' + name); return i >= 0 ? rest[i + 1] : def }
if (!['hi', 'en'].includes(lang) || !file || !existsSync(file)) {
  console.error('Usage: node scripts/split-voice.mjs <hi|en> <recording> [--noise -35] [--gap 0.9] [--skip 4,17]')
  process.exit(1)
}
const noise = opt('noise', '-35')
const gap = opt('gap', '0.9')
const skip = new Set(String(opt('skip', '')).split(',').filter(Boolean).map(Number))

const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `silencedetect=noise=${noise}dB:d=${gap}`, '-f', 'null', '-'], { encoding: 'utf8' })
const log = probe.stderr
const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }))
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]))
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))

// Speech is whatever lies between silences.
let segs = []
let cursor = 0
for (let i = 0; i < starts.length; i++) {
  if (starts[i] - cursor > 0.25) segs.push([cursor, starts[i]])
  cursor = ends[i] ?? total
}
if (total - cursor > 0.25) segs.push([cursor, total])
segs = segs.filter((_, i) => !skip.has(i + 1))

if (segs.length !== VOICE_LINES.length) {
  console.error(`Found ${segs.length} spoken segments but the script has ${VOICE_LINES.length} lines.`)
  segs.forEach(([a, b], i) => console.error(`  ${String(i + 1).padStart(3)}  ${a.toFixed(1)}s – ${b.toFixed(1)}s  (${(b - a).toFixed(1)}s)`))
  console.error('Too many: a line was said twice or there was a noise; drop it with --skip N.\nToo few: two lines ran together; try --gap 0.6, or --noise -30 for a noisy room.')
  process.exit(1)
}

const dir = new URL(`../public/audio/${lang}/`, import.meta.url).pathname
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
segs.forEach(([a, b], i) => {
  const start = Math.max(0, a - 0.08)
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-t', String(b - start + 0.15), '-i', file,
    '-af', 'highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.02', '-ac', '1', '-ar', '44100', '-b:a', '64k', `${dir}${VOICE_LINES[i].id}.mp3`])
})
const mf = new URL('../public/audio/manifest.json', import.meta.url)
const manifest = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : {}
manifest[lang] = VOICE_LINES.map((l) => l.id)
writeFileSync(mf, JSON.stringify(manifest))
console.log(`Wrote ${segs.length} ${lang} clips to public/audio/${lang}/ and updated the manifest.`)

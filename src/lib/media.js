// Voice coach (browser text-to-speech), beeps and screen wake lock.
let ctx = null

export function beep(freq = 880, ms = 120) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + ms / 1000)
  } catch { /* audio not available */ }
}

// Phones ship several voices per language; the default is often the most robotic.
// Prefer network/"natural" voices, then Google's, and an Indian accent for English.
let voiceCache = {}
function scoreVoice(v, lang) {
  const name = v.name.toLowerCase()
  const code = v.lang.replace('_', '-').toLowerCase()
  let s = 0
  if (lang === 'hi') { if (!code.startsWith('hi')) return -1 } else {
    if (!code.startsWith('en')) return -1
    s += code === 'en-in' ? 6 : code === 'en-gb' ? 2 : 0
  }
  if (/natural|neural|wavenet|enhanced|premium|online/.test(name)) s += 5
  if (/google/.test(name)) s += 3
  if (!v.localService) s += 2
  if (/female|woman|heera|swara|lekha|neerja|kalpana/.test(name)) s += 1
  return s
}
function pickVoice(lang) {
  if (voiceCache[lang]) return voiceCache[lang]
  const voices = window.speechSynthesis.getVoices()
  let best = null
  let top = -1
  for (const v of voices) { const sc = scoreVoice(v, lang); if (sc > top) { top = sc; best = v } }
  if (best) voiceCache[lang] = best
  return best
}
try { window.speechSynthesis?.addEventListener?.('voiceschanged', () => { voiceCache = {} }) } catch { /* ignore */ }

export function speak(text, lang) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice(lang)
    if (v) u.voice = v
    u.lang = v ? v.lang : lang === 'hi' ? 'hi-IN' : 'en-IN'
    u.rate = 1
    u.pitch = 1
    synth.speak(u)
  } catch { /* speech not available */ }
}

// ---- Recorded voice pack ----
// public/audio/manifest.json lists the clip ids available per language. When every clip a
// sentence needs is there, the recording plays; otherwise the phone's own voice is used.
let manifest = {}
let current = null
export async function loadVoicePack() {
  try {
    const r = await fetch('./audio/manifest.json', { cache: 'no-cache' })
    if (r.ok) manifest = await r.json()
  } catch { /* offline or no pack: fall back to the built-in voice */ }
}
export const hasVoicePack = (lang) => Array.isArray(manifest[lang]) && manifest[lang].length > 0

export function sayClips(ids, lang, fallbackText) {
  stopSpeaking()
  const have = manifest[lang]
  if (!have || !ids.every((id) => have.includes(id))) {
    if (fallbackText) speak(fallbackText, lang)
    return
  }
  const token = { audio: null }
  current = token
  const play = (n) => {
    if (current !== token || n >= ids.length) return
    const a = new Audio(`./audio/${lang}/${ids[n]}.mp3`)
    token.audio = a
    a.onended = () => play(n + 1)
    a.onerror = () => play(n + 1)
    a.play().catch(() => {})
  }
  play(0)
}

export function stopSpeaking() {
  try { current?.audio?.pause() } catch { /* ignore */ }
  current = null
  try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
}

export async function keepAwake() {
  try { return await navigator.wakeLock?.request('screen') } catch { return null }
}

export function buzz(pattern) {
  try { navigator.vibrate?.(pattern) } catch { /* not supported */ }
}

// ---- Exercise videos ----
// public/video/manifest.json lists the exercise ids that have a looping clip at
// public/video/<id>.mp4. Moves without a clip fall back to the drawn figure.
let videoIds = new Set()
export async function loadVideoPack() {
  try {
    const r = await fetch('./video/manifest.json', { cache: 'no-cache' })
    if (r.ok) videoIds = new Set(await r.json())
  } catch { /* offline or no pack */ }
}
export const hasVideo = (id) => videoIds.has(id)

// ---- Exercise photos ----
// public/demo/manifest.json maps an exercise id to its number of frames (1 or 2);
// the frames are public/demo/<id>-a.webp and <id>-b.webp. See DEMO-PROMPTS.md.
let demoFrames = {}
export async function loadDemoPack() {
  try {
    const r = await fetch('./demo/manifest.json', { cache: 'no-cache' })
    if (r.ok) demoFrames = await r.json()
  } catch { /* offline or no pack */ }
}
export const demoCount = (id) => demoFrames[id] || 0

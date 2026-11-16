import { APP } from '../config.js'

// Draws the session recap as a 1080×1920 image (WhatsApp Status / Instagram Story size).
// card: { head, title, sub, metrics: [[value, label] × 4], banner }
export async function recapImage(card) {
  try { await document.fonts.ready } catch { /* draw with fallback fonts */ }
  const W = 1080, H = 1920
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const c = cv.getContext('2d')
  const font = (w, px) => `${w} ${px}px 'Anek Devanagari Variable', system-ui, sans-serif`
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#1f2547'); g.addColorStop(1, '#0b0d1a')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  const glow = c.createRadialGradient(W / 2, 430, 0, W / 2, 430, 720)
  glow.addColorStop(0, 'rgba(255,90,110,0.24)'); glow.addColorStop(1, 'rgba(255,90,110,0)')
  c.fillStyle = glow; c.fillRect(0, 0, W, 1200)
  const box = (x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill() }
  const fit = (text, w, px, max) => { let s = px; c.font = font(w, s); while (c.measureText(text).width > max && s > 30) { s -= 4; c.font = font(w, s) } }
  c.textAlign = 'center'
  // brand mark
  c.strokeStyle = '#ff5a6e'; c.lineWidth = 16; c.lineCap = 'round'
  c.beginPath(); c.arc(W / 2, 250, 54, -0.75, Math.PI * 1.48); c.stroke()
  c.fillStyle = '#ff5a6e'; c.beginPath(); c.arc(W / 2 + 44, 206, 11, 0, Math.PI * 2); c.fill()
  c.font = font(800, 40); c.fillStyle = '#ff5a6e'
  c.fillText(`${APP.name.toUpperCase()}  •  ${card.head}`, W / 2, 400)
  c.fillStyle = '#ffffff'; fit(card.title, 900, 104, 960); c.fillText(card.title, W / 2, 540)
  c.fillStyle = '#9aa0c3'; c.font = font(500, 40); c.fillText(card.sub, W / 2, 620)
  card.metrics.forEach(([value, label], n) => {
    const x = 80 + (n % 2) * 470, y = 720 + Math.floor(n / 2) * 330
    box(x, y, 450, 300, 36, 'rgba(255,255,255,0.05)')
    c.fillStyle = '#ff5a6e'; fit(String(value), 800, 120, 400); c.fillText(String(value), x + 225, y + 170)
    c.fillStyle = '#9aa0c3'; c.font = font(700, 34); c.fillText(label.toUpperCase(), x + 225, y + 240)
  })
  if (card.banner) {
    box(80, 1410, 920, 120, 28, 'rgba(255,90,110,0.16)')
    c.fillStyle = '#ffffff'; fit(card.banner, 700, 44, 860); c.fillText(card.banner, W / 2, 1486)
  }
  c.fillStyle = '#9aa0c3'; c.font = font(600, 38)
  c.fillText((APP.url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, 1800)
  return new Promise((resolve) => cv.toBlob(resolve, 'image/png'))
}

// Shares the image through the phone's share sheet (WhatsApp, Instagram…). Where that is not
// supported, saves the image and opens WhatsApp with the caption instead.
export async function shareRecap(card, caption) {
  const blob = await recapImage(card)
  const file = new File([blob], 'ojasfit-workout.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text: caption }); return 'shared' } catch (e) { if (e.name === 'AbortError') return 'cancelled' }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank', 'noopener')
  return 'saved'
}

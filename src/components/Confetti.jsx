import { useEffect, useRef } from 'react'

const COLORS = ['#ff5a6e', '#ffb0bb', '#8ea2ff', '#ffc247', '#4be3a0', '#f4f5ff']

// A short burst of confetti drawn on a canvas. Skipped when the person prefers reduced motion.
export default function Confetti() {
  const ref = useRef(null)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cv.width = innerWidth * dpr)
    const H = (cv.height = innerHeight * dpr)
    const parts = Array.from({ length: 110 }, (_, i) => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.28,
      vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 15 - 5) * dpr,
      s: (5 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[i % COLORS.length],
    }))
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const age = now - t0
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1800) / 900)
      for (const p of parts) {
        p.vy += 0.42 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore()
      }
      if (age < 2700) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}

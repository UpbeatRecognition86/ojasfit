import { useEffect, useState } from 'react'

// Animated stick figure. Each pose is two key frames of joint positions on a 100×100 canvas
// (ground at y=90). h=head s=shoulder p=hip e/w=elbow/hand k/f=knee/foot, "2" = far-side limb.
const side = (o = {}) => ({ h: [50, 17], s: [50, 29], p: [50, 55], e: [51, 42], w: [52, 54], k: [50, 72], f: [50, 90], ...o })
const front = (o = {}) => ({ h: [50, 17], s: [50, 29], p: [50, 55], e: [43, 41], w: [41, 53], e2: [57, 41], w2: [59, 53], k: [47, 72], f: [46, 90], k2: [53, 72], f2: [54, 90], ...o })

const SQ = side({ h: [56, 34], s: [53, 45], p: [42, 66], e: [62, 50], w: [72, 48], k: [60, 67], f: [54, 90] })
const PU = { h: [80, 62], s: [71, 68], p: [46, 74], e: [71, 79], w: [71, 90], k: [33, 80], f: [20, 88] }
const REACH = side({ h: [50, 15], s: [50, 27], p: [50, 54], e: [51, 14], w: [50, 2], k: [50, 72] })
const FOLD = side({ h: [60, 66], s: [56, 56], p: [46, 48], e: [58, 68], w: [58, 82], k: [47, 70], f: [48, 90] })
const DOG = { h: [66, 76], s: [62, 66], p: [42, 40], e: [67, 78], w: [72, 90], k: [34, 66], f: [26, 90] }
const COBRA = { h: [73, 56], s: [68, 68], p: [46, 87], e: [70, 80], w: [76, 90], k: [32, 88], f: [18, 88] }
const BRIDGE = { h: [18, 84], s: [29, 86], p: [52, 86], e: [40, 88], w: [50, 89], k: [66, 68], f: [74, 90] }
const FLAT = { h: [18, 84], s: [29, 86], p: [52, 86], e: [40, 88], w: [50, 89], k: [69, 86], f: [86, 86] }
const SIT = { h: [40, 26], s: [40, 38], p: [40, 62], e: [45, 50], w: [54, 59], k: [58, 62], f: [58, 90] }
const FOURS = { h: [77, 56], s: [68, 62], p: [40, 62], e: [68, 76], w: [68, 90], k: [40, 90], f: [24, 90] }
const HIPS = { e: [42, 42], w: [47, 52], e2: [58, 42], w2: [53, 52] }
const CROSS = { h: [50, 40], s: [50, 52], p: [50, 78], e: [41, 64], w: [36, 76], e2: [59, 64], w2: [64, 76], k: [34, 80], f: [52, 88], k2: [66, 80], f2: [48, 88] }

const POSES = {
  squat: [side(), SQ],
  wallsit: [{ h: [36, 34], s: [36, 46], p: [36, 68], e: [40, 56], w: [50, 64], k: [56, 68], f: [56, 90] }, { h: [36, 35], s: [36, 47], p: [36, 68], e: [40, 57], w: [50, 64], k: [56, 68], f: [56, 90] }],
  lunge: [side(), side({ h: [50, 30], s: [50, 42], p: [50, 66], e: [47, 53], w: [52, 62], k: [66, 70], f: [66, 90], k2: [42, 84], f2: [28, 86] })],
  pushup: [PU, { h: [81, 78], s: [71, 82], p: [46, 82], e: [61, 77], w: [71, 90], k: [33, 84], f: [20, 88] }],
  plank: [{ h: [80, 68], s: [70, 74], p: [46, 77], e: [70, 89], w: [80, 89], k: [33, 82], f: [20, 88] }, { h: [80, 67], s: [70, 73], p: [46, 75], e: [70, 89], w: [80, 89], k: [33, 81], f: [20, 88] }],
  climber: [{ ...PU, k2: [58, 80], f2: [50, 87] }, { ...PU, k: [58, 80], f: [50, 87], k2: [33, 80], f2: [20, 88] }],
  thrust: [SQ, PU],
  jack: [front(), front({ h: [50, 16], s: [50, 28], p: [50, 54], e: [40, 20], w: [36, 7], e2: [60, 20], w2: [64, 7], k: [41, 72], f: [35, 90], k2: [59, 72], f2: [65, 90] })],
  skip: [front({ e: [42, 40], w: [36, 48], e2: [58, 40], w2: [64, 48] }), front({ h: [50, 12], s: [50, 24], p: [50, 50], e: [42, 35], w: [36, 43], e2: [58, 35], w2: [64, 43], k: [47, 67], f: [46, 84], k2: [53, 67], f2: [54, 84] })],
  march: [
    side({ k: [62, 60], f: [60, 76], k2: [50, 72], f2: [50, 90], e: [45, 41], w: [42, 51], e2: [57, 40], w2: [63, 34] }),
    side({ k: [50, 72], f: [50, 90], k2: [62, 60], f2: [60, 76], e: [57, 40], w: [63, 34], e2: [45, 41], w2: [42, 51] }),
  ],
  box: [
    side({ p: [49, 56], k: [53, 73], f: [56, 90], k2: [45, 73], f2: [40, 90], e: [56, 42], w: [58, 32], e2: [60, 36], w2: [76, 30] }),
    side({ p: [49, 56], k: [53, 73], f: [56, 90], k2: [45, 73], f2: [40, 90], e: [60, 36], w: [76, 30], e2: [56, 42], w2: [58, 32] }),
  ],
  bhangra: [
    front({ h: [48, 17], e: [40, 24], w: [38, 10], e2: [60, 24], w2: [62, 10], k: [40, 62], f: [44, 76] }),
    front({ h: [52, 17], e: [40, 24], w: [38, 10], e2: [60, 24], w2: [62, 10], k2: [60, 62], f2: [56, 76] }),
  ],
  hop: [front({ ...HIPS, k2: [58, 66], f2: [56, 78] }), front({ ...HIPS, h: [50, 12], s: [50, 24], p: [50, 50], k: [47, 67], f: [46, 84], k2: [58, 61], f2: [56, 73], e: [42, 37], w: [47, 47], e2: [58, 37], w2: [53, 47] })],
  bridge: [BRIDGE, { ...BRIDGE, p: [52, 71], k: [67, 66] }],
  crunch: [BRIDGE, { ...BRIDGE, h: [24, 70], s: [32, 78], e: [44, 74], w: [56, 70] }],
  legraise: [FLAT, { ...FLAT, k: [56, 68], f: [58, 50] }],
  lie: [FLAT, { ...FLAT, s: [29, 85] }],
  chair: [SIT, side({ h: [54, 17], s: [54, 29], p: [54, 55], e: [55, 42], w: [56, 54], k: [56, 72], f: [58, 90] })],
  seated: [{ ...SIT, e2: [45, 50], w2: [54, 59], k2: [58, 62], f2: [58, 90] }, { ...SIT, e: [46, 28], w: [44, 14], k: [58, 56], f: [68, 76], e2: [45, 50], w2: [54, 59], k2: [58, 62], f2: [58, 90] }],
  reach: [side(), REACH],
  calf: [side({ e: [46, 42], w: [51, 52] }), side({ h: [50, 13], s: [50, 25], p: [50, 51], e: [46, 38], w: [51, 48], k: [50, 69] })],
  fold: [REACH, FOLD],
  surya: [REACH, FOLD],
  downdog: [PU, DOG],
  cobra: [{ h: [80, 80], s: [71, 85], p: [46, 88], e: [70, 89], w: [78, 90], k: [32, 88], f: [18, 88] }, COBRA],
  dand: [DOG, COBRA],
  superman: [{ h: [80, 80], s: [71, 85], p: [46, 87], e: [80, 86], w: [90, 86], k: [32, 88], f: [18, 88] }, { h: [80, 72], s: [71, 80], p: [46, 87], e: [81, 76], w: [91, 72], k: [31, 84], f: [17, 78] }],
  birddog: [FOURS, { ...FOURS, e2: [80, 60], w2: [92, 58], k2: [26, 62], f2: [12, 62] }],
  catcow: [{ ...FOURS, h: [77, 68], s: [67, 60], p: [41, 60] }, { ...FOURS, h: [79, 52], s: [68, 64], p: [40, 64] }],
  child: [{ h: [66, 82], s: [58, 76], p: [36, 74], e: [70, 84], w: [82, 88], k: [52, 88], f: [30, 88] }, { h: [66, 81], s: [58, 75], p: [36, 73], e: [70, 84], w: [82, 88], k: [52, 88], f: [30, 88] }],
  sitfloor: [CROSS, { ...CROSS, h: [50, 37], s: [50, 50] }],
  balance: [front(), front({ e: [42, 18], w: [50, 5], e2: [58, 18], w2: [50, 5], k2: [64, 64], f2: [50, 70] })],
  sideleg: [front(HIPS), front({ ...HIPS, k2: [62, 70], f2: [72, 84] })],
  sidebend: [front(), front({ h: [61, 20], s: [56, 31], e: [63, 20], w: [73, 12], e2: [59, 44], w2: [57, 56] })],
  twist: [front({ e: [40, 36], w: [34, 30], e2: [58, 38], w2: [50, 34] }), front({ e: [42, 38], w: [50, 34], e2: [60, 36], w2: [66, 30] })],
  wallpush: [{ h: [58, 22], s: [55, 34], p: [47, 58], e: [68, 35], w: [81, 36], k: [43, 74], f: [38, 90] }, { h: [69, 25], s: [65, 37], p: [52, 60], e: [70, 48], w: [81, 38], k: [45, 75], f: [38, 90] }],
}

const PROPS = {
  chair: 'M28 36V90M28 66H48V90',
  seated: 'M28 36V90M28 66H48V90',
  wallsit: 'M30 6V90',
  wallpush: 'M84 6V90',
}

const full = (fr) => ({ ...fr, e2: fr.e2 || fr.e, w2: fr.w2 || fr.w, k2: fr.k2 || fr.k, f2: fr.f2 || fr.f })
const KEYS = ['h', 's', 'p', 'e', 'w', 'e2', 'w2', 'k', 'f', 'k2', 'f2']

function mix(a, b, t) {
  const o = {}
  for (const key of KEYS) o[key] = [a[key][0] + (b[key][0] - a[key][0]) * t, a[key][1] + (b[key][1] - a[key][1]) * t]
  return o
}

export default function Figure({ pose, animate = false, size = 96, speed = 1 }) {
  const frames = POSES[pose] || POSES.reach
  const [t, setT] = useState(1)
  useEffect(() => {
    if (!animate) { setT(1); return }
    let raf
    const start = performance.now()
    const loop = (now) => {
      setT((1 - Math.cos(((now - start) / 1100) * Math.PI * speed)) / 2)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate, pose, speed])

  const j = mix(full(frames[0]), full(frames[1]), t)
  const d = (...pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')
  // Neck point: a little way from the shoulder toward the head, so the head sits naturally.
  const neck = [j.s[0] + (j.h[0] - j.s[0]) * 0.35, j.s[1] + (j.h[1] - j.s[1]) * 0.35]
  const lowest = Math.max(j.f[1], j.f2[1], j.p[1], j.w[1], j.k[1])
  const cx = (j.p[0] + j.s[0] + j.f[0] + j.f2[0]) / 4
  const spread = Math.max(14, Math.abs(j.f[0] - j.s[0]) * 0.6 + Math.abs(j.f2[0] - j.f[0]) * 0.4 + 12)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="figure" aria-hidden="true">
      <ellipse cx={cx} cy="92.5" rx={spread} ry="2.6" className="fig-shadow" style={{ opacity: 0.1 + 0.16 * Math.min(1, lowest / 90) }} />
      {PROPS[pose] && <path d={PROPS[pose]} className="fig-prop" />}
      <path d={d(j.s, j.e2, j.w2)} className="fig-far fig-arm" />
      <path d={d(j.p, j.k2, j.f2)} className="fig-far fig-leg" />
      <path d={d(neck, j.s, j.p)} className="fig-torso" />
      <path d={d(j.p, j.k, j.f)} className="fig-near fig-leg" />
      <path d={d(j.s, j.e, j.w)} className="fig-near fig-arm" />
      <circle cx={j.h[0]} cy={j.h[1]} r="6.6" className="fig-head" />
    </svg>
  )
}

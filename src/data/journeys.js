// Journeys: periodised programs. Each week moves through a training phase; sessions cycle
// through the journey's pool. Items are exercise ids, or ladder slots like '@push' /
// '@push-1' that resolve to the athlete's current rung (see TREES in exercises.js).
// An item may be [id, amount] to fix the amount (used by Peaks).
const WARM = ['march', 'arm_circles', 'torso_twist', 'jumping_jacks']
const COOL = ['forward_fold', 'cobra', 'child_pose', 'breathing']

export const JOURNEYS = [
  {
    id: 'shred', icon: 'flame', color: '#FF6B3D', weeks: 8, benchmark: 'nilgiri',
    name: { en: 'Bodyweight Shred', hi: 'बॉडीवेट श्रेड' },
    tag: { en: 'Burn fat with high-energy intervals', hi: 'तेज़ इंटरवल से चर्बी घटाएँ' },
    about: { en: 'Eight weeks of fast circuits that keep your heart rate high: burpees, squats, climbers and core. Built for fat loss and stamina.', hi: 'आठ हफ़्ते के तेज़ सर्किट जो धड़कन ऊँची रखते हैं: बर्पी, बैठक, क्लाइंबर और कोर। चर्बी घटाने और दम बढ़ाने के लिए।' },
    warm: WARM, cool: COOL,
    pool: [
      { name: { en: 'Burn Circuit', hi: 'बर्न सर्किट' }, format: 'intervals', rounds: 4, items: ['burpee', '@legs', '@engine', '@core'] },
      { name: { en: 'Engine', hi: 'इंजन' }, format: 'amrap', cap: 12, items: ['jumping_jacks', '@push-1', 'squat', 'high_knees'] },
      { name: { en: 'Legs on Fire', hi: 'पैरों में आग' }, format: 'intervals', rounds: 4, items: ['jump_squat', 'lunge', 'skipping', '@hips'] },
      { peak: 'full' },
      { name: { en: 'Full Sweat', hi: 'फ़ुल स्वेट' }, format: 'intervals', rounds: 3, items: ['burpee', '@push', 'shadow_boxing', '@core', 'squat'] },
      { peak: 'legs' },
    ],
    drills: ['agni', 'vayu', 'akash', 'jal'],
  },
  {
    id: 'strength', icon: 'dumbbell', color: '#2979FF', weeks: 8, benchmark: 'nilgiri',
    name: { en: 'Desi Strength', hi: 'देसी ताक़त' },
    tag: { en: 'Build muscle at home with calisthenics', hi: 'घर पर कैलिस्थेनिक्स से मांसपेशियाँ बनाएँ' },
    about: { en: 'Eight weeks of slow, strict strength work: push-up and squat progressions, dand-baithak and core holds. You climb the skill ladders as you get stronger.', hi: 'आठ हफ़्ते की धीमी, सख़्त ताक़त की कसरत: पुश-अप और बैठक की सीढ़ियाँ, दंड-बैठक और कोर होल्ड। ताक़त बढ़ने के साथ आप स्किल की सीढ़ी चढ़ते हैं।' },
    warm: ['march', 'arm_circles', 'torso_twist', 'cat_cow'], cool: ['downdog', 'cobra', 'child_pose', 'breathing'],
    pool: [
      { name: { en: 'Push Day', hi: 'पुश डे' }, format: 'intervals', rounds: 4, items: ['@push', '@shoulders', '@core', 'calf_raise'] },
      { name: { en: 'Leg Day', hi: 'लेग डे' }, format: 'intervals', rounds: 4, items: ['@legs', 'lunge', '@hips', 'calf_raise'] },
      { name: { en: 'Dand–Baithak', hi: 'दंड-बैठक' }, format: 'emom', cap: 12, items: ['hindu_pushup', 'hindu_squat'] },
      { peak: 'upper' },
      { name: { en: 'Core & Back', hi: 'कोर और पीठ' }, format: 'intervals', rounds: 3, items: ['@core', '@hips', '@shoulders', '@core-1'] },
      { peak: 'legs' },
    ],
    drills: ['prithvi', 'akash', 'agni', 'jal'],
  },
  {
    id: 'express', icon: 'home', color: '#00E676', weeks: 6, benchmark: 'nilgiri', quiet: true,
    name: { en: 'Living Room Express', hi: 'लिविंग रूम एक्सप्रेस' },
    tag: { en: '20 minutes. Low impact. No excuses.', hi: '20 मिनट। कम झटका। कोई बहाना नहीं।' },
    about: { en: 'Six weeks of compact, quiet sessions for beginners and desk workers. No jumping, fixes posture, fits in a small room.', hi: 'शुरुआती और डेस्क पर काम करने वालों के लिए छह हफ़्ते के छोटे, शांत सेशन। कोई कूद नहीं, पोस्चर सुधारे, छोटे कमरे में हो जाए।' },
    warm: ['march', 'arm_circles', 'side_bend'], cool: ['cat_cow', 'child_pose', 'breathing'],
    pool: [
      { name: { en: 'Posture Reset', hi: 'पोस्चर रीसेट' }, format: 'intervals', rounds: 3, items: ['@legs', '@push', '@hips', 'calf_raise'] },
      { name: { en: 'Quick Burn', hi: 'क्विक बर्न' }, format: 'amrap', cap: 8, items: ['@engine', 'squat', '@push-1', 'glute_bridge'] },
      { name: { en: 'Desk Detox', hi: 'डेस्क डिटॉक्स' }, format: 'intervals', rounds: 3, items: ['@hips', '@engine', '@core', 'wall_sit'] },
      { peak: 'full' },
    ],
    drills: ['jal', 'akash', 'prithvi', 'vayu'],
  },
]
export const JMAP = Object.fromEntries(JOURNEYS.map((j) => [j.id, j]))

// Peaks: the signature workouts. Each has a fixed recipe done against the clock, so a faster
// time is real progress. Items are [exercise, reps]. type: full body, upper body, or legs & core.
// Every Peak can be climbed in three splits (see SPLITS), each with its own personal best.
const P = (id, lvl, type, rounds, en, hi, items) => ({ id, lvl, type, rounds, name: { en, hi }, items })
export const PEAKS = [
  P('nilgiri', 1, 'full', 3, 'Nilgiri', 'नीलगिरि', [['squat', 15], ['knee_pushup', 8], ['knee_drive', 20], ['glute_bridge', 15]]),
  P('aravalli', 1, 'full', 4, 'Aravalli', 'अरावली', [['chair_sit_stand', 12], ['incline_pushup', 10], ['calf_raise', 20], ['knee_drive', 20]]),
  P('satpura', 1, 'full', 3, 'Satpura', 'सतपुड़ा', [['sprawl', 8], ['squat', 15], ['crunch', 15], ['glute_bridge', 15]]),
  P('shivalik', 1, 'upper', 3, 'Shivalik', 'शिवालिक', [['incline_pushup', 10], ['shoulder_taps', 16], ['crunch', 15], ['superman', 12]]),
  P('palani', 1, 'legs', 3, 'Palani', 'पलनी', [['squat', 15], ['glute_bridge', 15], ['calf_raise', 20], ['crunch', 15]]),
  P('sahyadri', 2, 'full', 4, 'Sahyadri', 'सह्याद्रि', [['squat', 20], ['pushup', 10], ['lunge', 16], ['crunch', 20]]),
  P('girnar', 2, 'full', 5, 'Girnar', 'गिरनार', [['burpee', 8], ['lunge', 16], ['knee_pushup', 12], ['superman', 15]]),
  P('anamudi', 2, 'full', 4, 'Anamudi', 'अनामुडी', [['sprawl', 10], ['squat', 20], ['knee_pushup', 12], ['crunch', 20]]),
  P('vindhya', 2, 'full', 5, 'Vindhya', 'विंध्य', [['jump_squat', 10], ['pushup', 10], ['leg_raise', 10], ['superman', 12]]),
  P('dhauladhar', 2, 'upper', 4, 'Dhauladhar', 'धौलाधार', [['pushup', 12], ['pike_pushup', 8], ['shoulder_taps', 20], ['leg_raise', 12]]),
  P('pirpanjal', 2, 'legs', 4, 'Pir Panjal', 'पीर पंजाल', [['lunge', 16], ['tempo_squat', 10], ['glute_bridge', 20], ['jackknife', 12]]),
  P('nandadevi', 3, 'full', 5, 'Nanda Devi', 'नंदा देवी', [['hindu_squat', 25], ['hindu_pushup', 12], ['burpee', 10], ['leg_raise', 15]]),
  P('trishul', 3, 'upper', 5, 'Trishul', 'त्रिशूल', [['diamond_pushup', 12], ['hindu_pushup', 12], ['pike_pushup', 10], ['v_up', 12]]),
  P('zanskar', 3, 'legs', 5, 'Zanskar', 'ज़ांस्कर', [['jump_squat', 15], ['cossack_squat', 12], ['hindu_squat', 30], ['v_up', 12]]),
  P('kanchenjunga', 3, 'full', 6, 'Kanchenjunga', 'कंचनजंगा', [['burpee', 10], ['pushup', 15], ['jump_squat', 15], ['jackknife', 15], ['lunge', 20]]),
].map((p) => ({ ...p, icon: 'mountain', format: 'fortime', fixed: true, warm: ['march', 'arm_circles', 'torso_twist', 'jumping_jacks'], cool: ['forward_fold', 'cobra', 'child_pose', 'breathing'] }))
export const PMAP = Object.fromEntries(PEAKS.map((p) => [p.id, p]))

// Splits: how much of a Peak you climb.
export const SPLITS = ['base', 'ridge', 'summit']
export function splitRounds(peak, split) {
  const r = peak.rounds
  const base = Math.max(1, Math.round(r / 3))
  if (split === 'base') return base
  if (split === 'ridge') return Math.min(r - 1, Math.max(base + 1, Math.round((2 * r) / 3)))
  return r
}
export const pbKey = (peakId, split = 'summit') => `${peakId}:${split}`

// Tatva drills: five short named pieces, one per element, each training one quality.
// Three levels each. A step is [exercise, amount, rest seconds]; `x` repeats the list.
export const DRILLS = {
  agni: {
    icon: 'flame', name: { en: 'Agni', hi: 'अग्नि' }, means: { en: 'Fire', hi: 'आग' },
    about: { en: 'Explosive power. A ladder that climbs one rep at a time.', hi: 'विस्फोटक ताक़त। हर पायदान पर एक रेप बढ़ती सीढ़ी।' },
    levels: [
      { ladder: ['burpee', 'jump_squat'], top: 4, mult: [1, 2], rest: 20 },
      { ladder: ['burpee', 'jump_squat'], top: 6, mult: [1, 2], rest: 20 },
      { ladder: ['burpee', 'jump_squat'], top: 8, mult: [1, 2], rest: 15 },
    ],
  },
  vayu: {
    icon: 'wind', name: { en: 'Vayu', hi: 'वायु' }, means: { en: 'Wind', hi: 'हवा' },
    about: { en: 'Speed and breath. Fast bursts with short rests.', hi: 'रफ़्तार और साँस। तेज़ झटके, छोटे आराम।' },
    levels: [
      { x: 2, steps: [['high_knees', 25, 20], ['jumping_jacks', 25, 20], ['mountain_climbers', 25, 20]] },
      { x: 2, steps: [['high_knees', 30, 15], ['skipping', 30, 15], ['mountain_climbers', 30, 15], ['jumping_jacks', 30, 15]] },
      { x: 3, steps: [['high_knees', 40, 15], ['skipping', 40, 15], ['mountain_climbers', 40, 15], ['jumping_jacks', 40, 15]] },
    ],
  },
  prithvi: {
    icon: 'mountain', name: { en: 'Prithvi', hi: 'पृथ्वी' }, means: { en: 'Earth', hi: 'धरती' },
    about: { en: 'Leg strength. Slow, controlled reps and long holds.', hi: 'पैरों की ताक़त। धीमे, सधे रेप्स और लंबे होल्ड।' },
    levels: [
      { x: 3, steps: [['tempo_squat', 6, 15], ['wall_sit', 20, 15], ['calf_raise', 15, 30]] },
      { x: 3, steps: [['tempo_squat', 8, 15], ['wall_sit', 35, 15], ['split_squat', 12, 30]] },
      { x: 3, steps: [['tempo_squat', 10, 15], ['wall_sit', 50, 15], ['split_squat', 16, 15], ['calf_raise', 25, 30]] },
    ],
  },
  jal: {
    icon: 'leaf', name: { en: 'Jal', hi: 'जल' }, means: { en: 'Water', hi: 'पानी' },
    about: { en: 'Mobility. Flow from one position to the next without stopping.', hi: 'लचीलापन। बिना रुके एक स्थिति से दूसरी में बहें।' },
    levels: [
      { x: 1, steps: [['cat_cow', 40, 5], ['downdog', 30, 5], ['cobra', 25, 5], ['hamstring_walkout', 4, 5], ['forward_fold', 30, 5], ['side_bend', 30, 5]] },
      { x: 2, steps: [['cat_cow', 40, 5], ['downdog', 30, 5], ['cobra', 25, 5], ['hamstring_walkout', 5, 5], ['forward_fold', 30, 5]] },
      { x: 2, steps: [['cat_cow', 40, 5], ['downdog', 40, 5], ['cobra', 30, 5], ['hamstring_walkout', 6, 5], ['cossack_squat', 10, 5], ['forward_fold', 30, 5]] },
    ],
  },
  akash: {
    icon: 'target', name: { en: 'Akash', hi: 'आकाश' }, means: { en: 'Sky', hi: 'आसमान' },
    about: { en: 'Core control. Hold still, breathe, stay tight.', hi: 'कोर पर क़ाबू। स्थिर रहें, साँस लें, कसे रहें।' },
    levels: [
      { x: 2, steps: [['plank', 20, 20], ['bird_dog', 10, 20], ['superman', 10, 20]] },
      { x: 3, steps: [['plank', 30, 15], ['hollow_hold', 15, 15], ['bird_dog', 12, 15], ['shoulder_taps', 16, 20]] },
      { x: 3, steps: [['plank', 45, 15], ['hollow_hold', 25, 15], ['shoulder_taps', 24, 15], ['superman', 15, 20]] },
    ],
  },
}

// Training phase for a given week (0-based) of a journey.
export function phaseOf(week, weeks) {
  if (week <= 0) return { key: 'calibrate', mult: 0.85 }
  if (week >= weeks - 1) return { key: 'peak', mult: 1.1 }
  if (week === weeks - 2) return { key: 'deload', mult: 0.75 }
  const mid = weeks - 3 // weeks between calibration and deload
  const baseWeeks = Math.ceil(mid * 0.6)
  if (week <= baseWeeks) return { key: 'base', mult: 1 + 0.05 * (week - 1) }
  return { key: 'intensity', mult: 1.2 + 0.05 * (week - baseWeeks - 1) }
}

// Suggested full-session length (minutes) for a level; the athlete can change it.
export const LENGTHS = [30, 45, 60]
export const defaultLength = (level) => ({ beginner: 30, inter: 45, advanced: 60 }[level] || 45)

// Which journey to suggest after onboarding.
export function recommend({ goal, level }) {
  if (level === 'beginner') return goal === 'strong' ? 'strength' : 'express'
  if (goal === 'strong') return 'strength'
  return 'shred'
}

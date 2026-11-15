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
      { name: { en: 'Burn Circuit', hi: 'बर्न सर्किट' }, format: 'intervals', rounds: 4, items: ['burpee', '@legs', 'mountain_climbers', '@core'] },
      { name: { en: 'Engine', hi: 'इंजन' }, format: 'amrap', cap: 12, items: ['jumping_jacks', '@push-1', 'squat', 'high_knees'] },
      { name: { en: 'Legs on Fire', hi: 'पैरों में आग' }, format: 'intervals', rounds: 4, items: ['jump_squat', 'lunge', 'skipping', 'glute_bridge'] },
      { name: { en: 'Full Sweat', hi: 'फ़ुल स्वेट' }, format: 'intervals', rounds: 3, items: ['burpee', '@push', 'shadow_boxing', '@core', 'squat'] },
    ],
  },
  {
    id: 'strength', icon: 'dumbbell', color: '#2979FF', weeks: 8, benchmark: 'nilgiri',
    name: { en: 'Desi Strength', hi: 'देसी ताक़त' },
    tag: { en: 'Build muscle at home with calisthenics', hi: 'घर पर कैलिस्थेनिक्स से मांसपेशियाँ बनाएँ' },
    about: { en: 'Eight weeks of slow, strict strength work: push-up and squat progressions, dand-baithak and core holds. You climb the skill ladders as you get stronger.', hi: 'आठ हफ़्ते की धीमी, सख़्त ताक़त की कसरत: पुश-अप और बैठक की सीढ़ियाँ, दंड-बैठक और कोर होल्ड। ताक़त बढ़ने के साथ आप स्किल की सीढ़ी चढ़ते हैं।' },
    warm: ['march', 'arm_circles', 'torso_twist', 'cat_cow'], cool: ['downdog', 'cobra', 'child_pose', 'breathing'],
    pool: [
      { name: { en: 'Push Day', hi: 'पुश डे' }, format: 'intervals', rounds: 4, items: ['@push', 'pike_pushup', 'shoulder_taps', '@core'] },
      { name: { en: 'Leg Day', hi: 'लेग डे' }, format: 'intervals', rounds: 4, items: ['@legs', 'split_squat', 'tempo_squat', 'calf_raise'] },
      { name: { en: 'Dand–Baithak', hi: 'दंड-बैठक' }, format: 'emom', cap: 12, items: ['hindu_pushup', 'hindu_squat'] },
      { name: { en: 'Core & Back', hi: 'कोर और पीठ' }, format: 'intervals', rounds: 3, items: ['@core', 'superman', 'plank', 'bird_dog', 'hamstring_walkout'] },
    ],
  },
  {
    id: 'express', icon: 'home', color: '#00E676', weeks: 6, benchmark: 'nilgiri', quiet: true,
    name: { en: 'Living Room Express', hi: 'लिविंग रूम एक्सप्रेस' },
    tag: { en: '20 minutes. Low impact. No excuses.', hi: '20 मिनट। कम झटका। कोई बहाना नहीं।' },
    about: { en: 'Six weeks of compact, quiet sessions for beginners and desk workers. No jumping, fixes posture, fits in a small room.', hi: 'शुरुआती और डेस्क पर काम करने वालों के लिए छह हफ़्ते के छोटे, शांत सेशन। कोई कूद नहीं, पोस्चर सुधारे, छोटे कमरे में हो जाए।' },
    warm: ['march', 'arm_circles', 'side_bend'], cool: ['cat_cow', 'child_pose', 'breathing'],
    pool: [
      { name: { en: 'Posture Reset', hi: 'पोस्चर रीसेट' }, format: 'intervals', rounds: 3, items: ['@legs', '@push', 'bird_dog', 'glute_bridge'] },
      { name: { en: 'Quick Burn', hi: 'क्विक बर्न' }, format: 'amrap', cap: 8, items: ['step_jacks', 'squat', '@push-1', 'knee_drive'] },
      { name: { en: 'Desk Detox', hi: 'डेस्क डिटॉक्स' }, format: 'intervals', rounds: 3, items: ['superman', 'knee_drive', '@core', 'wall_sit'] },
    ],
  },
]
export const JMAP = Object.fromEntries(JOURNEYS.map((j) => [j.id, j]))

// Peaks: fixed workouts done against the clock. The work never changes,
// so a faster time is real progress. Items are [exercise, reps].
export const PEAKS = [
  { id: 'nilgiri', lvl: 1, rounds: 3, name: { en: 'Nilgiri', hi: 'नीलगिरि' }, items: [['squat', 15], ['knee_pushup', 8], ['knee_drive', 20], ['glute_bridge', 15]] },
  { id: 'aravalli', lvl: 1, rounds: 4, name: { en: 'Aravalli', hi: 'अरावली' }, items: [['chair_sit_stand', 12], ['incline_pushup', 10], ['calf_raise', 20], ['knee_drive', 20]] },
  { id: 'satpura', lvl: 1, rounds: 3, name: { en: 'Satpura', hi: 'सतपुड़ा' }, items: [['sprawl', 8], ['squat', 15], ['crunch', 15], ['glute_bridge', 15]] },
  { id: 'sahyadri', lvl: 2, rounds: 4, name: { en: 'Sahyadri', hi: 'सह्याद्रि' }, items: [['squat', 20], ['pushup', 10], ['lunge', 16], ['crunch', 20]] },
  { id: 'girnar', lvl: 2, rounds: 5, name: { en: 'Girnar', hi: 'गिरनार' }, items: [['burpee', 8], ['lunge', 16], ['knee_pushup', 12], ['superman', 15]] },
  { id: 'vindhya', lvl: 2, rounds: 5, name: { en: 'Vindhya', hi: 'विंध्य' }, items: [['jump_squat', 10], ['pushup', 10], ['leg_raise', 10], ['superman', 12]] },
  { id: 'nandadevi', lvl: 3, rounds: 5, name: { en: 'Nanda Devi', hi: 'नंदा देवी' }, items: [['hindu_squat', 25], ['hindu_pushup', 12], ['burpee', 10], ['leg_raise', 15]] },
  { id: 'kanchenjunga', lvl: 3, rounds: 6, name: { en: 'Kanchenjunga', hi: 'कंचनजंगा' }, items: [['burpee', 10], ['pushup', 15], ['jump_squat', 15], ['jackknife', 15], ['lunge', 20]] },
].map((p) => ({ ...p, icon: 'mountain', format: 'fortime', fixed: true, warm: ['march', 'arm_circles', 'jumping_jacks'], cool: ['forward_fold', 'child_pose'] }))
export const PMAP = Object.fromEntries(PEAKS.map((p) => [p.id, p]))

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

// Which journey to suggest after onboarding.
export function recommend({ goal, level }) {
  if (level === 'beginner') return goal === 'strong' ? 'strength' : 'express'
  if (goal === 'strong') return 'strength'
  return 'shred'
}

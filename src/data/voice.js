import { EXERCISES } from './exercises.js'

// Everything the coach says out loud. One recorded clip per line, per language.
// The order here IS the recording order (see VOICE-SCRIPT.md and scripts/split-voice.mjs),
// so only ever add new lines at the end.
export const CUES = [
  { id: 'get_ready', en: 'Get ready. First up:', hi: 'तैयार हो जाइए। सबसे पहले:' },
  { id: 'rest_next', en: 'Rest. Coming up next:', hi: 'आराम कीजिए। इसके बाद:' },
  { id: 'halfway', en: 'Halfway there. Keep going.', hi: 'आधा हो गया। लगे रहिए।' },
  { id: 'switch_sides', en: 'Switch sides.', hi: 'अब दूसरी तरफ़।' },
  { id: 'last_one', en: 'Last one. Finish strong!', hi: 'यह आख़िरी है। पूरा दम लगाइए!' },
  { id: 'done', en: 'Shabash! Workout complete.', hi: 'शाबाश! कसरत पूरी हुई।' },
  { id: 'round_a', en: 'New round. Same pace, good form.', hi: 'नया राउंड। वही रफ़्तार, सही तरीक़ा।' },
  { id: 'round_b', en: 'Next round. You are doing great.', hi: 'अगला राउंड। आप बढ़िया कर रहे हैं।' },
  { id: 'round_final', en: 'Final round. Give it everything.', hi: 'आख़िरी राउंड। पूरी ताक़त लगा दीजिए।' },
]

export const VOICE_LINES = [
  ...CUES,
  ...EXERCISES.map((e) => ({ id: 'ex_' + e.id, en: e.name.en, hi: e.name.hi })),
]

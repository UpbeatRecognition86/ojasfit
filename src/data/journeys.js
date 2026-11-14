// Journeys: multi-week guided programs. Each cycles through its session templates,
// and the generator (lib/plan.js) scales volume by week, level, age and feedback.
const WARM = ['march', 'arm_circles', 'torso_twist']
const COOL = ['forward_fold', 'child_pose', 'breathing']

export const JOURNEYS = [
  {
    id: 'shuruaat', icon: 'sprout', color: '#2F9E44', premium: false, weeks: 4, perWeek: 3, level: 1, rounds: 2, rest: 20,
    name: { en: 'Shuruaat — First Steps', hi: 'शुरुआत — पहला क़दम' },
    tag: { en: 'Never exercised? Start here.', hi: 'कभी कसरत नहीं की? यहीं से शुरू करें।' },
    about: { en: 'A gentle 4-week start. Short sessions build the habit and teach the basic moves — squat, push, bridge and plank.', hi: '4 हफ़्तों की आसान शुरुआत। छोटे सेशन आदत बनाते हैं और बुनियादी कसरतें सिखाते हैं — बैठक, पुश-अप, ब्रिज और प्लैंक।' },
    warm: WARM, cool: COOL,
    sessions: [
      { name: { en: 'Full Body A', hi: 'पूरा शरीर A' }, items: ['squat', 'wall_pushup', 'glute_bridge', 'knee_to_elbow', 'plank'] },
      { name: { en: 'Full Body B', hi: 'पूरा शरीर B' }, items: ['chair_sit_stand', 'knee_pushup', 'bird_dog', 'step_jacks', 'calf_raise'] },
      { name: { en: 'Full Body C', hi: 'पूरा शरीर C' }, items: ['lunge', 'wall_pushup', 'superman', 'march', 'crunch'] },
    ],
  },
  {
    id: 'walkfit', icon: 'footprints', color: '#1971C2', premium: false, weeks: 6, perWeek: 4, level: 1, rounds: 1, rest: 15, ramp: 0.3,
    name: { en: 'Walk to Fit', hi: 'चलो, फ़िट हो जाएँ' },
    tag: { en: 'Walking plan that grows week by week.', hi: 'हर हफ़्ते बढ़ने वाला पैदल चलने का प्लान।' },
    about: { en: 'Brisk walking is the easiest way to get moving. Walks get longer each week, with simple leg strength in between.', hi: 'तेज़ चलना फ़िट होने का सबसे आसान तरीक़ा है। हर हफ़्ते सैर लंबी होती है, बीच में पैरों की आसान कसरत।' },
    warm: ['march', 'ankle_circles'], cool: ['tadasana', 'breathing'],
    sessions: [
      { name: { en: 'Walk + Legs', hi: 'सैर + पैर' }, items: ['brisk_walk', 'chair_sit_stand', 'brisk_walk', 'calf_raise'] },
      { name: { en: 'Steady Walk', hi: 'लगातार सैर' }, items: ['brisk_walk', 'side_leg_raise', 'brisk_walk'] },
      { name: { en: 'Walk + Balance', hi: 'सैर + संतुलन' }, items: ['brisk_walk', 'single_leg_stand', 'brisk_walk', 'knee_to_elbow'] },
    ],
  },
  {
    id: 'surya', icon: 'sun', color: '#F08C00', premium: false, weeks: 4, perWeek: 4, level: 1, rounds: 2, rest: 15, ramp: 0.3,
    name: { en: 'Surya Shakti', hi: 'सूर्य शक्ति' },
    tag: { en: 'Build up to 12 Surya Namaskars.', hi: '12 सूर्य नमस्कार तक पहुँचें।' },
    about: { en: 'A yoga journey built around Surya Namaskar, with balance poses and calm breathing. Great for mornings.', hi: 'सूर्य नमस्कार पर आधारित योग यात्रा — साथ में संतुलन के आसन और शांत साँस। सुबह के लिए बढ़िया।' },
    warm: ['arm_circles', 'side_bend', 'tadasana'], cool: ['child_pose', 'butterfly', 'breathing', 'shavasana'],
    sessions: [
      { name: { en: 'Sun Flow', hi: 'सूर्य प्रवाह' }, items: ['surya_namaskar', 'vrikshasana', 'cobra'] },
      { name: { en: 'Strength Flow', hi: 'शक्ति प्रवाह' }, items: ['surya_namaskar', 'downdog', 'plank'] },
    ],
  },
  {
    id: 'fatloss', icon: 'flame', color: '#E03131', premium: true, weeks: 8, perWeek: 4, level: 2, rounds: 3, rest: 20,
    name: { en: 'Fat se Fit', hi: 'फ़ैट से फ़िट' },
    tag: { en: '8 weeks of calorie-burning circuits.', hi: '8 हफ़्ते के कैलोरी जलाने वाले सर्किट।' },
    about: { en: 'Cardio and strength circuits that keep your heart rate up. Four sessions a week, each around 20–30 minutes.', hi: 'कार्डियो और ताक़त के सर्किट जो दिल की धड़कन तेज़ रखते हैं। हफ़्ते में चार सेशन, हर एक लगभग 20–30 मिनट।' },
    warm: WARM, cool: COOL,
    sessions: [
      { name: { en: 'Cardio Burn', hi: 'कार्डियो बर्न' }, items: ['jumping_jacks', 'squat', 'high_knees', 'mountain_climbers', 'shadow_boxing'] },
      { name: { en: 'Strength Circuit', hi: 'ताक़त सर्किट' }, items: ['squat', 'pushup', 'lunge', 'glute_bridge', 'plank'] },
      { name: { en: 'Dance & Sweat', hi: 'नाचो और पसीना बहाओ' }, items: ['bhangra', 'step_jacks', 'skipping', 'knee_to_elbow', 'squat_thrust'] },
    ],
  },
  {
    id: 'desi', icon: 'dumbbell', color: '#9C36B5', premium: true, weeks: 8, perWeek: 4, level: 2, rounds: 3, rest: 30,
    name: { en: 'Desi Taqat', hi: 'देसी ताक़त' },
    tag: { en: 'Akhada-style strength: dand and baithak.', hi: 'अखाड़े वाली ताक़त: दंड और बैठक।' },
    about: { en: 'Old-school pehlwan training with modern progression. Dand, baithak and core work make you strong without a gym.', hi: 'पुराने पहलवानों की कसरत, नए तरीक़े से। दंड, बैठक और पेट की कसरत — बिना जिम के ताक़त।' },
    warm: WARM, cool: ['cobra', 'child_pose', 'breathing'],
    sessions: [
      { name: { en: 'Dand–Baithak', hi: 'दंड-बैठक' }, items: ['pushup', 'squat', 'plank', 'superman'] },
      { name: { en: 'Akhada Day', hi: 'अखाड़ा दिन' }, items: ['hindu_squat', 'hindu_pushup', 'lunge', 'leg_raise'] },
      { name: { en: 'Power Day', hi: 'पावर दिन' }, items: ['jump_squat', 'pushup', 'wall_sit', 'mountain_climbers', 'crunch'] },
    ],
  },
  {
    id: 'active40', icon: 'feather', color: '#0C8599', premium: true, weeks: 8, perWeek: 3, level: 1, rounds: 2, rest: 25,
    name: { en: 'Easy on Joints', hi: 'जोड़ों पर आसान' },
    tag: { en: 'Low-impact strength. No jumping.', hi: 'कम झटके वाली ताक़त। कोई कूद नहीं।' },
    about: { en: 'Low-impact strength, balance and mobility. Easy on the knees and back, serious about results.', hi: 'कम झटके वाली ताक़त, संतुलन और लचीलापन। घुटनों और पीठ पर आसान, नतीजों में दमदार।' },
    warm: ['march', 'arm_circles', 'side_bend'], cool: ['cat_cow', 'child_pose', 'breathing'],
    sessions: [
      { name: { en: 'Strong Base', hi: 'मज़बूत नींव' }, items: ['chair_sit_stand', 'wall_pushup', 'glute_bridge', 'bird_dog', 'knee_to_elbow'] },
      { name: { en: 'Move & Tone', hi: 'चलो और कसो' }, items: ['step_jacks', 'squat', 'knee_pushup', 'side_leg_raise', 'plank'] },
      { name: { en: 'Steady & Stable', hi: 'स्थिर और संतुलित' }, items: ['march', 'calf_raise', 'superman', 'wall_sit', 'vrikshasana'] },
    ],
  },
  {
    id: 'golden', icon: 'armchair', color: '#C2255C', premium: true, weeks: 6, perWeek: 3, level: 1, rounds: 2, rest: 30,
    name: { en: 'Chair Fit', hi: 'कुर्सी फ़िट' },
    tag: { en: 'Seated and supported. The gentlest start.', hi: 'बैठकर और सहारे से। सबसे आसान शुरुआत।' },
    about: { en: 'Safe, seated and supported exercises that keep legs strong and balance steady. Ideal after a long break, or for elders at home.', hi: 'सुरक्षित, बैठकर और सहारे से होने वाली कसरतें जो पैर मज़बूत और संतुलन पक्का रखती हैं। लंबे अंतराल के बाद या घर के बुज़ुर्गों के लिए बढ़िया।' },
    warm: ['seated_march', 'ankle_circles'], cool: ['tadasana', 'breathing'],
    sessions: [
      { name: { en: 'Chair Strength', hi: 'कुर्सी ताक़त' }, items: ['seated_march', 'seated_arm_raise', 'chair_sit_stand', 'seated_leg_ext', 'calf_raise'] },
      { name: { en: 'Steady Feet', hi: 'मज़बूत क़दम' }, items: ['march', 'wall_pushup', 'side_leg_raise', 'single_leg_stand', 'seated_leg_ext'] },
    ],
  },
  {
    id: 'shakti', icon: 'flower', color: '#D6336C', premium: true, weeks: 8, perWeek: 4, level: 1, rounds: 3, rest: 20,
    name: { en: 'Shakti — Strength for Women', hi: 'शक्ति — महिलाओं के लिए ताक़त' },
    tag: { en: 'Tone and strengthen at home in 20 minutes.', hi: 'घर पर 20 मिनट में ताक़त और कसाव।' },
    about: { en: 'Lower body, core and upper-body strength you can do in a small room — in a salwar or a saree, no equipment.', hi: 'पैर, पेट और ऊपरी शरीर की ताक़त जो छोटे कमरे में हो जाए — सलवार हो या साड़ी, कोई सामान नहीं चाहिए।' },
    warm: WARM, cool: ['cat_cow', 'child_pose', 'breathing'],
    sessions: [
      { name: { en: 'Legs & Hips', hi: 'पैर और कूल्हे' }, items: ['squat', 'glute_bridge', 'side_leg_raise', 'lunge', 'calf_raise'] },
      { name: { en: 'Arms & Core', hi: 'बाज़ू और पेट' }, items: ['knee_pushup', 'superman', 'bird_dog', 'plank', 'knee_to_elbow'] },
      { name: { en: 'Cardio Tone', hi: 'कार्डियो टोन' }, items: ['bhangra', 'step_jacks', 'squat', 'crunch', 'wall_sit'] },
    ],
  },
  {
    id: 'desk', icon: 'laptop', color: '#5F3DC4', premium: true, weeks: 4, perWeek: 5, level: 1, rounds: 2, rest: 10,
    name: { en: 'Desk Detox', hi: 'डेस्क डिटॉक्स' },
    tag: { en: 'Short daily fixes for a stiff back.', hi: 'अकड़ी पीठ के लिए रोज़ की छोटी कसरत।' },
    about: { en: 'For people who sit all day. Short daily sessions open the chest, wake up the hips and strengthen posture muscles.', hi: 'दिनभर बैठने वालों के लिए। रोज़ के छोटे सेशन सीना खोलते हैं, कूल्हे जगाते हैं और पोस्चर मज़बूत करते हैं।' },
    warm: ['arm_circles', 'side_bend'], cool: ['tadasana', 'breathing'],
    sessions: [
      { name: { en: 'Back Reset', hi: 'पीठ रीसेट' }, items: ['cat_cow', 'cobra', 'bird_dog', 'chair_sit_stand'] },
      { name: { en: 'Posture Fix', hi: 'पोस्चर सुधार' }, items: ['wall_pushup', 'superman', 'torso_twist', 'glute_bridge'] },
    ],
  },
  {
    id: 'shaadi', icon: 'party', color: '#E8590C', premium: true, weeks: 6, perWeek: 5, level: 2, rounds: 3, rest: 20,
    name: { en: 'Shaadi Ready', hi: 'शादी रेडी' },
    tag: { en: '6 weeks to look and feel your best.', hi: '6 हफ़्तों में सबसे अच्छे दिखें और महसूस करें।' },
    about: { en: 'A wedding on the calendar? This high-energy 6-week plan mixes dance cardio, strength and core, five days a week.', hi: 'शादी आने वाली है? यह जोशीला 6 हफ़्ते का प्लान डांस कार्डियो, ताक़त और पेट की कसरत मिलाता है — हफ़्ते में पाँच दिन।' },
    warm: WARM, cool: COOL,
    sessions: [
      { name: { en: 'Sangeet Cardio', hi: 'संगीत कार्डियो' }, items: ['bhangra', 'squat', 'pushup', 'mountain_climbers', 'plank'] },
      { name: { en: 'Sculpt', hi: 'कसाव' }, items: ['jumping_jacks', 'lunge', 'glute_bridge', 'shadow_boxing', 'crunch'] },
      { name: { en: 'Full Power', hi: 'फ़ुल पावर' }, items: ['skipping', 'jump_squat', 'superman', 'high_knees', 'leg_raise'] },
    ],
  },
]

export const JMAP = Object.fromEntries(JOURNEYS.map((j) => [j.id, j]))

// One-off workouts for the Explore tab.
export const QUICK = [
  { id: 'morning5', icon: 'sunrise', premium: false, rounds: 1, rest: 10, name: { en: 'Morning Energiser', hi: 'सुबह की ताज़गी' }, warm: [], cool: [], items: ['tadasana', 'arm_circles', 'march', 'squat', 'step_jacks', 'side_bend', 'breathing'] },
  { id: 'fullbody7', icon: 'home', premium: false, rounds: 2, rest: 15, name: { en: 'Quick Full Body', hi: 'झटपट पूरा शरीर' }, warm: ['march'], cool: [], items: ['squat', 'knee_pushup', 'knee_to_elbow', 'glute_bridge', 'plank'] },
  { id: 'chairbreak', icon: 'armchair', premium: false, rounds: 1, rest: 10, name: { en: 'Office Chair Break', hi: 'ऑफ़िस कुर्सी ब्रेक' }, warm: [], cool: [], items: ['seated_march', 'seated_arm_raise', 'ankle_circles', 'chair_sit_stand', 'side_bend', 'tadasana'] },
  { id: 'bhangra6', icon: 'music', premium: false, rounds: 2, rest: 15, name: { en: 'Bhangra Burn', hi: 'भांगड़ा बर्न' }, warm: ['march'], cool: [], items: ['bhangra', 'squat', 'shadow_boxing', 'step_jacks'] },
  { id: 'surya10', icon: 'sun', premium: true, rounds: 2, rest: 15, name: { en: 'Surya Flow', hi: 'सूर्य प्रवाह' }, warm: ['tadasana'], cool: ['shavasana'], items: ['surya_namaskar', 'vrikshasana'] },
  { id: 'kneefriendly', icon: 'footprints', premium: true, rounds: 2, rest: 20, name: { en: 'Knee-Friendly Cardio', hi: 'घुटनों पर आसान कार्डियो' }, warm: ['march'], cool: ['breathing'], items: ['step_jacks', 'shadow_boxing', 'knee_to_elbow', 'calf_raise', 'march'] },
  { id: 'core8', icon: 'target', premium: true, rounds: 2, rest: 15, name: { en: 'Core Blast', hi: 'पेट की कसरत' }, warm: [], cool: ['cobra'], items: ['plank', 'crunch', 'leg_raise', 'bird_dog', 'mountain_climbers'] },
  { id: 'sleep', icon: 'moon', premium: true, rounds: 1, rest: 5, name: { en: 'Sleep Wind-Down', hi: 'नींद से पहले आराम' }, warm: [], cool: [], items: ['cat_cow', 'child_pose', 'butterfly', 'breathing', 'shavasana'] },
]
export const QMAP = Object.fromEntries(QUICK.map((q) => [q.id, q]))

// Peaks: fixed workouts done against the clock. The work never changes,
// so a faster time is real progress. Items are [exercise, reps].
export const PEAKS = [
  { id: 'nilgiri', lvl: 1, premium: false, rounds: 3, name: { en: 'Nilgiri', hi: 'नीलगिरि' }, items: [['squat', 15], ['knee_pushup', 8], ['knee_to_elbow', 20], ['glute_bridge', 15]] },
  { id: 'aravalli', lvl: 1, premium: false, rounds: 4, name: { en: 'Aravalli', hi: 'अरावली' }, items: [['chair_sit_stand', 12], ['wall_pushup', 12], ['calf_raise', 20], ['knee_to_elbow', 20]] },
  { id: 'sahyadri', lvl: 2, premium: true, rounds: 4, name: { en: 'Sahyadri', hi: 'सह्याद्रि' }, items: [['squat', 20], ['pushup', 10], ['lunge', 16], ['crunch', 20]] },
  { id: 'vindhya', lvl: 2, premium: true, rounds: 5, name: { en: 'Vindhya', hi: 'विंध्य' }, items: [['jump_squat', 10], ['pushup', 10], ['leg_raise', 10], ['superman', 12]] },
  { id: 'nandadevi', lvl: 3, premium: true, rounds: 5, name: { en: 'Nanda Devi', hi: 'नंदा देवी' }, items: [['hindu_squat', 25], ['hindu_pushup', 12], ['squat_thrust', 10], ['leg_raise', 15]] },
  { id: 'kanchenjunga', lvl: 3, premium: true, rounds: 6, name: { en: 'Kanchenjunga', hi: 'कंचनजंगा' }, items: [['squat_thrust', 10], ['pushup', 15], ['jump_squat', 15], ['crunch', 25], ['lunge', 20]] },
  { id: 'satpura', lvl: 1, premium: false, rounds: 3, name: { en: 'Satpura', hi: 'सतपुड़ा' }, items: [['step_jacks', 20], ['wall_pushup', 12], ['glute_bridge', 15], ['calf_raise', 20]] },
  { id: 'girnar', lvl: 2, premium: true, rounds: 5, name: { en: 'Girnar', hi: 'गिरनार' }, items: [['lunge', 20], ['knee_pushup', 12], ['mountain_climbers', 20], ['superman', 15]] },
].map((p) => ({ ...p, icon: 'mountain', fixed: true, rest: 0, warm: [], cool: [] }))
export const PMAP = Object.fromEntries(PEAKS.map((p) => [p.id, p]))

// Which journey to suggest after onboarding.
export function recommend({ goal, level, limits = [] }) {
  if (limits.includes('floor')) return 'golden'
  if (goal === 'flex') return 'surya'
  const gentle = limits.includes('knee') || limits.includes('impact')
  if (goal === 'lose') return level === 'beginner' ? 'walkfit' : gentle ? 'active40' : 'fatloss'
  if (level === 'beginner') return 'shuruaat'
  if (goal === 'strong') return gentle ? 'active40' : 'desi'
  return gentle ? 'active40' : 'shuruaat'
}

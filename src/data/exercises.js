// Exercise library. Bodyweight only; at most a chair or a wall.
// type: 'reps' | 'time' (seconds). base = amount for an average trained adult.
// stress: body parts the move loads (used for "sore" exclusions and standing limitations)
// jump: noisy/impact move, replaced by `quiet` in Quiet Mode
// wide: needs more room than a mat, replaced by `tight` in Small Space mode
// sub: fallback when the move is excluded
const AREA_MET = { cardio: 7, legs: 5, push: 5, back: 4, core: 4, mobility: 2.5 }
const SIDES = ['side_bend', 'lunge', 'cossack_squat', 'pistol_squat', 'split_squat']

const list = []
function ex(id, pose, en, hi, cueEn, cueHi, type, base, area, o = {}) {
  list.push({
    id, pose, name: { en, hi }, cue: { en: cueEn, hi: cueHi }, type, base, area,
    spr: o.spr || 3, met: o.met || AREA_MET[area], stress: o.stress || [], jump: !!o.jump, wide: !!o.wide,
    quiet: o.quiet || null, tight: o.tight || null, sub: o.sub || null, equip: o.equip || null, sides: SIDES.includes(id),
  })
}
const ARMS = ['wrists', 'shoulders']

// ---------- Warm-up & cardio ----------
ex('march', 'march', 'Spot Marching', 'जगह पर मार्च', 'March on the spot. Lift your knees and swing your arms.', 'एक ही जगह मार्च करें। घुटने उठाएँ और हाथ हिलाएँ।', 'time', 40, 'cardio', { met: 4 })
ex('arm_circles', 'jack', 'Arm Circles', 'हाथ घुमाना', 'Big slow circles with both arms, forward then backward.', 'दोनों हाथों से बड़े, धीमे गोले बनाएँ — पहले आगे, फिर पीछे।', 'time', 30, 'mobility')
ex('side_bend', 'sidebend', 'Side Bends', 'बगल में झुकना', 'Reach one arm overhead and bend to the side. Switch sides.', 'एक हाथ ऊपर उठाकर बगल में झुकें। फिर दूसरी तरफ़।', 'time', 30, 'mobility')
ex('torso_twist', 'twist', 'Standing Twists', 'कमर घुमाना', 'Feet apart, rotate your upper body left and right.', 'पैर खोलकर ऊपरी शरीर को दाएँ-बाएँ घुमाएँ।', 'time', 30, 'mobility', { stress: ['back'], sub: 'side_bend' })
ex('cat_cow', 'catcow', 'Cat–Cow', 'मार्जरी आसन', 'On hands and knees, round your back up, then let it dip.', 'हाथ और घुटनों पर आकर पीठ ऊपर गोल करें, फिर नीचे झुकाएँ।', 'time', 40, 'mobility', { stress: ['wrists'], sub: 'side_bend' })
ex('jumping_jacks', 'jack', 'Jumping Jacks', 'जंपिंग जैक', 'Jump feet apart as arms go overhead, then back together.', 'कूदकर पैर खोलें और हाथ ऊपर ले जाएँ, फिर वापस साथ लाएँ।', 'time', 30, 'cardio', { jump: true, wide: true, quiet: 'step_jacks', tight: 'high_knees', stress: ['knees'], sub: 'step_jacks' })
ex('step_jacks', 'jack', 'Step Jacks', 'स्टेप जैक', 'Step one foot out as arms rise, step back in. No jumping.', 'बिना कूदे एक पैर बाहर रखें और हाथ ऊपर उठाएँ, फिर वापस लाएँ।', 'time', 30, 'cardio', { met: 5, wide: true, tight: 'knee_drive' })
ex('high_knees', 'march', 'High Knees', 'हाई नीज़', 'Run on the spot, driving knees up to hip height.', 'एक जगह दौड़ें और घुटनों को कमर तक उठाएँ।', 'time', 30, 'cardio', { jump: true, quiet: 'knee_drive', stress: ['knees'], sub: 'knee_drive' })
ex('knee_drive', 'march', 'Marching Knee Drives', 'घुटना-कोहनी मार्च', 'Hands by your ears. Drive a knee up to meet the opposite elbow.', 'हाथ कानों के पास। घुटना उठाकर उल्टी कोहनी से मिलाएँ।', 'reps', 20, 'cardio', { spr: 1.5, met: 5 })
ex('skipping', 'skip', 'Invisible Rope', 'बिना रस्सी की रस्सी कूद', 'Small quick hops as if skipping a rope. Stay on your toes.', 'ऐसे हल्के-हल्के कूदें जैसे रस्सी कूद रहे हों। पंजों पर रहें।', 'time', 30, 'cardio', { jump: true, quiet: 'step_jacks', stress: ['knees'], sub: 'step_jacks' })
ex('mountain_climbers', 'climber', 'Mountain Climbers', 'माउंटेन क्लाइंबर', 'In a push-up position, drive knees to chest one after the other.', 'पुश-अप की स्थिति में घुटनों को बारी-बारी से सीने की ओर लाएँ।', 'time', 30, 'cardio', { stress: ARMS, sub: 'knee_drive' })
ex('burpee', 'thrust', 'Burpees', 'बर्पी', 'Squat, kick back to a plank, chest to floor, jump your feet in and jump up.', 'बैठें, पैर पीछे फेंककर प्लैंक बनाएँ, सीना ज़मीन तक, पैर आगे लाकर ऊपर कूदें।', 'reps', 8, 'cardio', { spr: 4, met: 8, jump: true, quiet: 'sprawl', stress: ['wrists', 'shoulders', 'knees', 'back'], sub: 'knee_drive' })
ex('sprawl', 'thrust', 'Sprawls (No Jump)', 'स्प्रॉल (बिना कूद)', 'Squat, step back to a plank, step in and stand. No jumping.', 'बैठें, क़दम पीछे रखकर प्लैंक बनाएँ, क़दम आगे लाकर खड़े हों। कोई कूद नहीं।', 'reps', 8, 'cardio', { spr: 4.5, met: 6.5, stress: ['wrists', 'shoulders', 'back'], sub: 'knee_drive' })
ex('shadow_boxing', 'box', 'Shadow Boxing', 'शैडो बॉक्सिंग', 'Knees soft, fists up. Throw fast punches at the air.', 'घुटने हल्के मोड़ें, मुट्ठियाँ ऊपर। हवा में तेज़ मुक्के मारें।', 'time', 40, 'cardio', { met: 6, stress: ['shoulders'], sub: 'knee_drive' })

// ---------- Legs ----------
ex('chair_sit_stand', 'chair', 'Assisted Squat (Chair)', 'कुर्सी स्क्वैट', 'Sit back onto a chair and stand up without using your hands.', 'कुर्सी पर बैठें और हाथों के सहारे के बिना खड़े हों।', 'reps', 12, 'legs', { equip: 'chair' })
ex('squat', 'squat', 'Baithak (Air Squat)', 'बैठक (स्क्वैट)', 'Feet shoulder-width. Sit back and down, chest up, then stand tall.', 'पैर कंधों जितने खोलें। पीछे और नीचे बैठें, सीना ऊपर, फिर सीधे खड़े हों।', 'reps', 15, 'legs', { spr: 2.5, stress: ['knees'], sub: 'glute_bridge' })
ex('lunge', 'lunge', 'Lunges', 'लंजेस', 'Step forward and lower both knees to 90 degrees. Push back. Alternate legs.', 'एक क़दम आगे रखें और दोनों घुटने मोड़कर नीचे जाएँ। वापस आएँ। पैर बदलते रहें।', 'reps', 12, 'legs', { wide: true, tight: 'tempo_squat', stress: ['knees'], sub: 'glute_bridge' })
ex('jump_squat', 'squat', 'Jump Squats', 'जंप स्क्वैट', 'Squat down, explode up. Land softly and go straight into the next one.', 'नीचे बैठें और ज़ोर से ऊपर कूदें। धीरे से उतरें और तुरंत अगला करें।', 'reps', 10, 'legs', { spr: 2.5, met: 7, jump: true, quiet: 'tempo_squat', stress: ['knees'], sub: 'glute_bridge' })
ex('cossack_squat', 'cossack', 'Cossack Squats', 'कोसैक स्क्वैट', 'Wide stance. Sink onto one leg, keeping the other straight. Alternate.', 'पैर चौड़े रखें। एक पैर पर नीचे बैठें, दूसरा सीधा रखें। बारी-बारी से।', 'reps', 10, 'legs', { spr: 3.5, wide: true, tight: 'squat', stress: ['knees'], sub: 'glute_bridge' })
ex('pistol_squat', 'pistol', 'Pistol Squats', 'पिस्टल स्क्वैट', 'Squat on one leg with the other held straight out in front. Switch halfway.', 'एक पैर पर बैठें, दूसरा पैर सामने सीधा रखें। आधे में पैर बदलें।', 'reps', 6, 'legs', { spr: 4, stress: ['knees'], sub: 'glute_bridge' })
ex('tempo_squat', 'squat', 'Tempo Squats', 'टेम्पो स्क्वैट', 'Take 3 seconds to go down, pause 1 second at the bottom, stand up.', '3 सेकंड में नीचे जाएँ, 1 सेकंड रुकें, फिर खड़े हों।', 'reps', 8, 'legs', { spr: 5, stress: ['knees'], sub: 'glute_bridge' })
ex('hindu_squat', 'squat', 'Desi Baithak', 'देसी बैठक', 'Akhada style: swing arms back, squat deep onto your toes, swing up.', 'अखाड़े का तरीक़ा: हाथ पीछे ले जाएँ, पंजों पर गहरा बैठें, झूलते हुए उठें।', 'reps', 15, 'legs', { spr: 2, stress: ['knees'], sub: 'glute_bridge' })
ex('split_squat', 'lunge', 'Split Squats', 'स्प्लिट स्क्वैट', 'One foot forward, one back. Drop the back knee straight down. Switch halfway.', 'एक पैर आगे, एक पीछे। पिछला घुटना सीधा नीचे लाएँ। आधे में पैर बदलें।', 'reps', 12, 'legs', { stress: ['knees'], sub: 'glute_bridge' })
ex('glute_bridge', 'bridge', 'Glute Bridge', 'ग्लूट ब्रिज', 'On your back, knees bent. Drive hips up, squeeze, lower slowly.', 'पीठ के बल लेटें, घुटने मोड़ें। कूल्हे ऊपर उठाएँ, कसें, धीरे से नीचे लाएँ।', 'reps', 15, 'legs', { spr: 2.5 })
ex('wall_sit', 'wallsit', 'Wall Sit', 'वॉल सिट', 'Back against a wall, thighs level with the floor. Hold.', 'पीठ दीवार से लगाएँ, जाँघें ज़मीन के बराबर। रुके रहें।', 'time', 30, 'legs', { stress: ['knees'], sub: 'glute_bridge', equip: 'wall' })
ex('calf_raise', 'calf', 'Calf Raises', 'काफ़ रेज़', 'Rise onto your toes, pause, lower slowly.', 'पंजों पर उठें, रुकें, धीरे से नीचे आएँ।', 'reps', 20, 'legs', { spr: 1.5 })
ex('hamstring_walkout', 'walkout', 'Walkouts', 'वॉकआउट', 'Fold forward, walk your hands out to a plank, walk back and stand.', 'आगे झुकें, हाथों से चलकर प्लैंक तक जाएँ, वापस आकर खड़े हों।', 'reps', 6, 'legs', { spr: 6, stress: ['wrists', 'shoulders', 'back'], sub: 'glute_bridge' })

// ---------- Push ----------
ex('wall_pushup', 'wallpush', 'Wall Push-ups', 'दीवार पुश-अप', 'Hands on a wall, body straight. Bring your chest in, push away.', 'हाथ दीवार पर, शरीर सीधा। सीना पास लाएँ, फिर धक्का दें।', 'reps', 12, 'push', { stress: ['shoulders'], sub: 'knee_drive', equip: 'wall' })
ex('incline_pushup', 'incline', 'Incline Push-ups', 'इन्क्लाइन पुश-अप', 'Hands on a sturdy chair or bed, body straight. Chest to the edge, push up.', 'हाथ मज़बूत कुर्सी या पलंग पर, शरीर सीधा। सीना किनारे तक, फिर ऊपर।', 'reps', 10, 'push', { stress: ARMS, sub: 'plank', equip: 'chair' })
ex('knee_pushup', 'pushup', 'Knee Push-ups', 'घुटनों वाले पुश-अप', 'Knees down, straight line from knees to head. Chest to floor, push up.', 'घुटने ज़मीन पर, घुटनों से सिर तक सीधी रेखा। सीना नीचे, फिर ऊपर।', 'reps', 10, 'push', { stress: ARMS, sub: 'plank' })
ex('pushup', 'pushup', 'Dand (Push-up)', 'दंड (पुश-अप)', 'Hands under shoulders, body like a plank. Chest to floor, push up.', 'हाथ कंधों के नीचे, शरीर तख़्ते जैसा। सीना ज़मीन तक, फिर ऊपर।', 'reps', 10, 'push', { stress: ARMS, sub: 'plank' })
ex('diamond_pushup', 'pushup', 'Diamond Push-ups', 'डायमंड पुश-अप', 'Hands together under your chest, thumbs and fingers touching. Elbows close.', 'दोनों हाथ सीने के नीचे साथ रखें, अंगूठे-उँगलियाँ मिली हुई। कोहनियाँ पास।', 'reps', 8, 'push', { stress: ARMS, sub: 'plank' })
ex('decline_pushup', 'decline', 'Decline Push-ups', 'डिक्लाइन पुश-अप', 'Feet up on a chair, hands on the floor. Chest down, push up.', 'पैर कुर्सी पर, हाथ ज़मीन पर। सीना नीचे, फिर ऊपर।', 'reps', 8, 'push', { stress: ARMS, sub: 'plank', equip: 'chair' })
ex('pike_pushup', 'pike', 'Pike Push-ups', 'पाइक पुश-अप', 'Hips high in an inverted V. Lower the top of your head between your hands.', 'कूल्हे ऊपर, उल्टा V बनाएँ। सिर को हाथों के बीच नीचे लाएँ।', 'reps', 6, 'push', { spr: 3.5, stress: ARMS, sub: 'plank' })
ex('hindu_pushup', 'dand', 'Desi Dand', 'देसी दंड', 'From hips-high, swoop your chest down and forward, look up, push back.', 'कूल्हे ऊपर रखकर शुरू करें, सीना नीचे से आगे ले जाएँ, ऊपर देखें, वापस जाएँ।', 'reps', 8, 'push', { spr: 4, stress: ['wrists', 'shoulders', 'back'], sub: 'plank' })
ex('shoulder_taps', 'taps', 'Shoulder Taps', 'शोल्डर टैप', 'In a push-up position, tap each shoulder with the opposite hand. Hips still.', 'पुश-अप की स्थिति में उल्टे हाथ से कंधा छुएँ। कूल्हे स्थिर रखें।', 'reps', 16, 'push', { spr: 1.5, stress: ARMS, sub: 'plank' })

// ---------- Core & back ----------
ex('crunch', 'crunch', 'Crunches', 'क्रंचेस', 'On your back, knees bent. Curl your shoulders off the floor.', 'पीठ के बल लेटें, घुटने मोड़ें। कंधे ज़मीन से उठाएँ।', 'reps', 15, 'core', { spr: 2, stress: ['back'], sub: 'knee_drive' })
ex('leg_raise', 'legraise', 'Leg Raises', 'लेग रेज़', 'Lie flat. Raise straight legs up, lower slowly without touching down.', 'सीधे लेटें। सीधे पैर ऊपर उठाएँ, ज़मीन छुए बिना धीरे से नीचे लाएँ।', 'reps', 10, 'core', { stress: ['back'], sub: 'knee_drive' })
ex('plank', 'plank', 'Plank', 'प्लैंक', 'Forearms down, body in one straight line. Squeeze your stomach.', 'कोहनियों पर टिकें, शरीर एक सीधी रेखा में। पेट कसें।', 'time', 30, 'core', { stress: ['shoulders'], sub: 'crunch' })
ex('jackknife', 'vup', 'Jackknives', 'जैकनाइफ़', 'Lie flat, arms overhead. Lift arms and legs to meet above your hips.', 'सीधे लेटें, हाथ सिर के पीछे। हाथ और पैर उठाकर कूल्हों के ऊपर मिलाएँ।', 'reps', 10, 'core', { stress: ['back'], sub: 'plank' })
ex('hollow_hold', 'hollow', 'Hollow Hold', 'हॉलो होल्ड', 'Lower back pressed down, arms and legs hovering. Hold the banana shape.', 'कमर ज़मीन से लगी रहे, हाथ-पैर हवा में। इसी आकार में रुकें।', 'time', 20, 'core', { stress: ['back'], sub: 'plank' })
ex('v_up', 'vup', 'V-Ups', 'वी-अप', 'From flat, snap up into a V and touch your toes. Lower with control.', 'सीधे लेटकर झटके से V बनाएँ और पंजे छुएँ। संभलकर नीचे आएँ।', 'reps', 8, 'core', { stress: ['back'], sub: 'plank' })
ex('superman', 'superman', 'Superman', 'सुपरमैन', 'On your stomach. Lift arms, chest and legs, hold a second, lower.', 'पेट के बल लेटें। हाथ, सीना और पैर उठाएँ, एक पल रुकें, नीचे लाएँ।', 'reps', 12, 'back', { stress: ['back'], sub: 'bird_dog' })
ex('bird_dog', 'birddog', 'Bird Dog', 'बर्ड डॉग', 'On hands and knees, reach one arm and the opposite leg straight. Alternate.', 'हाथ और घुटनों पर आकर एक हाथ और उल्टा पैर सीधा फैलाएँ। बारी-बारी से।', 'reps', 12, 'back', { stress: ['wrists'], sub: 'glute_bridge' })

// ---------- Cool-down ----------
ex('forward_fold', 'fold', 'Forward Fold', 'आगे झुकना', 'Fold forward from the hips, let your head and arms hang.', 'कमर से आगे झुकें, सिर और हाथ ढीले छोड़ें।', 'time', 30, 'mobility', { stress: ['back'], sub: 'side_bend' })
ex('cobra', 'cobra', 'Cobra Stretch', 'भुजंगासन', 'On your stomach, hands under shoulders. Lift your chest gently.', 'पेट के बल लेटें, हाथ कंधों के नीचे। सीना धीरे से उठाएँ।', 'time', 25, 'mobility', { stress: ['back', 'wrists'], sub: 'child_pose' })
ex('child_pose', 'child', 'Child Pose', 'बालासन', 'Kneel, sit back on your heels and fold forward, arms stretched out.', 'घुटनों के बल बैठें, एड़ियों पर टिकें और हाथ आगे फैलाकर झुकें।', 'time', 40, 'mobility', { stress: ['knees'], sub: 'breathing' })
ex('downdog', 'downdog', 'Downward Dog', 'अधोमुख श्वानासन', 'Hands and feet down, hips high. Press your heels toward the floor.', 'हाथ-पैर ज़मीन पर, कूल्हे ऊपर। एड़ियाँ नीचे दबाएँ।', 'time', 30, 'mobility', { stress: ARMS, sub: 'forward_fold' })
ex('overhead_stretch', 'reach', 'Overhead Stretch', 'ताड़ासन', 'Stand tall, reach both arms overhead and stretch up.', 'सीधे खड़े होकर दोनों हाथ ऊपर उठाएँ और पूरा शरीर खींचें।', 'time', 30, 'mobility')
ex('breathing', 'sitfloor', 'Deep Breathing', 'गहरी साँस', 'Sit comfortably. Breathe in for 4, out for 6. Let your heart rate drop.', 'आराम से बैठें। 4 गिनती में साँस लें, 6 में छोड़ें। धड़कन शांत होने दें।', 'time', 45, 'mobility', { met: 1.5 })

export const EXERCISES = list
export const EX = Object.fromEntries(list.map((e) => [e.id, e]))

// Skill ladders: each rung is harder than the one before. The Coach places every athlete on a
// rung per ladder, moves them up after clean sessions and down when technique breaks.
export const TREES = {
  push: { name: { en: 'Push', hi: 'पुश' }, steps: ['wall_pushup', 'incline_pushup', 'knee_pushup', 'pushup', 'diamond_pushup', 'decline_pushup'] },
  legs: { name: { en: 'Legs', hi: 'पैर' }, steps: ['chair_sit_stand', 'squat', 'lunge', 'jump_squat', 'cossack_squat', 'pistol_squat'] },
  core: { name: { en: 'Core', hi: 'कोर' }, steps: ['crunch', 'leg_raise', 'plank', 'jackknife', 'hollow_hold', 'v_up'] },
}
export const START_TIERS = {
  beginner: { push: 1, legs: 1, core: 0 },
  inter: { push: 3, legs: 2, core: 2 },
  advanced: { push: 4, legs: 3, core: 3 },
}

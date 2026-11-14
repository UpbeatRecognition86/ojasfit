// Exercise library. Every movement is bodyweight; at most a chair or a wall.
// type: 'reps' | 'time' (seconds). base = amount for an average adult.
// avoid: limitation ids for which this move is swapped for `alt`.
const AREA_MET = { cardio: 7, legs: 5, push: 5, back: 4, core: 4, yoga: 3, mobility: 2.5, balance: 2.5, walk: 4.3, breath: 1.5 }

// Moves done one side at a time: the player calls "switch sides" at the halfway point.
const SIDES = ['side_bend', 'ankle_circles', 'lunge', 'side_leg_raise', 'vrikshasana', 'single_leg_stand', 'langdi', 'seated_leg_ext']

const list = []
function ex(id, pose, en, hi, cueEn, cueHi, type, base, area, o = {}) {
  list.push({
    id, pose, name: { en, hi }, cue: { en: cueEn, hi: cueHi }, type, base, area,
    lvl: o.lvl || 1, impact: o.impact || 'low', avoid: o.avoid || [], alt: o.alt || null,
    floor: !!o.floor, spr: o.spr || 3, met: o.met || AREA_MET[area], equip: o.equip || 'none',
    sides: SIDES.includes(id),
  })
}

// ---------- Warm-up & mobility ----------
ex('march', 'march', 'Spot Marching', 'जगह पर मार्च', 'March on the spot. Lift knees to a comfortable height and swing your arms.', 'एक ही जगह पर मार्च करें। घुटने आराम से उठाएँ और हाथ हिलाएँ।', 'time', 40, 'cardio', { met: 4 })
ex('arm_circles', 'jack', 'Arm Circles', 'हाथ घुमाना', 'Make big slow circles with both arms, forward then backward.', 'दोनों हाथों से बड़े, धीमे गोले बनाएँ — पहले आगे, फिर पीछे।', 'time', 30, 'mobility')
ex('side_bend', 'sidebend', 'Side Bends', 'बगल में झुकना', 'Reach one arm overhead and bend gently to the side. Switch sides.', 'एक हाथ ऊपर उठाकर धीरे से बगल में झुकें। फिर दूसरी तरफ़।', 'time', 30, 'mobility')
ex('torso_twist', 'twist', 'Standing Twists', 'कमर घुमाना', 'Feet apart, rotate your upper body left and right. Keep it gentle.', 'पैर थोड़े खोलकर ऊपरी शरीर को दाएँ-बाएँ घुमाएँ। झटका न दें।', 'time', 30, 'mobility', { avoid: ['back'], alt: 'side_bend' })
ex('ankle_circles', 'seated', 'Ankle Circles', 'टखने घुमाना', 'Sit tall. Lift one foot and circle the ankle both ways. Switch feet.', 'सीधे बैठें। एक पैर उठाकर टखना दोनों तरफ़ घुमाएँ। फिर दूसरा पैर।', 'time', 30, 'mobility', { equip: 'chair' })
ex('cat_cow', 'catcow', 'Cat–Cow', 'मार्जरी आसन', 'On hands and knees, round your back up, then let it dip. Move with your breath.', 'हाथ और घुटनों पर आकर पीठ ऊपर गोल करें, फिर नीचे झुकाएँ। साँस के साथ चलें।', 'time', 40, 'mobility', { floor: true, alt: 'side_bend' })

// ---------- Cardio ----------
ex('jumping_jacks', 'jack', 'Jumping Jacks', 'जंपिंग जैक', 'Jump feet apart as arms go overhead, then jump back together.', 'कूदकर पैर खोलें और हाथ ऊपर ले जाएँ, फिर वापस साथ लाएँ।', 'time', 30, 'cardio', { impact: 'high', alt: 'step_jacks' })
ex('step_jacks', 'jack', 'Step Jacks', 'स्टेप जैक', 'Step one foot out as arms rise, step back in. No jumping.', 'बिना कूदे एक पैर बाहर रखें और हाथ ऊपर उठाएँ, फिर वापस लाएँ।', 'time', 30, 'cardio', { met: 5 })
ex('high_knees', 'march', 'High Knees', 'हाई नीज़', 'Run on the spot, driving knees up to hip height.', 'एक जगह दौड़ें और घुटनों को कमर तक उठाएँ।', 'time', 30, 'cardio', { impact: 'high', alt: 'march', lvl: 2 })
ex('skipping', 'skip', 'Invisible Rope Skipping', 'बिना रस्सी की रस्सी कूद', 'Small quick hops as if skipping a rope. Stay light on your toes.', 'ऐसे हल्के-हल्के कूदें जैसे रस्सी कूद रहे हों। पंजों पर रहें।', 'time', 30, 'cardio', { impact: 'high', alt: 'step_jacks', lvl: 2 })
ex('mountain_climbers', 'climber', 'Mountain Climbers', 'माउंटेन क्लाइंबर', 'In a push-up position, drive knees to chest one after the other.', 'पुश-अप की स्थिति में घुटनों को बारी-बारी से सीने की ओर लाएँ।', 'time', 25, 'cardio', { floor: true, avoid: ['shoulder'], alt: 'high_knees', lvl: 2 })
ex('squat_thrust', 'thrust', 'Squat Thrusts', 'स्क्वैट थ्रस्ट', 'Squat, place hands down, step or jump feet back to plank, return and stand.', 'बैठें, हाथ ज़मीन पर रखें, पैर पीछे ले जाकर प्लैंक बनाएँ, वापस आकर खड़े हों।', 'reps', 8, 'cardio', { floor: true, impact: 'high', avoid: ['shoulder', 'back'], alt: 'squat', lvl: 3, spr: 5 })
ex('shadow_boxing', 'box', 'Shadow Boxing', 'शैडो बॉक्सिंग', 'Knees soft, fists up. Throw quick punches at the air.', 'घुटने हल्के मोड़ें, मुट्ठियाँ ऊपर। हवा में तेज़ मुक्के मारें।', 'time', 30, 'cardio', { met: 6, avoid: ['shoulder'], alt: 'march' })
ex('bhangra', 'bhangra', 'Bhangra Bounce', 'भांगड़ा बाउंस', 'Arms up, bounce and lift one knee then the other. Smile — it is a dance!', 'हाथ ऊपर, उछलते हुए बारी-बारी से घुटने उठाएँ। मुस्कुराइए — यह नाच है!', 'time', 40, 'cardio', { met: 6.5, avoid: ['knee'], alt: 'step_jacks' })
ex('brisk_walk', 'march', 'Brisk Walk', 'तेज़ चाल', 'Walk fast enough that you can talk but not sing. Indoors or outdoors.', 'इतनी तेज़ चलें कि बात कर सकें पर गा न सकें। घर के अंदर या बाहर।', 'time', 300, 'walk')

// ---------- Legs ----------
ex('squat', 'squat', 'Baithak (Squat)', 'बैठक (स्क्वैट)', 'Feet shoulder-width. Sit back as if onto a chair, chest up, then stand.', 'पैर कंधों जितने खोलें। कुर्सी पर बैठने की तरह नीचे जाएँ, सीना ऊपर रखें, फिर खड़े हों।', 'reps', 12, 'legs', { avoid: ['knee'], alt: 'chair_sit_stand' })
ex('hindu_squat', 'squat', 'Desi Baithak', 'देसी बैठक', 'Akhada style: swing arms back, squat deep onto your toes, swing up to stand.', 'अखाड़े का तरीक़ा: हाथ पीछे ले जाएँ, पंजों पर गहरा बैठें, हाथ झुलाते हुए उठें।', 'reps', 15, 'legs', { avoid: ['knee'], alt: 'squat', lvl: 2 })
ex('jump_squat', 'squat', 'Jump Squats', 'जंप स्क्वैट', 'Squat down, then jump up. Land softly and go straight into the next one.', 'नीचे बैठें और ऊपर कूदें। धीरे से उतरें और तुरंत अगला करें।', 'reps', 10, 'legs', { impact: 'high', avoid: ['knee'], alt: 'squat', lvl: 3, met: 7 })
ex('chair_sit_stand', 'chair', 'Chair Sit-to-Stand', 'कुर्सी से उठना-बैठना', 'Sit on a sturdy chair. Stand up without using your hands, sit down slowly.', 'मज़बूत कुर्सी पर बैठें। हाथों का सहारा लिए बिना खड़े हों, धीरे से बैठें।', 'reps', 10, 'legs', { equip: 'chair' })
ex('wall_sit', 'wallsit', 'Wall Sit', 'वॉल सिट', 'Back against a wall, slide down until thighs are level. Hold.', 'पीठ दीवार से लगाकर नीचे सरकें जब तक जाँघें सीधी न हों। रुके रहें।', 'time', 25, 'legs', { avoid: ['knee'], alt: 'chair_sit_stand', lvl: 2, equip: 'wall' })
ex('lunge', 'lunge', 'Lunges', 'लंजेस', 'Step forward and lower both knees to about 90 degrees. Push back. Switch legs.', 'एक क़दम आगे रखें और दोनों घुटने मोड़कर नीचे जाएँ। वापस आएँ। पैर बदलें।', 'reps', 10, 'legs', { avoid: ['knee'], alt: 'chair_sit_stand', lvl: 2 })
ex('glute_bridge', 'bridge', 'Glute Bridge', 'सेतु बंध (ब्रिज)', 'Lie on your back, knees bent. Lift hips up, squeeze, lower slowly.', 'पीठ के बल लेटें, घुटने मोड़ें। कूल्हे ऊपर उठाएँ, कसें, धीरे से नीचे लाएँ।', 'reps', 12, 'legs', { floor: true, alt: 'chair_sit_stand' })
ex('calf_raise', 'calf', 'Heel Raises', 'एड़ी उठाना', 'Rise onto your toes, pause, lower slowly. Hold a chair or wall if needed.', 'पंजों पर उठें, रुकें, धीरे से नीचे आएँ। ज़रूरत हो तो कुर्सी या दीवार पकड़ें।', 'reps', 15, 'legs', { spr: 2 })
ex('side_leg_raise', 'sideleg', 'Side Leg Raises', 'पैर बगल में उठाना', 'Stand tall, lift one leg out to the side without leaning. Switch halfway.', 'सीधे खड़े होकर बिना झुके एक पैर बगल में उठाएँ। आधे में पैर बदलें।', 'reps', 12, 'balance')

// ---------- Push ----------
ex('wall_pushup', 'wallpush', 'Wall Push-ups', 'दीवार पुश-अप', 'Hands on a wall, body straight. Bend elbows to bring chest close, push away.', 'हाथ दीवार पर, शरीर सीधा। कोहनी मोड़कर सीना पास लाएँ, फिर धक्का दें।', 'reps', 10, 'push', { equip: 'wall' })
ex('knee_pushup', 'pushup', 'Knee Push-ups', 'घुटनों वाले पुश-अप', 'Push-up with knees on the floor. Keep a straight line from knees to head.', 'घुटने ज़मीन पर रखकर पुश-अप करें। घुटनों से सिर तक शरीर सीधा रखें।', 'reps', 8, 'push', { floor: true, avoid: ['shoulder'], alt: 'wall_pushup' })
ex('pushup', 'pushup', 'Dand (Push-up)', 'दंड (पुश-अप)', 'Hands under shoulders, body like a plank. Lower chest to the floor, push up.', 'हाथ कंधों के नीचे, शरीर तख़्ते जैसा सीधा। सीना नीचे लाएँ और ऊपर धकेलें।', 'reps', 8, 'push', { floor: true, avoid: ['shoulder'], alt: 'knee_pushup', lvl: 2 })
ex('hindu_pushup', 'dand', 'Desi Dand', 'देसी दंड', 'From hips-high, swoop chest down and forward, then look up. Push back to start.', 'कूल्हे ऊपर रखकर शुरू करें, सीना नीचे से आगे ले जाएँ और ऊपर देखें। वापस जाएँ।', 'reps', 8, 'push', { floor: true, avoid: ['shoulder', 'back'], alt: 'pushup', lvl: 3, spr: 4 })

// ---------- Back ----------
ex('superman', 'superman', 'Superman', 'सुपरमैन', 'Lie on your stomach. Lift arms, chest and legs a little, hold a second, lower.', 'पेट के बल लेटें। हाथ, सीना और पैर थोड़ा उठाएँ, एक पल रुकें, नीचे लाएँ।', 'reps', 10, 'back', { floor: true, avoid: ['back'], alt: 'bird_dog' })
ex('bird_dog', 'birddog', 'Bird Dog', 'बर्ड डॉग', 'On hands and knees, reach one arm and the opposite leg straight. Alternate.', 'हाथ और घुटनों पर आकर एक हाथ और उल्टा पैर सीधा फैलाएँ। बारी-बारी से करें।', 'reps', 10, 'back', { floor: true, alt: 'side_leg_raise' })

// ---------- Core ----------
ex('plank', 'plank', 'Plank', 'प्लैंक', 'Forearms down, body in one straight line. Tighten your stomach and breathe.', 'कोहनियों पर टिकें, शरीर एक सीधी रेखा में। पेट कसें और साँस लेते रहें।', 'time', 20, 'core', { floor: true, avoid: ['shoulder'], alt: 'knee_to_elbow' })
ex('crunch', 'crunch', 'Crunches', 'क्रंचेस', 'Lie back, knees bent. Curl shoulders off the floor, lower slowly.', 'पीठ के बल लेटें, घुटने मोड़ें। कंधे ज़मीन से उठाएँ, धीरे से नीचे आएँ।', 'reps', 12, 'core', { floor: true, avoid: ['back'], alt: 'knee_to_elbow' })
ex('leg_raise', 'legraise', 'Leg Raises', 'लेग रेज़', 'Lie flat. Raise straight legs up, lower slowly without touching down.', 'सीधे लेटें। सीधे पैर ऊपर उठाएँ, ज़मीन छुए बिना धीरे से नीचे लाएँ।', 'reps', 10, 'core', { floor: true, avoid: ['back'], alt: 'knee_to_elbow', lvl: 2 })
ex('knee_to_elbow', 'march', 'Standing Knee-to-Elbow', 'खड़े होकर घुटना-कोहनी', 'Hands by your ears. Lift a knee and bring the opposite elbow toward it.', 'हाथ कानों के पास। एक घुटना उठाएँ और उल्टी कोहनी उसकी ओर लाएँ।', 'reps', 16, 'core', { spr: 2 })

// ---------- Yoga ----------
ex('surya_namaskar', 'surya', 'Surya Namaskar', 'सूर्य नमस्कार', 'Flow through all 12 poses at your own pace. One full round counts as one.', 'अपनी गति से सभी 12 आसन करें। एक पूरा चक्र एक गिना जाएगा।', 'reps', 3, 'yoga', { floor: true, avoid: ['back'], alt: 'tadasana', spr: 45, met: 4 })
ex('tadasana', 'reach', 'Tadasana (Mountain Stretch)', 'ताड़ासन', 'Stand tall, reach both arms overhead and stretch up. Breathe deeply.', 'सीधे खड़े होकर दोनों हाथ ऊपर उठाएँ और पूरा शरीर खींचें। गहरी साँस लें।', 'time', 30, 'yoga')
ex('vrikshasana', 'balance', 'Vrikshasana (Tree Pose)', 'वृक्षासन', 'Stand on one leg, other foot on the inner leg, palms together. Switch halfway.', 'एक पैर पर खड़े हों, दूसरा पंजा अंदर की तरफ़ टिकाएँ, हथेलियाँ जोड़ें। आधे में पैर बदलें।', 'time', 40, 'balance')
ex('single_leg_stand', 'sideleg', 'One-Leg Stand', 'एक पैर पर खड़े होना', 'Hold a chair. Lift one foot slightly and balance. Switch halfway.', 'कुर्सी पकड़ें। एक पैर थोड़ा उठाकर संतुलन बनाएँ। आधे में पैर बदलें।', 'time', 30, 'balance', { equip: 'chair' })
ex('cobra', 'cobra', 'Bhujangasana (Cobra)', 'भुजंगासन', 'Lie on your stomach, hands under shoulders. Lift your chest gently.', 'पेट के बल लेटें, हाथ कंधों के नीचे। सीना धीरे से ऊपर उठाएँ।', 'time', 20, 'yoga', { floor: true, avoid: ['back'], alt: 'tadasana' })
ex('downdog', 'downdog', 'Adho Mukha (Downward Dog)', 'अधोमुख श्वानासन', 'Hands and feet on the floor, hips high in an inverted V. Press heels down.', 'हाथ-पैर ज़मीन पर, कूल्हे ऊपर — उल्टा V बनाएँ। एड़ियाँ नीचे दबाएँ।', 'time', 30, 'yoga', { floor: true, avoid: ['shoulder'], alt: 'tadasana' })
ex('forward_fold', 'fold', 'Uttanasana (Forward Fold)', 'उत्तानासन', 'Fold forward from the hips, let your head and arms hang. Knees can bend.', 'कमर से आगे झुकें, सिर और हाथ ढीले छोड़ें। घुटने मोड़ सकते हैं।', 'time', 30, 'yoga', { avoid: ['back'], alt: 'side_bend' })
ex('child_pose', 'child', 'Balasana (Child Pose)', 'बालासन', 'Kneel, sit back on your heels and fold forward with arms stretched out.', 'घुटनों के बल बैठें, एड़ियों पर टिकें और हाथ आगे फैलाकर झुकें।', 'time', 40, 'yoga', { floor: true, avoid: ['knee'], alt: 'breathing' })
ex('butterfly', 'sitfloor', 'Titli Asana (Butterfly)', 'तितली आसन', 'Sit, soles of feet together. Flap your knees gently like butterfly wings.', 'बैठकर दोनों तलवे जोड़ें। घुटनों को तितली के पंखों की तरह हिलाएँ।', 'time', 40, 'yoga', { floor: true, alt: 'ankle_circles' })
ex('breathing', 'sitfloor', 'Anulom Vilom (Calm Breathing)', 'अनुलोम-विलोम', 'Sit comfortably on the floor or a chair. Breathe slowly through alternate nostrils.', 'ज़मीन या कुर्सी पर आराम से बैठें। बारी-बारी से एक-एक नथुने से धीमी साँस लें।', 'time', 60, 'breath')
ex('shavasana', 'lie', 'Shavasana', 'शवासन', 'Lie on your back, arms relaxed, eyes closed. Let the whole body go loose.', 'पीठ के बल लेटें, हाथ ढीले, आँखें बंद। पूरे शरीर को ढीला छोड़ दें।', 'time', 60, 'breath', { floor: true, alt: 'breathing' })

// ---------- Chair (seniors, office) ----------
ex('seated_march', 'seated', 'Seated March', 'बैठकर मार्च', 'Sit tall on a chair. Lift knees one by one as if marching.', 'कुर्सी पर सीधे बैठें। मार्च की तरह बारी-बारी से घुटने उठाएँ।', 'time', 40, 'cardio', { met: 3, equip: 'chair' })
ex('seated_arm_raise', 'seated', 'Seated Arm Raises', 'बैठकर हाथ उठाना', 'Sitting tall, raise both arms overhead and lower them slowly.', 'सीधे बैठकर दोनों हाथ सिर के ऊपर उठाएँ और धीरे से नीचे लाएँ।', 'reps', 10, 'push', { met: 3, avoid: ['shoulder'], alt: 'seated_march', equip: 'chair' })
ex('seated_leg_ext', 'seated', 'Seated Leg Extensions', 'बैठकर पैर सीधा करना', 'Sitting on a chair, straighten one leg, hold for a second, lower. Alternate.', 'कुर्सी पर बैठकर एक पैर सीधा करें, एक पल रोकें, नीचे लाएँ। बारी-बारी से।', 'reps', 12, 'legs', { met: 3, equip: 'chair' })

// ---------- Kids ----------
ex('frog_jumps', 'squat', 'Mendhak Kood (Frog Jumps)', 'मेंढक कूद', 'Squat like a frog, hands on the floor, and jump forward. Ribbit!', 'मेंढक की तरह बैठें, हाथ ज़मीन पर, और आगे कूदें। टर्र-टर्र!', 'reps', 8, 'legs', { impact: 'high', avoid: ['knee'], alt: 'squat', met: 7 })
ex('bear_crawl', 'downdog', 'Bhalu Chaal (Bear Walk)', 'भालू चाल', 'Hands and feet on the floor, hips up. Walk forward and back like a bear.', 'हाथ-पैर ज़मीन पर, कूल्हे ऊपर। भालू की तरह आगे-पीछे चलें।', 'time', 20, 'cardio', { floor: true, avoid: ['shoulder'], alt: 'march', met: 6 })
ex('star_jumps', 'jack', 'Star Jumps', 'सितारा कूद', 'Jump up and spread your arms and legs like a star!', 'ऊपर कूदें और हाथ-पैर सितारे की तरह फैलाएँ!', 'reps', 10, 'cardio', { impact: 'high', alt: 'step_jacks' })
ex('langdi', 'hop', 'Langdi Hops', 'लंगड़ी', 'Hop on one foot like in the game of langdi. Switch feet halfway.', 'लंगड़ी के खेल की तरह एक पैर पर कूदें। आधे में पैर बदलें।', 'time', 20, 'balance', { impact: 'high', alt: 'single_leg_stand', met: 6 })

export const EXERCISES = list
export const EX = Object.fromEntries(list.map((e) => [e.id, e]))

// Writes DEMO-PROMPTS.md: the image-generation prompts for exercise demonstrations.
// Each move gets a start (a) and end (b) pose; the app alternates between them.
// Usage: node scripts/demo-prompts.mjs
import { writeFileSync } from 'node:fs'
import { EXERCISES } from '../src/data/exercises.js'

const SIDE = 'Side view, facing right'
const FRONT = 'Front view, facing the camera'
const CHAIR = 'a plain matte black wooden chair with no armrests'
const WALL = 'a plain dark indigo wall'

// id: [view, pose a, pose b]. A null b means the move is a hold: one image is enough.
const POSES = {
  march: [SIDE, 'Standing tall, left knee lifted to hip height, right arm bent and swung forward, left arm back.', 'Standing tall, right knee lifted to hip height, left arm bent and swung forward, right arm back.'],
  arm_circles: [FRONT, 'Standing tall, feet hip-width apart, both arms straight out to the sides at shoulder height, palms down.', 'Standing tall, feet hip-width apart, both arms straight up overhead, slightly apart.'],
  side_bend: [FRONT, 'Standing, feet shoulder-width apart, right arm reaching overhead, torso bending to the left, left hand resting on the left thigh.', 'Standing, feet shoulder-width apart, left arm reaching overhead, torso bending to the right, right hand resting on the right thigh.'],
  torso_twist: [FRONT, 'Standing, feet shoulder-width apart, elbows bent with hands in front of the chest, upper body rotated to his left, hips facing forward.', 'Standing, feet shoulder-width apart, elbows bent with hands in front of the chest, upper body rotated to his right, hips facing forward.'],
  cat_cow: [SIDE, 'On hands and knees, hands under shoulders, knees under hips, back rounded up toward the ceiling, head dropped down.', 'On hands and knees, hands under shoulders, knees under hips, back gently arched down, chest forward, head looking ahead.'],
  jumping_jacks: [FRONT, 'Standing tall, feet together, arms straight down by his sides.', 'Mid-jump landing, feet wide apart, both arms straight overhead with hands close together.'],
  step_jacks: [FRONT, 'Standing tall, feet together, arms straight down by his sides.', 'Right foot stepped out wide to the side, left foot planted, both arms raised overhead. Both feet on the floor, no jumping.'],
  high_knees: [SIDE, 'Running on the spot, left knee driven up above hip height, right foot on the floor on the ball of the foot, arms pumping.', 'Running on the spot, right knee driven up above hip height, left foot on the floor on the ball of the foot, arms pumping.'],
  knee_drive: [FRONT, 'Standing tall, hands lightly behind his ears, elbows wide, both feet on the floor.', 'Standing on the left leg, right knee lifted high across the body, left elbow brought down to touch the right knee, hands behind his ears.'],
  skipping: [SIDE, 'Standing on the balls of both feet, knees slightly bent, elbows bent close to his sides, hands low as if holding skipping-rope handles.', 'Both feet a few centimetres off the floor in a small hop, legs nearly straight, elbows close to his sides, hands low as if turning a skipping rope.'],
  mountain_climbers: [SIDE, 'High plank on straight arms, hands under shoulders, body straight, left knee driven forward under the chest, right leg extended back.', 'High plank on straight arms, hands under shoulders, body straight, right knee driven forward under the chest, left leg extended back.'],
  burpee: [SIDE, 'High plank on straight arms, hands under shoulders, body in one straight line from head to heels.', 'Jumping straight up, feet off the floor, body fully extended, arms reaching overhead.'],
  sprawl: [SIDE, 'Deep squat with both hands flat on the floor just in front of his feet, heels down.', 'High plank on straight arms, hands under shoulders, body in one straight line from head to heels, feet stepped back.'],
  shadow_boxing: [SIDE, 'Boxing stance, left foot forward, knees soft, right fist guarding his chin, left arm extended straight forward in a jab.', 'Boxing stance, left foot forward, knees soft, left fist guarding his chin, right arm extended straight forward in a cross, hips rotated.'],
  chair_sit_stand: [SIDE, `Sitting upright on the front half of ${CHAIR}, feet flat on the floor hip-width apart, arms crossed over his chest.`, `Standing tall directly in front of ${CHAIR}, arms crossed over his chest, feet flat on the floor.`],
  squat: [SIDE, 'Standing tall, feet shoulder-width apart, arms relaxed by his sides.', 'Bottom of a bodyweight squat: thighs parallel to the floor, heels flat on the floor, knees over toes, chest up, back straight, arms straight out in front at shoulder height.'],
  lunge: [SIDE, 'Standing tall, feet hip-width apart, hands on his hips.', 'Forward lunge: right foot forward with the right knee bent to 90 degrees directly over the ankle, left knee bent and hovering just above the floor, torso upright, hands on his hips.'],
  jump_squat: [SIDE, 'Bottom of a squat: thighs parallel to the floor, heels flat, chest up, arms swung back behind his hips.', 'Jumping straight up, feet clearly off the floor, legs straight, arms swung down by his sides, body upright.'],
  cossack_squat: [FRONT, 'Standing in a very wide stance, feet turned slightly out, hands clasped in front of his chest.', 'Cossack squat: sitting deep onto his right leg with the right heel flat on the floor, left leg straight out to the side with the toes pointing up, chest up, hands clasped in front of his chest.'],
  pistol_squat: [SIDE, 'Standing on the right leg, left leg lifted straight out in front just off the floor, arms straight out in front for balance.', 'Bottom of a pistol squat: sitting deep on the right leg with the right heel flat, left leg held straight out in front parallel to the floor, arms straight out in front.'],
  tempo_squat: [SIDE, 'Halfway down a slow squat: knees bent about 45 degrees, hips pushed back, heels flat, chest up, hands clasped in front of his chest.', 'Bottom of a squat, holding still: thighs parallel to the floor, heels flat, chest up, hands clasped in front of his chest.'],
  hindu_squat: [SIDE, 'Standing tall, both arms pulled back behind his hips with elbows bent, ready to swing forward.', 'Deep squat up on the balls of his feet with heels lifted, knees forward, back upright, both arms swung straight down in front with fingertips near the floor.'],
  split_squat: [SIDE, 'Split stance: right foot forward and left foot back about a metre apart, both legs straight, torso upright, hands on his hips.', 'Bottom of a split squat: front right knee bent to 90 degrees over the ankle, back left knee hovering just above the floor, torso upright, hands on his hips.'],
  glute_bridge: [SIDE, 'Lying on his back, knees bent, feet flat on the floor hip-width apart, arms flat by his sides, hips resting on the floor.', 'Glute bridge: lying on his upper back, feet flat, hips lifted high so shoulders, hips and knees form one straight line, arms flat by his sides.'],
  wall_sit: [SIDE, `Wall sit: back flat against ${WALL}, thighs parallel to the floor, knees bent at 90 degrees directly over the ankles, feet flat, arms crossed over his chest.`, null],
  calf_raise: [SIDE, 'Standing tall, feet hip-width apart and flat on the floor, hands on his hips.', 'Standing high on the balls of both feet with heels lifted as far as possible, legs straight, hands on his hips.'],
  hamstring_walkout: [SIDE, 'Standing with legs nearly straight, folded forward at the hips, both hands flat on the floor just in front of his feet.', 'High plank on straight arms, hands under shoulders, body in one straight line, having walked his hands forward from his feet.'],
  wall_pushup: [SIDE, `Leaning toward ${WALL} with straight arms, palms flat on the wall at shoulder height, feet about a metre from the wall, body in one straight line.`, `Elbows bent, chest close to ${WALL}, palms flat on the wall at shoulder height, feet about a metre from the wall, body in one straight line, heels slightly lifted.`],
  incline_pushup: [SIDE, `Incline push-up top position: hands on the seat of ${CHAIR}, arms straight, body in one straight line from head to heels, feet on the floor.`, `Incline push-up bottom position: hands on the seat of ${CHAIR}, elbows bent at 90 degrees, chest just above the seat, body in one straight line.`],
  knee_pushup: [SIDE, 'Knee push-up top position: knees on the floor, arms straight, hands under shoulders, straight line from knees to head, feet lifted behind him.', 'Knee push-up bottom position: knees on the floor, elbows bent, chest just above the floor, straight line from knees to head.'],
  pushup: [SIDE, 'Push-up top position: arms straight, hands under shoulders, body in one straight line from head to heels, toes on the floor.', 'Push-up bottom position: elbows bent at about 45 degrees from the body, chest just above the floor, body in one straight line from head to heels.'],
  diamond_pushup: ['Three-quarter front view from slightly above', 'Diamond push-up top position: arms straight, hands together under the chest with thumbs and index fingers touching to form a diamond, body in one straight line.', 'Diamond push-up bottom position: chest lowered to just above the hands, hands together forming a diamond, elbows tucked close to the ribs, body in one straight line.'],
  decline_pushup: [SIDE, `Decline push-up top position: toes up on the seat of ${CHAIR} behind him, hands on the floor under shoulders, arms straight, body in one straight line sloping down toward his head.`, `Decline push-up bottom position: toes up on the seat of ${CHAIR} behind him, elbows bent, chest just above the floor, body in one straight line.`],
  pike_pushup: [SIDE, 'Pike position: hands and feet on the floor, hips lifted high so the body forms an inverted V, arms and legs straight, head between his arms.', 'Pike push-up bottom position: hips still high in an inverted V, elbows bent, the top of his head lowered to just above the floor between his hands.'],
  hindu_pushup: [SIDE, 'Hands and feet on the floor wider than shoulder width, hips lifted high in an inverted V, arms and legs straight, head between his arms.', 'Hips dropped close to the floor, arms straight, chest lifted and pushed forward, head up looking ahead, thighs just off the floor, toes on the floor.'],
  shoulder_taps: [SIDE, 'High plank on straight arms, hands under shoulders, feet a little wider than hip-width, body in one straight line.', 'High plank balanced on the left hand, right hand lifted to tap his left shoulder, hips level and square to the floor, feet wider than hip-width.'],
  crunch: [SIDE, 'Lying on his back, knees bent, feet flat on the floor, hands lightly behind his head, head and shoulders resting on the floor.', 'Crunch top position: knees bent, feet flat, hands lightly behind his head, shoulder blades curled off the floor, lower back still on the floor.'],
  leg_raise: [SIDE, 'Lying flat on his back, arms flat by his sides, both legs straight and hovering a few centimetres above the floor.', 'Lying on his back, arms flat by his sides, both legs straight and raised vertically toward the ceiling, lower back on the floor.'],
  plank: [SIDE, 'Forearm plank: elbows directly under shoulders, forearms flat on the floor, body in one straight line from head to heels, toes on the floor, eyes looking at the floor.', null],
  jackknife: [SIDE, 'Lying flat on his back, legs straight on the floor, arms straight on the floor overhead.', 'Jackknife top position: balanced on his hips, straight legs raised to about 60 degrees, torso lifted, straight arms reaching forward to touch his shins.'],
  hollow_hold: [SIDE, 'Hollow body hold: lying on his back with the lower back pressed into the floor, shoulders and straight legs lifted about 20 centimetres off the floor, arms straight overhead beside his ears, body curved like a shallow banana.', null],
  v_up: [SIDE, 'Lying flat on his back, legs straight on the floor, arms straight on the floor overhead.', 'V-up top position: balanced on his hips, body folded into a sharp V, straight legs raised high, straight arms reaching up to touch his toes.'],
  superman: [SIDE, 'Lying face down on the floor, arms stretched straight out in front, legs straight, forehead near the floor.', 'Lying face down, arms, chest and straight legs all lifted a few centimetres off the floor, arms reaching forward, eyes on the floor.'],
  bird_dog: [SIDE, 'On hands and knees, hands under shoulders, knees under hips, back flat like a table, eyes on the floor.', 'On hands and knees, right arm extended straight forward and left leg extended straight back, both parallel to the floor, back flat, hips level.'],
  forward_fold: [SIDE, 'Standing forward fold: legs nearly straight with a slight knee bend, folded at the hips, torso hanging down, head relaxed, fingertips touching the floor.', null],
  cobra: [SIDE, 'Cobra stretch: lying face down with hips and thighs on the floor, hands under shoulders, elbows slightly bent, chest lifted, shoulders down away from his ears, eyes looking ahead.', null],
  child_pose: [SIDE, 'Child pose: kneeling, sitting back on his heels, torso folded forward over his thighs, forehead on the floor, arms stretched straight out in front on the floor.', null],
  downdog: [SIDE, 'Downward dog: hands and feet on the floor, hips lifted high so the body forms an inverted V, arms and legs straight, heels pressing toward the floor, head between his arms.', null],
  overhead_stretch: [SIDE, 'Standing tall, feet together, both arms stretched straight overhead with fingers interlaced and palms facing up, body long.', null],
  breathing: [FRONT, 'Sitting cross-legged on the floor, back tall, hands resting on his knees with palms up, eyes closed, calm expression.', null],
}

const missing = EXERCISES.filter((e) => !POSES[e.id]).map((e) => e.id)
if (missing.length) { console.error('No pose written for:', missing.join(', ')); process.exit(1) }

const STYLE = 'Use the attached reference image: the same man with the same face, hair and build, wearing the same plain black t-shirt and black shorts, barefoot. Same dark indigo studio background, same dark floor, same soft even lighting. Photorealistic photograph. His whole body is visible with space around it, camera at hip height. No text, no logos, no watermark, no other people. Square image, 1024×1024.'

const prompt = (view, pose) => `${STYLE}\n${view}. ${pose}`

let n = 0
const blocks = EXERCISES.map((e) => {
  const [view, a, b] = POSES[e.id]
  n += b ? 2 : 1
  let s = `### ${e.name.en}\n\nSave as \`${e.id}-a.png\`\n\n\`\`\`\n${prompt(view, a)}\n\`\`\`\n`
  if (b) s += `\nSave as \`${e.id}-b.png\`\n\n\`\`\`\n${prompt(view, b)}\n\`\`\`\n`
  return s
})

const md = `# Exercise demonstration prompts

${n} images for ${EXERCISES.length} exercises. Most moves need two images, the start (\`-a\`) and the
end (\`-b\`) of the movement; the app alternates between them. Holds need one.

## Before you start

1. **Make one reference image first.** Generate it with the prompt below, pick a result you
   like, and attach that same image to **every** prompt after it. This is what keeps it the
   same person in all ${n} images.
2. **Ask for 1024×1024.** Smaller images look soft on a phone.
3. **Check each image before saving it.** Reject it if the pose does not match the description,
   if a hand or foot looks wrong, if any part of the body is cut off, or if he is a different
   person. Regenerate until it is right: wrong form in a fitness app teaches wrong form.
4. **Name the file exactly as shown** above each prompt, for example \`squat-a.png\`.
5. **Upload them to the \`demo-src/\` folder of the ojasfit repository on GitHub**
   (Add file → Upload files). You can upload in batches.

## Reference image (generate this first)

\`\`\`
Full-body photograph of an athletic Indian man in his late twenties with short black hair,
wearing a plain black t-shirt and plain black shorts, barefoot, standing tall and relaxed with
arms by his sides. Side view, facing right. Plain dark indigo studio background (#0b0d1a) and a
matching dark floor, soft even lighting. His whole body is visible with space around it, camera
at hip height. Photorealistic. No text, no logos, no watermark. Square image, 1024×1024.
\`\`\`

## The prompts

${blocks.join('\n')}`

writeFileSync(new URL('../DEMO-PROMPTS.md', import.meta.url), md)
console.log(`Wrote DEMO-PROMPTS.md: ${n} images for ${EXERCISES.length} exercises`)

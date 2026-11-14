// Writes VOICE-SCRIPT.md: the numbered list of lines to record, in recording order.
import { writeFileSync } from 'node:fs'
import { VOICE_LINES } from '../src/data/voice.js'

const section = (title, lang) => `## ${title}\n\n${VOICE_LINES.map((l, i) => `${i + 1}. ${l[lang]}`).join('\n')}\n`
const md = `# OjasFit voice script

${VOICE_LINES.length} lines per language. Record **one audio file per language**, reading the lines
**in this order**.

How to record
- Use your phone's voice recorder in a quiet room, phone about a hand's width from your mouth.
- Leave a clear **2 second silence** between lines. That silence is how the lines get separated.
- Do not say the numbers. Just the line.
- Say it your own way if the wording feels stiff: warm, clear, like a coach standing next to you.
  The words can change; the **order and the number of lines cannot**.
- If you fumble a line, stay silent for 2 seconds and carry on to the end. Tell me which line
  numbers you repeated, or simply re-record the whole file.
- Save as \`voice-hi\` and \`voice-en\` (any format: m4a, mp3, wav) and upload both to the
  \`recordings/\` folder of the ojasfit repository on GitHub.

${section('Hindi (voice-hi)', 'hi')}
${section('English (voice-en)', 'en')}`
writeFileSync(new URL('../VOICE-SCRIPT.md', import.meta.url), md)
console.log(`Wrote VOICE-SCRIPT.md with ${VOICE_LINES.length} lines per language`)

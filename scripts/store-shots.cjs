// Generates Play Store graphics from the running app (npx vite preview --port 4174):
//   store/screenshots/<lang>/<n>.jpg   1080×1920 captioned phone screenshots, en + hi
//   store/feature-graphic.png          1024×500 banner
// Usage: node scripts/store-shots.cjs
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:4174/'
const OUT = path.join(__dirname, '..', 'store')
const CSS = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8').match(/assets\/index-[^"]+\.css/)[0]

const CAPTIONS = {
  en: [
    ['Your coach plans your week', 'Built around your goal and the days you can train'],
    ['Follow along, step by step', 'Animated moves, timers and a voice coach'],
    ['Short on time? Bad knees?', 'Every session adapts to you'],
    ['10 journeys for every goal', 'From first steps to akhada strength'],
    ['Beat your own record', 'Peaks: same workout, faster time'],
    ['Watch yourself get fitter', 'Streaks, charts and your best times'],
  ],
  hi: [
    ['आपका कोच, आपका हफ़्ता', 'आपके लक्ष्य और कसरत के दिनों के हिसाब से'],
    ['क़दम-दर-क़दम, साथ-साथ', 'चलती तस्वीरें, टाइमर और आवाज़ वाला कोच'],
    ['समय कम? घुटनों में दर्द?', 'हर सेशन आपके हिसाब से बदलता है'],
    ['हर लक्ष्य के लिए 10 यात्राएँ', 'पहले क़दम से अखाड़े की ताक़त तक'],
    ['अपना रिकॉर्ड तोड़िए', 'चोटियाँ: वही कसरत, कम समय'],
    ['ख़ुद को फ़िट होते देखिए', 'लगातार दिन, चार्ट और सर्वश्रेष्ठ समय'],
  ],
}

function seed(lang) {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
  const history = []
  let id = 1
  // ~8 weeks of training, slowly increasing; a 4-day streak ending yesterday
  const daysAgo = [55, 53, 50, 48, 46, 43, 41, 39, 36, 34, 32, 29, 27, 25, 22, 20, 18, 15, 13, 11, 8, 6, 4, 3, 2, 1]
  daysAgo.forEach((n, i) => {
    const minutes = 13 + Math.round(i * 0.45) + (i % 3)
    history.push({ id: id++, date: day(n), title: { en: 'Dand–Baithak', hi: 'दंड-बैठक' }, jid: 'desi', minutes, seconds: minutes * 60, kcal: minutes * 5, points: minutes * 10, felt: 'ok' })
  })
  return {
    v: 1, lang, activeId: 'a', premium: null, settings: { voice: false, sound: false, bigText: false },
    profiles: [{
      id: 'a', name: lang === 'hi' ? 'अर्जुन' : 'Arjun', age: 'adult', goal: 'strong', level: 'inter', limits: [], kg: 71, cm: 172, days: 4,
      journeyId: 'desi', progress: { desi: 5 }, completed: [], difficulty: 1.05,
      weights: [[49, 74.2], [35, 73.1], [21, 72.4], [7, 71.6], [1, 71]].map(([n, kg]) => ({ date: day(n), kg })),
      water: { [day(0)]: 5 }, pbs: { nilgiri: 398, aravalli: 471, satpura: 352 }, points: 2740, history,
    }],
  }
}

async function captureRaw(browser, lang) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.emulateMedia({ reducedMotion: 'reduce' })
  await p.clock.install()
  await p.goto(BASE)
  await p.evaluate((s) => { localStorage.kasrat_v1 = JSON.stringify(s) }, seed(lang))
  await p.reload()
  await p.clock.runFor(800)
  const shots = []
  // Screen and switch transitions run on real time, so freeze them before each capture.
  const snap = async () => { await p.clock.runFor(700); await p.waitForTimeout(450); shots.push(await p.screenshot({ animations: 'disabled' })) }
  const T = lang === 'hi'
    ? { start: /कसरत शुरू करें/, begin: 'शुरू करें', short: 'समय कम है', quiet: 'शांत मोड', journeys: 'यात्राएँ', explore: 'खोजें', progress: 'प्रगति' }
    : { start: /Start workout/, begin: 'Start', short: 'Short on time', quiet: 'Quiet mode', journeys: 'Journeys', explore: 'Explore', progress: 'Progress' }

  await snap() // 1 home
  // 2 player: open today's session, start, move into the first working step
  await p.getByRole('button', { name: T.start }).click()
  await p.clock.runFor(500)
  await p.locator('.sticky-cta .btn').click()
  await p.clock.runFor(5600)
  await p.clock.runFor(14000)
  await snap()
  await p.locator('.player .iconbtn').first().click() // close
  await p.clock.runFor(300)
  await p.locator('.sheet .btn.ghost').click() // end
  await p.clock.runFor(500)
  // 3 preview with both options on (shows swapped moves)
  await p.getByText(T.short).click()
  await p.getByText(T.quiet).click()
  await p.evaluate(() => window.scrollTo(0, 0))
  await snap()
  await p.goBack()
  await p.clock.runFor(500)
  // 4 journeys
  await p.locator('.tabbar').getByText(T.journeys).click()
  await snap()
  // 5 peaks
  await p.locator('.tabbar').getByText(T.explore).click()
  await snap()
  // 6 progress
  await p.locator('.tabbar').getByText(T.progress).click()
  await snap()
  await ctx.close()
  return shots
}

async function compose(browser, lang, shots) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  await page.goto(BASE)
  for (let i = 0; i < shots.length; i++) {
    const [title, sub] = CAPTIONS[lang][i]
    const img = 'data:image/png;base64,' + shots[i].toString('base64')
    await page.setContent(`<!doctype html><html lang="${lang}"><head><link rel="stylesheet" href="${BASE}${CSS}">
      <style>
        html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; }
        body { font-family: 'Anek Devanagari Variable', sans-serif; background: linear-gradient(160deg, #fb923c 0%, #ea580c 55%, #c2410c 100%); color: #fff; position: relative; }
        .cap { position: absolute; top: 96px; left: 72px; right: 72px; text-align: center; }
        h1 { font-size: 78px; line-height: 1.08; margin: 0; font-weight: 750; letter-spacing: -0.02em; }
        p { font-size: 38px; margin: 20px 0 0; opacity: 0.9; font-weight: 500; }
        .phone { position: absolute; left: 50%; top: 420px; transform: translateX(-50%); width: 760px; height: 1481px; border-radius: 70px; background: #1c1917; padding: 18px; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.45); }
        .phone img { width: 100%; height: 100%; border-radius: 54px; display: block; object-fit: cover; object-position: top; }
        .glow { position: absolute; width: 900px; height: 900px; right: -300px; top: -300px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%); }
      </style></head><body><div class="glow"></div>
      <div class="cap"><h1>${title}</h1><p>${sub}</p></div>
      <div class="phone"><img src="${img}"></div></body></html>`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(OUT, 'screenshots', lang, `${i + 1}.jpg`), type: 'jpeg', quality: 90 })
  }
  await page.close()
}

async function featureGraphic(browser, homeShot) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } })
  await page.goto(BASE)
  const icon = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, '..', 'public', 'icon.svg')).toString('base64')
  const img = 'data:image/png;base64,' + homeShot.toString('base64')
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${BASE}${CSS}">
    <style>
      html, body { margin: 0; width: 1024px; height: 500px; overflow: hidden; }
      body { font-family: 'Anek Devanagari Variable', sans-serif; background: linear-gradient(135deg, #1c1917, #292524); color: #fff; position: relative; }
      .left { position: absolute; left: 64px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 14px; width: 520px; }
      .brand { display: flex; align-items: center; gap: 18px; }
      .brand img { width: 84px; height: 84px; border-radius: 22px; }
      .brand b { font-size: 64px; font-weight: 750; letter-spacing: -0.02em; }
      .t1 { font-size: 34px; font-weight: 600; margin-top: 10px; }
      .t2 { font-size: 28px; opacity: 0.75; }
      .pills { display: flex; gap: 10px; margin-top: 12px; }
      .pills span { border: 1.5px solid rgba(255,255,255,0.3); border-radius: 999px; padding: 4px 14px; font-size: 20px; font-weight: 600; }
      .phone { position: absolute; right: 70px; top: 46px; width: 300px; height: 584px; border-radius: 40px; background: #0c0a09; padding: 10px; transform: rotate(6deg); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
      .phone img { width: 100%; height: 100%; border-radius: 31px; object-fit: cover; object-position: top; display: block; }
      .glow { position: absolute; right: -120px; top: -160px; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(234,88,12,0.55), transparent 62%); }
    </style></head><body><div class="glow"></div>
    <div class="left">
      <div class="brand"><img src="${icon}"><b>OjasFit</b></div>
      <div class="t1">Your home fitness coach</div>
      <div class="t2">घर पर फ़िटनेस, आपके कोच के साथ</div>
      <div class="pills"><span>No equipment</span><span>हिन्दी · English</span><span>Free</span></div>
    </div>
    <div class="phone"><img src="${img}"></div></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(OUT, 'feature-graphic.png') })
  await page.close()
}

;(async () => {
  const browser = await chromium.launch()
  let enHome
  for (const lang of ['en', 'hi']) {
    const shots = await captureRaw(browser, lang)
    if (lang === 'en') enHome = shots[0]
    await compose(browser, lang, shots)
    console.log(`${lang}: ${shots.length} screenshots`)
  }
  await featureGraphic(browser, enHome)
  console.log('feature graphic done')
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })

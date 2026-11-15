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
    ['Your coach plans every session', 'Built around your goal and your week'],
    ['Train with a giant rep counter', 'Clear cues, timers and voice coaching'],
    ['Adapt any session to your day', 'Quiet mode · small space · 15 minutes · sore'],
    ['Rate it. The coach adjusts', 'Effort and form set your next session'],
    ['Share your result', 'One tap to WhatsApp or Instagram'],
    ['Climb the skill ladders', 'From wall push-ups to pistol squats'],
  ],
  hi: [
    ['आपका कोच हर सेशन बनाता है', 'आपके लक्ष्य और हफ़्ते के हिसाब से'],
    ['बड़े रेप काउंटर के साथ ट्रेनिंग', 'साफ़ निर्देश, टाइमर और आवाज़ वाला कोच'],
    ['हर सेशन को अपने दिन जैसा बनाइए', 'शांत मोड · कम जगह · 15 मिनट · दर्द'],
    ['बताइए कैसा रहा। कोच बदलेगा', 'मेहनत और तरीक़े से अगला सेशन तय होता है'],
    ['अपना नतीजा शेयर कीजिए', 'एक टैप में व्हाट्सऐप या इंस्टाग्राम'],
    ['स्किल की सीढ़ियाँ चढ़िए', 'दीवार पुश-अप से पिस्टल स्क्वैट तक'],
  ],
}

function seed(lang) {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
  const history = []
  const daysAgo = [15, 13, 11, 9, 8, 6, 4, 3, 2, 1]
  daysAgo.forEach((n, i) => {
    const minutes = 15 + (i % 4)
    history.push({ id: i + 1, date: day(n), title: { en: 'Burn Circuit', hi: 'बर्न सर्किट' }, jid: 'shred', format: 'intervals', minutes, seconds: minutes * 60, kcal: minutes * 5, points: minutes * 10, reps: 140 + i * 6, rpe: 3, tech: 1 })
  })
  return {
    v: 2, lang, activeId: 'a', premium: null, settings: { voice: false, sound: false, bigText: false },
    profiles: [{
      id: 'a', name: lang === 'hi' ? 'आयुष' : 'Ayush', goal: 'lose', level: 'inter', limits: [], quiet: false, kg: 71, cm: 172, days: 4,
      journeyId: 'shred', progress: { shred: 9 }, completed: [], volume: 1.08, rest: 45, streaks: {}, tiers: { push: 3, legs: 2, core: 3 },
      weights: [[14, 72.4], [7, 71.6], [1, 71]].map(([n, kg]) => ({ date: day(n), kg })), pbs: { nilgiri: 398, satpura: 352 }, points: 1740, history,
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
  const tab = (n) => p.locator('.tabbar button').nth(n).click()
  const tapDone = async () => { const go = p.locator('.btn-circle.go'); await p.clock.runFor(1500); await go.click(); await p.waitForTimeout(20) }

  await snap() // 1 dashboard
  // 2 player: start today's session and stop on the first rep-counted move of the workout
  await p.locator('.hero-card .btn.lg').click(); await p.clock.runFor(500)
  await p.locator('.sticky-cta .btn').click(); await p.clock.runFor(5600)
  for (let g = 0; g < 80; g++) {
    if ((await p.locator('.player.work .repnum').count()) && !(await p.locator('.repnum small').count()) && (await p.locator('.hud .grow').innerText()).match(/\d/)) break
    await p.clock.runFor(5000); await p.waitForTimeout(20)
  }
  await snap()
  // 3 adapt sheet (from the dashboard)
  await p.locator('.hud .iconbtn').click(); await p.clock.runFor(300)
  await p.locator('.sheet .btn.ghost').click(); await p.clock.runFor(400)
  await p.goBack(); await p.clock.runFor(500)
  await p.locator('.hero-card .btn.ghost').click(); await p.clock.runFor(400)
  await p.locator('.sheet .opt').first().click()
  await p.locator('.sheet .seg button').nth(2).click()
  await p.locator('.sheet .pill').first().click()
  await snap()
  await p.locator('.sheet-bg').click({ position: { x: 5, y: 5 } }); await p.clock.runFor(400)
  // 4 + 5: play a quick Peak through to the rating screen and the recap
  await tab(2); await p.clock.runFor(400)
  await p.locator('.li', { hasText: /Nilgiri|नीलगिरि/ }).click(); await p.clock.runFor(400)
  await p.locator('.sticky-cta .btn').click(); await p.clock.runFor(5600)
  for (let g = 0; g < 400 && !(await p.locator('.seg').count()); g++) {
    const go = p.locator('.btn-circle.go')
    if (/Done|हो गया/.test((await go.getAttribute('aria-label').catch(() => '')) || '')) await tapDone(); else { await p.clock.runFor(5000); await p.waitForTimeout(20) }
  }
  await snap() // 4 rating
  await p.locator('.btn.lg').click(); await p.clock.runFor(3200)
  await snap() // 5 recap
  await p.locator('.btn.ghost').last().click(); await p.clock.runFor(500)
  // 6 skill ladders
  await tab(2); await p.clock.runFor(300)
  await p.locator('.card.tap').first().click()
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
        body { font-family: 'Anek Devanagari Variable', sans-serif; background: linear-gradient(170deg, #12251b 0%, #0c0d10 55%, #0c0d10 100%); color: #fff; position: relative; }
        .cap { position: absolute; top: 96px; left: 72px; right: 72px; text-align: center; }
        h1 { font-size: 74px; line-height: 1.08; margin: 0; font-weight: 750; letter-spacing: -0.02em; }
        p { font-size: 38px; margin: 20px 0 0; opacity: 0.9; font-weight: 500; }
        .phone { position: absolute; left: 50%; top: 420px; transform: translateX(-50%); width: 760px; height: 1481px; border-radius: 70px; background: #2a2e39; padding: 14px; box-shadow: 0 40px 90px -20px rgba(0,230,118,0.25); }
        .phone img { width: 100%; height: 100%; border-radius: 54px; display: block; object-fit: cover; object-position: top; }
        .glow { position: absolute; width: 900px; height: 900px; right: -300px; top: -300px; border-radius: 50%; background: radial-gradient(circle, rgba(0,230,118,0.28), transparent 60%); }
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
      body { font-family: 'Anek Devanagari Variable', sans-serif; background: linear-gradient(135deg, #14161c, #0c0d10); color: #fff; position: relative; }
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
      .glow { position: absolute; right: -120px; top: -160px; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(0,230,118,0.4), transparent 62%); }
    </style></head><body><div class="glow"></div>
    <div class="left">
      <div class="brand"><img src="${icon}"><b>OjasFit</b></div>
      <div class="t1">Your bodyweight coach</div>
      <div class="t2">घर पर ट्रेनिंग, आपके कोच के साथ</div>
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

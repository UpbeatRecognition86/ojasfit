// Renders the PNG icon sizes from the SVG sources. Usage: node scripts/icons.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const root = path.join(__dirname, '..')
;(async () => {
  const b = await chromium.launch(); const p = await b.newPage()
  const jobs = [['public/icon.svg', 'public/icon-192.png', 192, true], ['public/icon.svg', 'public/icon-512.png', 512, true], ['public/icon-maskable.svg', 'public/icon-maskable-512.png', 512, false], ['store/icon-fullbleed.svg', 'public/apple-touch-icon.png', 180, false], ['store/icon-fullbleed.svg', 'store/play-icon-512.png', 512, false]]
  for (const [src, out, size, transparent] of jobs) {
    await p.setViewportSize({ width: size, height: size })
    await p.setContent(`<html><body style="margin:0;background:transparent">${fs.readFileSync(path.join(root, src), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
    await p.screenshot({ path: path.join(root, out), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } })
  }
  await b.close(); console.log('icons written')
})()

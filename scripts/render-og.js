// Regenerates og-image.png from scripts/og-image.html. Dev-only; needs Playwright.
// One-time setup (PowerShell):
//   npm i -g playwright
//   npx playwright install chromium
// Then, each time:
//   $env:NODE_PATH = (npm root -g); node scripts/render-og.js
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(path.join(__dirname, 'og-image.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, '..', 'og-image.png') });
  await browser.close();
  console.log('Wrote og-image.png');
})();

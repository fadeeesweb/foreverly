import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ICON = 'C:\\Users\\IT-PC\\Downloads\\Foreverly\\public\\icons\\icon-192.png';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

await page.setViewport({ width: 1280, height: 880 });
await page.goto(`${BASE}/#/editor/cover`, { waitUntil: 'networkidle0' });

/* live preview dock */
const dockVisible = await page.$eval('.live-preview', (el) => getComputedStyle(el).display !== 'none').catch(() => false);
check('live dock visible at 1280px', dockVisible);
const frameCover = await page.$eval('.live-frame .cover-title', (el) => el.textContent.trim()).catch(() => null);
check('frame shows cover title', Boolean(frameCover), String(frameCover));
const inFrame = await page.evaluate(() => {
  const frame = document.querySelector('.live-frame');
  const t = document.querySelector('.live-frame .cover-title');
  if (!frame || !t) return false;
  const fr = frame.getBoundingClientRect();
  const tr = t.getBoundingClientRect();
  return tr.top >= fr.top - 2 && tr.bottom <= fr.bottom + 2;
});
check('cover title fits inside frame', inFrame);
await page.screenshot({ path: 'shots/live-editor.png' });

/* typing in cover name updates the dock live */
await page.click('#cover-name');
await page.type('#cover-name', 'Aanya');
await new Promise((r) => setTimeout(r, 350));
const eyebrow = await page.$eval('.live-frame .cover-eyebrow', (el) => el.textContent).catch(() => '');
check('dock updates live as you type', eyebrow.includes('Aanya'), eyebrow);

/* crop tool: upload cover bg -> cropper auto-opens */
const [input] = await page.$$('input[type="file"]');
await input.uploadFile(ICON);
await page.waitForSelector('.crop-sheet', { visible: true, timeout: 8000 });
check('cropper opens after upload', true);
await page.screenshot({ path: 'shots/live-cropper.png' });

/* zoom + rotate + apply */
await page.click('.crop-actions .btn-soft'); // rotate
await new Promise((r) => setTimeout(r, 250));
await page.click('.crop-footer .btn-primary');
await new Promise((r) => setTimeout(r, 500));
const sheetGone = await page.$('.crop-sheet') === null;
check('apply crop closes sheet', sheetGone);
const coverImg = await page.$eval('.live-frame .cover-bg', (el) => el.src.startsWith('data:')).catch(() => false);
check('cropped cover image applied to preview', coverImg);

/* reopen crop from existing image */
await page.evaluate(() => document.querySelector('.image-picker-preview .crop-btn')?.scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 300));
await page.click('.image-picker-preview .crop-btn');
await page.waitForSelector('.crop-sheet', { visible: true, timeout: 5000 });
check('re-crop button works', true);
await page.click('.sheet-head .icon-btn'); // close
await new Promise((r) => setTimeout(r, 250));
check('cropper closes via X', (await page.$('.crop-sheet')) === null);

/* memories: single upload opens cropper */
await page.goto(`${BASE}/#/editor/memories`, { waitUntil: 'networkidle0' });
const [memInput] = await page.$$('input[type="file"]');
await memInput.uploadFile(ICON);
await page.waitForSelector('.crop-sheet', { visible: true, timeout: 8000 });
check('memories: cropper opens after adding a photo', true);
await page.screenshot({ path: 'shots/live-cropper-memories.png' });
await page.click('.crop-footer .btn-primary');
await new Promise((r) => setTimeout(r, 500));
const rows = await page.$$eval('.photo-row', (els) => els.length);
check('photo row added after crop apply', rows === 1, `rows=${rows}`);
const cropBtn = await page.$('.photo-row .photo-actions .icon-btn');
check('photo row has crop button', Boolean(cropBtn));
await cropBtn.click();
await page.waitForSelector('.crop-sheet', { visible: true, timeout: 5000 });
check('per-photo crop opens', true);

/* aspect ratio change resizes frame */
const before = await page.$eval('.crop-frame', (el) => el.getBoundingClientRect().width);
await page.click('.crop-aspects .choice:nth-child(4)'); // 16:9
await new Promise((r) => setTimeout(r, 250));
const after = await page.$eval('.crop-frame', (el) => el.getBoundingClientRect().width);
check('aspect ratio changes frame size', after !== before && before > 0, `${before} -> ${after}`);
await page.screenshot({ path: 'shots/live-cropper-aspect.png' });

/* close via Cancel */
await page.click('.crop-footer .btn-ghost');
await new Promise((r) => setTimeout(r, 250));
check('cancel closes cropper', (await page.$('.crop-sheet')) === null);

/* ---------- film strip layout (3 photos) ---------- */
const memInput2 = (await page.$$('input[type=file]'))[0];
await memInput2.uploadFile(ICON, ICON);
await new Promise((r) => setTimeout(r, 1500));
const totalRows = await page.$$eval('.photo-row', (els) => els.length);
check('3 photos in memories', totalRows === 3, `rows=${totalRows}`);
const allChoices = await page.$$('.choice');
for (const c of allChoices) {
  const t = await c.evaluate((el) => el.textContent.trim());
  if (t === 'Film strip') { await c.click(); break; }
}
await new Promise((r) => setTimeout(r, 500));
const filmInfo = await page.evaluate(() => {
  const strip = document.querySelector('.film-strip');
  if (!strip) return null;
  const frames = strip.querySelectorAll('.film-frame');
  return {
    frames: frames.length,
    navs: document.querySelectorAll('.film-nav').length,
    frameW: Math.round(frames[0]?.getBoundingClientRect().width || 0),
    stripW: Math.round(strip.getBoundingClientRect().width)
  };
});
check('film strip renders every photo', filmInfo?.frames === 3, JSON.stringify(filmInfo));
check(
  'two film frames visible side by side',
  Boolean(filmInfo) && filmInfo.frameW * 2 <= filmInfo.stripW + 2,
  `frame=${filmInfo?.frameW} strip=${filmInfo?.stripW}`
);
check('film arrows present', filmInfo?.navs === 2, `navs=${filmInfo?.navs}`);
await page.click('.film-nav.next');
await new Promise((r) => setTimeout(r, 700));
const filmScroll = await page.$eval('.film-strip', (el) => el.scrollLeft);
check('film arrow scrolls the strip', filmScroll > 0, `scrollLeft=${filmScroll}`);
await page.screenshot({ path: 'shots/film-live.png' });

/* ---------- cover text color reflected in live dock ---------- */
await page.goto(`${BASE}/#/editor/cover`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const inputs = document.querySelectorAll('.editor-main input[type="color"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(inputs[2], '#00aa55');
  inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
const liveTitleColor = await page
  .$eval('.live-frame .cover-title', (el) => getComputedStyle(el).color)
  .catch(() => '');
check('live dock shows cover text color', liveTitleColor === 'rgb(0, 170, 85)', liveTitleColor);

/* ---------- custom theme reflected in live dock ---------- */
await page.goto(`${BASE}/#/editor/theme`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
await page.click('.theme-card:nth-child(7)'); // Custom
await new Promise((r) => setTimeout(r, 500));
const hasColorsPanel = await page.evaluate(() =>
  [...document.querySelectorAll('.panel-head h2')].some((h) => h.textContent === 'Your colors')
);
check('custom theme colors panel', hasColorsPanel);
await page.evaluate(() => {
  const inputs = document.querySelectorAll('.editor-main input[type="color"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(inputs[5], '#123456'); // accent
  inputs[5].dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
const liveAccent = await page
  .$eval('.live-frame', (el) => getComputedStyle(el).getPropertyValue('--accent').trim().toLowerCase())
  .catch(() => '');
check('custom accent color applies live', liveAccent === '#123456', liveAccent);
await page.screenshot({ path: 'shots/custom-theme-live.png' });

/* mobile viewport: dock hidden */
await page.setViewport({ width: 390, height: 844 });
await new Promise((r) => setTimeout(r, 350));
const dockMobile = await page.$eval('.live-preview', (el) => getComputedStyle(el).display !== 'none').catch(() => false);
check('dock hidden on mobile', !dockMobile);

/* cropper open at 320px stays inside viewport */
await page.goto(`${BASE}/#/editor/memories`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
await page.setViewport({ width: 320, height: 700 });
await new Promise((r) => setTimeout(r, 300));
await page.click('.photo-row .photo-actions .icon-btn');
await page.waitForSelector('.crop-sheet', { visible: true, timeout: 5000 });
const cropOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow with cropper open (320px)', cropOverflow <= 1, `px=${cropOverflow}`);
await page.screenshot({ path: 'shots/live-cropper-320.png' });
await page.click('.crop-footer .btn-ghost');
await new Promise((r) => setTimeout(r, 250));

/* overflow on mobile still clean */
await page.setViewport({ width: 390, height: 844 });
await new Promise((r) => setTimeout(r, 250));
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow (390px)', overflow <= 1, `px=${overflow}`);

console.log(`\n${pass} passed, ${fail} failed`);
if (errors.length) console.log('Console/page errors:\n' + errors.join('\n'));
await browser.close();
process.exit(fail || errors.length ? 1 : 0);

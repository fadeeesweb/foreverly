import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../shots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars']
});

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
};

const mobile = async (page) => page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const small = async (page) => page.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

/* landing */
const p = await browser.newPage();
await mobile(p);
await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await shot(p, '01-landing-top');
await p.evaluate(() => window.scrollTo(0, 620));
await new Promise((r) => setTimeout(r, 400));
await shot(p, '02-landing-mid');
await small(p);
await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await shot(p, '03-landing-320');

/* editor */
await mobile(p);
await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await p.click('.hero-actions .btn-primary');
await new Promise((r) => setTimeout(r, 600));
await shot(p, '04-editor-cover');
for (const [idx, name] of [[2, 'letter'], [3, 'memories'], [4, 'music'], [5, 'decor'], [6, 'gift'], [7, 'theme']]) {
  await p.click(`.bottom-nav .nav-item:nth-child(${idx})`);
  await new Promise((r) => setTimeout(r, 450));
  await shot(p, `05-editor-${name}`);
}
await p.click('.fab-share');
await new Promise((r) => setTimeout(r, 1800));
await shot(p, '06-editor-share');
await p.click('.sheet-head .icon-btn');
await new Promise((r) => setTimeout(r, 300));
await p.click('.top-actions .top-btn.accent');
await new Promise((r) => setTimeout(r, 900));
await shot(p, '07-editor-preview');

/* recipient: build a rich surprise inline via localStorage then share */
const shareUrl = await p.evaluate(async () => {
  return null;
});

/* recipient using default surprise (no hash) */
const r = await browser.newPage();
await mobile(r);
await r.goto(`${BASE}/surprise.html`, { waitUntil: 'networkidle0' });
await shot(r, '10-recipient-welcome');
await r.click('.welcome-inner .btn-primary');
await new Promise((x) => setTimeout(x, 1500));
await shot(r, '11-recipient-cover');
await r.evaluate(() => document.getElementById('letter').scrollIntoView());
await new Promise((x) => setTimeout(x, 1400));
await shot(r, '12-recipient-letter');
await r.evaluate(() => document.getElementById('gift').scrollIntoView());
await new Promise((x) => setTimeout(x, 1200));
await shot(r, '13-recipient-gift');
await r.click('.gift-closed .btn-primary');
await new Promise((x) => setTimeout(x, 900));
await shot(r, '14-recipient-gift-open');
/* recipient: build a surprise link with a secret message to capture it */
const defaultData = {
  v: 1,
  name: 'For You',
  title: 'For You, Always.',
  subtitle: 'Something I made just for you.',
  theme: 'baby-pink',
  cover: { bgColor: '#ffd9e4', bgImage: '', align: 'center', textSize: 40, overlay: 35, animation: 'soft-rise' },
  letter: {
    title: 'To someone who means more than words can explain...',
    message: 'Every day with you feels like a little gift I never expected to receive.\n\nThank you for the laughter, the quiet moments, and for being the person I always want to tell everything to.',
    signature: 'Always yours',
    align: 'left',
    size: 'md',
    typewriter: true
  },
  photos: [],
  layout: 'polaroid',
  music: { title: '', artist: '', url: '', autoplay: true, loop: true, volume: 0.7 },
  decorations: [],
  gift: { title: 'Dinner is booked', message: 'Saturday, 8pm. Just us.', image: '' },
  secret: { message: 'I would choose you again, every single time.', animation: 'glow' },
  settings: { floating: true, particles: true }
};
const encoded = (() => {
  const deflated = zlib.deflateRawSync(Buffer.from(JSON.stringify(defaultData), 'utf8'));
  const b64 = deflated.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `z.${b64}`;
})();

const s = await browser.newPage();
await mobile(s);
await s.goto(`${BASE}/surprise.html#${encoded}`, { waitUntil: 'networkidle0' });
await s.click('.welcome-inner .btn-primary');
await new Promise((x) => setTimeout(x, 1200));
await s.evaluate(() => document.getElementById('gift')?.scrollIntoView());
await new Promise((x) => setTimeout(x, 1100));
await s.click('.gift-closed .btn-primary');
await new Promise((x) => setTimeout(x, 900));
await shot(s, '13b-recipient-gift-custom');
await s.evaluate(() => document.getElementById('secret')?.scrollIntoView());
await new Promise((x) => setTimeout(x, 1000));
await s.click('.secret-closed .btn-outline');
await new Promise((x) => setTimeout(x, 2600));
await shot(s, '15-recipient-secret');

/* dark theme check */
const t = await browser.newPage();
await mobile(t);
await t.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await t.click('.hero-actions .btn-primary');
await new Promise((x) => setTimeout(x, 500));
await t.click('.bottom-nav .nav-item:nth-child(7)');
await new Promise((x) => setTimeout(x, 450));
await shot(t, '16-editor-themes');
await t.click('.theme-card:nth-child(6)');
await new Promise((x) => setTimeout(x, 350));
await t.click('.top-actions .top-btn.accent');
await new Promise((x) => setTimeout(x, 1200));
await shot(t, '17-recipient-blackpink');

await browser.close();
console.log('done');

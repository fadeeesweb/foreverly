/* eslint-disable no-console */
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';
import zlib from 'zlib';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO = path.resolve(__dirname, '../public/icons/icon-192.png');

const results = [];
const errors = [];

const check = (name, condition, detail = '') => {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 3-second silent 8-bit mono WAV used to test "song from device". */
function makeTinyWav() {
  const sampleRate = 8000;
  const seconds = 3;
  const samples = sampleRate * seconds;
  const data = Buffer.alloc(samples);
  for (let i = 0; i < samples; i += 1) data[i] = Math.round(127 + 50 * Math.sin((i / sampleRate) * 2 * Math.PI * 440));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

async function setInput(page, selector, value) {
  await page.evaluate(
    (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`missing input ${sel}`);
      const proto =
        el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : el.tagName === 'SELECT' ? HTMLSelectElement : HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    selector,
    value
  );
}

function decodeHash(hash) {
  const marker = hash.slice(0, 2);
  const clean = hash.slice(2).replace(/[^A-Za-z0-9\-_]/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const out = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = alphabet.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  const bytes = Buffer.from(out);
  const json = marker === 'z.' ? zlib.inflateRawSync(bytes).toString('utf8') : bytes.toString('utf8');
  return JSON.parse(json);
}

async function watch(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${label}] console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[${label}] pageerror: ${err.message}`));
}

async function noHorizontalOverflow(page, label) {
  const res = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth
  }));
  check(`no horizontal overflow @ ${label}`, res.scrollW <= res.innerW + 1, `scrollW=${res.scrollW} innerW=${res.innerW}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
});

try {
  /* ---------- landing ---------- */
  const page = await browser.newPage();
  await watch(page, 'landing');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });

  const hero = await page.$eval('h1', (el) => el.textContent);
  check('landing hero headline', /never forget/i.test(hero || ''), hero);
  const cta = await page.$$eval('button', (bs) => bs.map((b) => b.textContent.trim()));
  check('landing has Create a Surprise', cta.some((t) => t.includes('Create a Surprise')), cta.join(' | '));
  await noHorizontalOverflow(page, 'landing 390');

  for (const w of [320, 375, 414, 430]) {
    await page.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
    await sleep(150);
    await noHorizontalOverflow(page, `landing ${w}`);
  }
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  /* ---------- editor ---------- */
  await page.click('.hero-actions .btn-primary');
  await sleep(600);
  check('editor opened', Boolean(await page.$('.editor-root')));
  const navCount = await page.$$eval('.bottom-nav .nav-item', (n) => n.length);
  check('bottom nav has 7 sections', navCount === 7, `found ${navCount}`);
  await noHorizontalOverflow(page, 'editor 390');

  // cover
  await setInput(page, '#cover-name', 'For Sarah');
  await setInput(page, '#cover-title', 'For You, Always.');
  await setInput(page, '#cover-subtitle', 'Something I made just for you.');
  const progress = await page.$eval('.progress-meta', (el) => el.textContent);
  check('progress indicator updates', /cover/i.test(progress) && /\/7/.test(progress) && /done/.test(progress), progress);

  // custom fonts: every editable text gets its own picker
  const fontOptions = await page.$$eval('select[aria-label="Title font"] option', (os) => os.map((o) => o.value));
  check('font picker lists every custom font', fontOptions.length > 80, `fonts=${fontOptions.length - 1}`);
  const chosenFont = fontOptions[1];
  const nameFontOpts = await page.$$eval('select[aria-label="Recipient name font"] option', (os) => os.map((o) => o.value));
  const chosenNameFont = nameFontOpts[2];
  const subtitleFontOpts = await page.$$eval('select[aria-label="Subtitle font"] option', (os) => os.map((o) => o.value));
  const chosenSubtitleFont = subtitleFontOpts[3];
  await setInput(page, 'select[aria-label="Title font"]', chosenFont);
  await setInput(page, 'select[aria-label="Recipient name font"]', chosenNameFont);
  await setInput(page, 'select[aria-label="Subtitle font"]', chosenSubtitleFont);
  await sleep(250);
  const fontChips = await page.$$eval('.font-chip', (els) => els.map((e) => getComputedStyle(e).fontFamily));
  check(
    'font preview chips show the chosen fonts',
    fontChips.length >= 3 && fontChips[0].includes(chosenNameFont) && fontChips[1].includes(chosenFont) && fontChips[2].includes(chosenSubtitleFont),
    `chips=${fontChips.length}`
  );

  // cover text colors
  const colorSet = await page.evaluate(() => {
    const inputs = document.querySelectorAll('.editor-main input[type="color"]');
    if (inputs.length < 3) return -1;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[2], '#ff0000');
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    return inputs.length;
  });
  check('cover color pickers available', colorSet >= 3, `colorInputs=${colorSet}`);

  // letter
  await page.click('.bottom-nav .nav-item:nth-child(2)');
  await sleep(350);
  check('letter panel', (await page.$eval('.panel-head h2', (el) => el.textContent)) === 'Letter');
  const letterLen = await page.$eval('#letter-message', (el) => el.value.length);
  check('letter pre-filled', letterLen > 40, `len=${letterLen}`);
  const letterFontOpts = await page.$$eval('select[aria-label="Message font"] option', (os) => os.map((o) => o.value));
  const chosenLetterFont = letterFontOpts[2];
  const letterTitleFontOpts = await page.$$eval('select[aria-label="Letter title font"] option', (os) => os.map((o) => o.value));
  const chosenLetterTitleFont = letterTitleFontOpts[4];
  const signFontOpts = await page.$$eval('select[aria-label="Signature font"] option', (os) => os.map((o) => o.value));
  const chosenSignFont = signFontOpts[6];
  await setInput(page, 'select[aria-label="Message font"]', chosenLetterFont);
  await setInput(page, 'select[aria-label="Letter title font"]', chosenLetterTitleFont);
  await setInput(page, 'select[aria-label="Signature font"]', chosenSignFont);
  await sleep(200);

  // memories: upload a photo
  await page.click('.bottom-nav .nav-item:nth-child(3)');
  await sleep(350);
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(PHOTO);
  await sleep(1200);
  const photoCount = await page.$$eval('.photo-row', (rows) => rows.length);
  check('photo uploaded + compressed', photoCount === 1, `count=${photoCount}`);
  // a single photo upload opens the cropper - apply the crop
  if (await page.$('.crop-sheet')) {
    await page.click('.crop-footer .btn-primary');
    await sleep(700);
    check('crop sheet applied after upload', (await page.$('.crop-sheet')) === null);
  }
  // reorder
  await page.click('.photo-row .photo-actions button:nth-child(3)');
  // caption
  await page.type('.photo-row .input-sm', 'our first trip');
  const layout = await page.$$eval('.choice', (c) => c.map((b) => b.textContent));
  check('memory layouts offered', ['Polaroid', 'Grid', 'Story', 'Film strip'].every((l) => layout.includes(l)));
  const captionFontOpts = await page.$$eval('select[aria-label="Caption font"] option', (os) => os.map((o) => o.value));
  const chosenCaptionFont = captionFontOpts[3];
  await setInput(page, 'select[aria-label="Caption font"]', chosenCaptionFont);
  await sleep(200);

  // music: pick a song from the device
  await page.click('.bottom-nav .nav-item:nth-child(4)');
  await sleep(350);
  const wavPath = path.join(os.tmpdir(), 'foreverly-test-song.wav');
  fs.writeFileSync(wavPath, makeTinyWav());
  const musicInput = await page.$('input[type="file"]');
  await musicInput.uploadFile(wavPath);
  await sleep(1500);
  const songCard = await page.$('.song-card');
  check('song uploaded from device', Boolean(songCard));
  const trimBlock = await page.$('.trim-block');
  check('trim controls present', Boolean(trimBlock));
  await setInput(page, '#music-title', 'Our Song');
  await setInput(page, '#music-artist', 'Special Memory');

  // stop-at: play first, then trim, then play again - playback must honour the new stop point
  const playBtn = '.inline-actions .btn-ghost';
  await page.click(playBtn);
  await sleep(600);
  const playingLabel = await page.$eval(playBtn, (el) => el.textContent);
  check('editor preview plays the song', /pause/i.test(playingLabel), playingLabel.trim());
  await page.click(playBtn);
  await sleep(300);
  await setInput(page, 'input[aria-label="Stop at"]', '1.5');
  await sleep(250);
  await page.click(playBtn);
  await sleep(2700);
  const trimmedLabel = await page.$eval(playBtn, (el) => el.textContent);
  check('stop-at stops the preview at the trim point', /play preview/i.test(trimmedLabel), trimmedLabel.trim());

  // loop off keeps the recipient stop-at check deterministic
  await page.evaluate(() => {
    const el = document.querySelector('input[aria-label="Keep playing in a loop"]');
    if (el) el.click();
  });
  await sleep(250);

  // decor: same chip can be stacked
  await page.click('.bottom-nav .nav-item:nth-child(5)');
  await sleep(350);
  const decorChips = await page.$$eval('.decor-chip', (c) => c.length);
  check('built-in decorations listed', decorChips === 6, `chips=${decorChips}`);
  await page.click('.decor-chip:nth-child(5)');
  await sleep(200);
  await page.click('.decor-chip:nth-child(5)');
  await sleep(250);
  const decorItems = await page.$$eval('.decor-item', (d) => d.length);
  check('decorations stack (same chip twice)', decorItems === 6, `items=${decorItems}`);
  const chipBadge = await page.$eval('.decor-chip:nth-child(5) .decor-count', (el) => el.textContent).catch(() => '');
  check('count badge shown on chip', chipBadge === '2', `badge=${chipBadge}`);

  // gift + secret
  await page.click('.bottom-nav .nav-item:nth-child(6)');
  await sleep(350);
  await setInput(page, '#gift-title', 'Dinner booked for Friday');
  await setInput(page, '#gift-message', 'Just us, no phones.');
  await setInput(page, '#secret-message', 'I would choose you again, every single time.');
  const giftFontOpts = await page.$$eval('select[aria-label="Gift title font"] option', (os) => os.map((o) => o.value));
  const chosenGiftFont = giftFontOpts[4];
  await setInput(page, 'select[aria-label="Gift title font"]', chosenGiftFont);
  const giftMsgFontOpts = await page.$$eval('select[aria-label="Gift message font"] option', (os) => os.map((o) => o.value));
  const chosenGiftMsgFont = giftMsgFontOpts[7];
  await setInput(page, 'select[aria-label="Gift message font"]', chosenGiftMsgFont);
  const secretFontOpts = await page.$$eval('select[aria-label="Secret font"] option', (os) => os.map((o) => o.value));
  const chosenSecretFont = secretFontOpts[5];
  await setInput(page, 'select[aria-label="Secret font"]', chosenSecretFont);
  await sleep(250);

  // theme
  await page.click('.bottom-nav .nav-item:nth-child(7)');
  await sleep(350);
  const themes = await page.$$eval('.theme-card', (t) => t.length);
  check('7 themes available (6 + custom)', themes === 7, `themes=${themes}`);

  // custom theme builder
  await page.click('.theme-card:nth-child(7)');
  await sleep(350);
  const panelTitles = await page.$$eval('.panel-head h2', (els) => els.map((e) => e.textContent));
  check('custom theme color panel opens', panelTitles.includes('Your colors'), panelTitles.join(' | '));
  const customStyle = await page.evaluate(() => Boolean(document.querySelector('style[data-foreverly-custom-theme]')));
  check('custom theme css injected', customStyle);

  await page.click('.theme-card:nth-child(3)');
  await sleep(200);
  const themeAttr = await page.$eval('.editor-root', (el) => el.getAttribute('data-theme'));
  check('theme applied', themeAttr === 'rose', themeAttr);

  /* ---------- preview ---------- */
  await page.click('.top-actions .top-btn.accent');
  await sleep(1000);
  check('preview mode renders recipient view', Boolean(await page.$('.preview-host .surprise-root')));
  const previewBar = await page.$eval('.preview-bar', (el) => el.textContent);
  check('preview bar with exit', /Preview/i.test(previewBar), previewBar);
  const previewMusic = await page.$('.music-fab');
  check('no music widget in preview', !previewMusic);
  const previewAudio = await page.evaluate(() => {
    const a = window.__foreverlyAudio && window.__foreverlyAudio.el;
    return a ? { paused: a.paused, t: Math.round(a.currentTime * 10) / 10 } : null;
  });
  check('song audible in preview', Boolean(previewAudio) && previewAudio.paused === false, JSON.stringify(previewAudio));
  const scrollArrows = await page.$$eval('.preview-host .scroll-cue, .preview-host .scroll-indicator', (n) => n.length);
  check('single scroll arrow in preview', scrollArrows === 1, `arrows=${scrollArrows}`);
  await noHorizontalOverflow(page, 'preview 390');
  await page.click('.preview-exit');
  await sleep(500);
  check('back to editing works', Boolean(await page.$('.editor-root')));

  /* ---------- share ---------- */
  await page.click('.fab-share');
  await sleep(1500);
  const shareTitle = await page.$eval('.sheet-head h3', (el) => el.textContent);
  check('share screen heading', /ready/i.test(shareTitle), shareTitle);
  const shareUrl = await page.$eval('.link-url', (el) => el.textContent);
  check('share URL generated', /^https?:\/\/.+surprise\.html#(z|j)\./.test(shareUrl || ''), (shareUrl || '').slice(0, 90));
  const payload = decodeHash(shareUrl.split('#')[1]);
  console.log(
    `      payload: name="${payload.name}" decorations=${payload.decorations.length} floating=${payload.settings.floating} photos=${payload.photos.length} theme=${payload.theme} music=${payload.music.fileName ? 'file' : payload.music.url ? 'url' : 'none'} trim=${payload.music.start}-${payload.music.end} themeColors=${payload.themeColors ? 'yes' : 'no'}`
  );
  check(
    'music payload carries file + trim',
    Boolean(payload.music.fileName) && payload.music.end > 0,
    `file=${payload.music.fileName} start=${payload.music.start} end=${payload.music.end}`
  );
  check(
    'per-field cover fonts carried in payload',
    Boolean(payload.cover) &&
      payload.cover.fontTitle === chosenFont &&
      payload.cover.fontEyebrow === chosenNameFont &&
      payload.cover.fontSubtitle === chosenSubtitleFont,
    `${payload.cover?.fontEyebrow || '(empty)'} / ${payload.cover?.fontTitle || '(empty)'} / ${payload.cover?.fontSubtitle || '(empty)'}`
  );
  check(
    'per-field letter + gift + secret fonts carried in payload',
    payload.letter?.fontMessage === chosenLetterFont &&
      payload.letter?.fontTitle === chosenLetterTitleFont &&
      payload.letter?.fontSignature === chosenSignFont &&
      payload.gift?.fontTitle === chosenGiftFont &&
      payload.gift?.fontMessage === chosenGiftMsgFont &&
      payload.secret?.fontMessage === chosenSecretFont &&
      payload.settings?.captionFont === chosenCaptionFont,
    `letter/gift/secret/caption ok`
  );
  const note = await page.$eval('.share-note', (el) => el.textContent);
  check('honesty note about link data', /not a private database record/i.test(note));
  const shareBtns = await page.$$eval('.link-actions .btn', (b) => b.map((x) => x.textContent.trim()));
  check('copy + open buttons', shareBtns.some((t) => t.includes('COPY LINK')) && shareBtns.some((t) => t.includes('Open surprise')), shareBtns.join(' | '));
  await page.click('.link-actions .btn:nth-child(1)');
  await sleep(400);
  const copied = await page.$eval('.link-actions .btn:nth-child(1)', (el) => el.textContent);
  check('copy feedback', /copied/i.test(copied), copied);

  /* ---------- recipient page ---------- */
  const rec = await browser.newPage();
  await watch(rec, 'recipient');
  await rec.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await rec.goto(shareUrl, { waitUntil: 'networkidle0' });
  await sleep(900);
  const welcome = await rec.$eval('.welcome-title', (el) => el.textContent).catch(() => null);
  check('welcome screen', /special for you/i.test(welcome || ''), welcome);
  await noHorizontalOverflow(rec, 'welcome 375');
  await rec.click('.welcome-inner .btn-primary');
  await sleep(1400);

  const recAudioStart = await rec.evaluate(() => {
    const a = window.__foreverlyAudio && window.__foreverlyAudio.el;
    return a ? { paused: a.paused, t: Math.round(a.currentTime * 100) / 100 } : null;
  });
  check(
    'recipient song starts after the welcome tap',
    Boolean(recAudioStart) && recAudioStart.paused === false,
    JSON.stringify(recAudioStart)
  );

  const coverTitle = await rec.$eval('.cover-title', (el) => el.textContent).catch(() => '');
  check('recipient cover title', coverTitle === 'For You, Always.', coverTitle);
  const coverName = await rec.$eval('.cover-eyebrow', (el) => el.textContent).catch(() => '');
  check('recipient cover name', /For Sarah/.test(coverName), coverName);
  const coverTitleColor = await rec.$eval('.cover-title', (el) => getComputedStyle(el).color).catch(() => '');
  check('custom cover text color applied', coverTitleColor === 'rgb(255, 0, 0)', coverTitleColor);
  const coverFontFamily = await rec.$eval('.cover-title', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('recipient uses the chosen cover font', coverFontFamily.includes(chosenFont), coverFontFamily.slice(0, 60));
  const eyebrowFontFamily = await rec.$eval('.cover-eyebrow', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('recipient name font applied', eyebrowFontFamily.includes(chosenNameFont), eyebrowFontFamily.slice(0, 50));
  const coverSubtitleFontFamily = await rec.$eval('.cover-subtitle', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('cover subtitle font applied', coverSubtitleFontFamily.includes(chosenSubtitleFont), coverSubtitleFontFamily.slice(0, 50));
  const chosenFontStatus = await rec.evaluate(async (f) => {
    try {
      await document.fonts.load(`16px "${f}"`);
    } catch (e) {
      /* ignore */
    }
    const face = [...document.fonts].find((x) => x.family.replace(/["']/g, '') === f);
    return face ? face.status : 'missing';
  }, chosenFont);
  check('custom font file loads on the recipient', chosenFontStatus === 'loaded', chosenFontStatus);
  const payloadInfo = await rec.evaluate(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return { hashLen: hash.length, layer: Boolean(document.querySelector('.float-layer')) };
  });
  const floatCount = await rec.$$eval('.float-item', (n) => n.length);
  check(
    'floating decorations active',
    floatCount >= 4,
    `items=${floatCount} layer=${payloadInfo.layer} hashLen=${payloadInfo.hashLen}`
  );
  const letterText = await rec.$eval('.paper-message', (el) => el.textContent).catch(() => '');
  check('letter rendered', (letterText || '').length > 40, `len=${letterText.length}`);
  const paperFontFamily = await rec.$eval('.paper-message', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('letter font applied on recipient', paperFontFamily.includes(chosenLetterFont), paperFontFamily.slice(0, 50));
  const paperTitleFontFamily = await rec.$eval('.paper-title', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('letter title font applied on recipient', paperTitleFontFamily.includes(chosenLetterTitleFont), paperTitleFontFamily.slice(0, 50));
  const signFontFamily = await rec.$eval('.paper-signature', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('signature font applied on recipient', signFontFamily.includes(chosenSignFont), signFontFamily.slice(0, 50));
  const memories = await rec.$$eval('.memory-frame img', (n) => n.length);
  check('memory photo rendered', memories === 1, `count=${memories}`);
  const captionFontFamily = await rec.$eval('.memory-caption', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('caption font applied on recipient', captionFontFamily.includes(chosenCaptionFont), captionFontFamily.slice(0, 50));
  const giftLead = await rec.$eval('.gift-lead', (el) => el.textContent).catch(() => '');
  check('gift closed state', /little something/i.test(giftLead), giftLead);
  await rec.click('.gift-closed .btn-primary');
  await sleep(600);
  const giftTitle = await rec.$eval('.gift-title', (el) => el.textContent).catch(() => '');
  check('gift opens with custom title', /Dinner booked for Friday/.test(giftTitle), giftTitle);
  const giftFontFamily = await rec.$eval('.gift-title', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('gift font applied on recipient', giftFontFamily.includes(chosenGiftFont), giftFontFamily.slice(0, 50));
  const giftMsgFontFamily = await rec.$eval('.gift-message', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('gift message font applied on recipient', giftMsgFontFamily.includes(chosenGiftMsgFont), giftMsgFontFamily.slice(0, 50));
  const secretBtn = await rec.$eval('.secret-closed .btn-outline', (el) => el.textContent).catch(() => '');
  check('secret reveal button', /reveal/i.test(secretBtn || ''), secretBtn);
  await rec.click('.secret-closed .btn-outline');
  await sleep(3000);
  const secretText = await rec.$eval('.secret-message', (el) => el.textContent).catch(() => '');
  check('secret message revealed', /choose you again/.test(secretText), secretText.slice(0, 70));
  const secretFontFamily = await rec.$eval('.secret-message', (el) => getComputedStyle(el).fontFamily).catch(() => '');
  check('secret font applied on recipient', secretFontFamily.includes(chosenSecretFont), secretFontFamily.slice(0, 50));
  const musicFab = await rec.$('.music-fab');
  check('music control present', Boolean(musicFab));
  const recAudioEnd = await rec.evaluate(() => {
    const a = window.__foreverlyAudio && window.__foreverlyAudio.el;
    return a ? { paused: a.paused, t: Math.round(a.currentTime * 100) / 100 } : null;
  });
  check(
    'recipient stops at the stop-at trim',
    Boolean(recAudioEnd) && recAudioEnd.paused === true && recAudioEnd.t < 0.5,
    JSON.stringify(recAudioEnd)
  );
  for (const w of [320, 375, 414, 430]) {
    await rec.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
    await sleep(180);
    await noHorizontalOverflow(rec, `recipient ${w}`);
  }

  /* ---------- invalid link ---------- */
  const bad = await browser.newPage();
  await watch(bad, 'broken');
  await bad.goto(`${BASE}/surprise.html#z.totally-not-valid`, { waitUntil: 'networkidle0' });
  await sleep(700);
  const brokenText = await bad.$eval('.welcome-title', (el) => el.textContent).catch(() => '');
  check('invalid link friendly message', /didn/i.test(brokenText), brokenText);

  /* ---------- empty recipient (preview of default) ---------- */
  const empty = await browser.newPage();
  await watch(empty, 'empty');
  await empty.goto(`${BASE}/surprise.html`, { waitUntil: 'networkidle0' });
  await sleep(700);
  const emptyOk = Boolean(await empty.$('.welcome-title'));
  check('surprise.html without hash renders safely', emptyOk);
} catch (err) {
  check('test run completed without exception', false, err.message);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (errors.length) {
  console.log('\nConsole / page errors:');
  errors.forEach((e) => console.log('  ' + e));
}
process.exit(failed.length || errors.length ? 1 : 0);

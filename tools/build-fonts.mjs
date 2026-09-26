/**
 * FOREVERLY font pipeline.
 *
 * Extracts the designer font zips from the source folder, de-duplicates them
 * (one file per family - preferring woff2, then woff, then the smallest
 * ttf/otf), converts everything to woff2 and writes:
 *
 *   public/fonts/<slug>.woff2   - the web fonts
 *   public/fonts.css            - the @font-face declarations
 *   src/data/fonts.js           - the family list used by the font picker
 *
 * Usage: node tools/build-fonts.mjs ["C:\path\to\font zips"]
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import wawoff2 from 'wawoff2';

const { compress } = wawoff2;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = process.argv[2] || 'C:\\Users\\IT-PC\\Downloads\\all fonts';
const WORK = path.join(os.tmpdir(), 'foreverly-fonts-src');
const OUT_FONTS = path.join(ROOT, 'public', 'fonts');
const OUT_CSS = path.join(ROOT, 'public', 'fonts.css');
const OUT_JS = path.join(ROOT, 'src', 'data', 'fonts.js');

const FONT_EXT = new Set(['.otf', '.ttf', '.woff', '.woff2']);

const STRIPS = [
  /personal\s*use\s*only/gi,
  /personal\s*licen[cs]e/gi,
  /demo/gi,
  /trial/gi,
  /\bfont\b/gi,
  /regular/gi,
  /\bversion\s*\d+(?:\.\d+)*\b/gi,
  /\(\s*\d+\s*\)/g
];

function familyFromFilename(file) {
  let base = path.basename(file).replace(/\.[^.]+$/, '');
  base = base.replace(/[_-]+/g, ' ');
  for (const re of STRIPS) base = base.replace(re, ' ');
  base = base.replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  return base;
}

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'font';

const score = (ext) => (ext === '.woff2' ? 3 : ext === '.woff' ? 2 : 1);

function extractZips() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Font folder not found: ${SOURCE}`);
    process.exit(1);
  }
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  const ps = [
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    `Get-ChildItem -LiteralPath '${SOURCE}' -Filter *.zip | ForEach-Object {`,
    `  $d = Join-Path '${WORK}' $_.BaseName`,
    '  New-Item -ItemType Directory -Force -Path $d | Out-Null',
    '  [System.IO.Compression.ZipFile]::ExtractToDirectory($_.FullName, $d)',
    '}'
  ].join('\n');
  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'pipe' });
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (FONT_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function main() {
  console.log(`Reading fonts from ${SOURCE}`);
  extractZips();

  const files = walk(WORK);
  console.log(`Found ${files.length} font files`);

  /* one winner per family name */
  const chosen = new Map();
  for (const file of files) {
    const family = familyFromFilename(file);
    if (!family) continue;
    const ext = path.extname(file).toLowerCase();
    const size = fs.statSync(file).size;
    const key = family.toLowerCase();
    const prev = chosen.get(key);
    if (!prev) {
      chosen.set(key, { family, file, ext, size });
      continue;
    }
    const betterScore = score(ext) > score(prev.ext);
    const sameScore = score(ext) === score(prev.ext) && size < prev.size;
    if (betterScore || sameScore) chosen.set(key, { family, file, ext, size });
  }

  fs.rmSync(OUT_FONTS, { recursive: true, force: true });
  fs.mkdirSync(OUT_FONTS, { recursive: true });

  const faces = [];
  let keptBytes = 0;
  let converted = 0;
  let copied = 0;
  let failed = 0;

  const usedSlugs = new Set();
  const sorted = [...chosen.values()].sort((a, b) => a.family.localeCompare(b.family));

  for (const item of sorted) {
    let slug = slugify(item.family);
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(item.family)}-${n++}`;
    usedSlugs.add(slug);

    const raw = fs.readFileSync(item.file);
    let ext = item.ext;
    let bytes = raw;

    if (item.ext !== '.woff2') {
      try {
        const woff2 = Buffer.from(await compress(raw));
        if (woff2.length > 0 && woff2.length < raw.length) {
          bytes = woff2;
          ext = '.woff2';
          converted += 1;
        } else {
          copied += 1;
        }
      } catch (e) {
        copied += 1;
        failed += 1;
      }
    } else {
      copied += 1;
    }

    const outFile = `${slug}${ext}`;
    fs.writeFileSync(path.join(OUT_FONTS, outFile), bytes);
    keptBytes += bytes.length;
    const format = ext === '.woff2' ? 'woff2' : ext === '.woff' ? 'woff' : ext === '.otf' ? 'opentype' : 'truetype';
    faces.push({ family: item.family, file: outFile, format, size: bytes.length });
  }

  const css = [
    '/* FOREVERLY custom fonts - generated by tools/build-fonts.mjs - do not edit. */',
    ...faces.map(
      (f) =>
        `@font-face { font-family: '${f.family.replace(/'/g, "\\'")}'; src: url('fonts/${f.file}') format('${f.format}'); font-display: swap; }`
    ),
    ''
  ].join('\n');
  fs.writeFileSync(OUT_CSS, css);

  const js = [
    '/* FOREVERLY custom fonts - generated by tools/build-fonts.mjs - do not edit. */',
    `export const FONT_FAMILIES = ${JSON.stringify(faces.map((f) => f.family), null, 2)};`,
    ''
  ].join('\n');
  fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });
  fs.writeFileSync(OUT_JS, js);

  console.log(`Families: ${faces.length}  (woff2 converted: ${converted}, kept as-is: ${copied}, failed: ${failed})`);
  console.log(`Total size: ${(keptBytes / 1024 / 1024).toFixed(1)} MB -> public/fonts, public/fonts.css, src/data/fonts.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

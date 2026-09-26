# FOREVERLY

A mobile-first digital surprise creator. Build a letter, photos, music, decorations and a hidden gift message in the editor, then share **one link** - the whole surprise travels inside the link itself. No backend, no database, no accounts.

Static React + Vite app, ready for GitHub Pages.

## Features

- **Editor** - seven sections (Cover, Letter, Memories, Music, Decor, Gift, Theme) with progress tracking, auto-save drafts (localStorage) and shareable preview.
- **Photo crop tool** - mobile bottom-sheet cropper with drag to reposition, pinch/wheel/slider zoom, 90° rotation, aspect presets (Original, 1:1, 4:5, 16:9, 9:16) and rule-of-thirds grid. Opens automatically after upload, and from the crop button on any existing image (cover background, memories, custom decorations).
- **Side live preview** - on screens 960px and wider, a sticky phone frame shows exactly what the recipient will see, updating as you type. Hidden on phones so the editor stays focused.
- **Recipient experience** - welcome gate, cover reveal, letter with optional typewriter effect, memories (polaroid / grid / story / film-strip), gift box with confetti, secret message, floating decorations, particles and a music control.
- **Share sheet** - copy link, native share, open-in-new-tab, link-size warning and an honest note about what the link contains.
- **Themes** - six palettes (baby-pink, soft-blush, rose, cream-pink, midnight-rose, black-pink).
- **PWA basics** - web app manifest, service worker for offline shell, 192/512 icons.
- **Privacy** - photos are compressed in the browser and embedded in the link; music stays a plain URL; drafts never leave the device.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
```

## Tests

Puppeteer (uses the locally installed Chrome):

```bash
npm test             # build + full E2E suite (47 checks)
npm run test:features  # crop tool + live preview suite (17 checks)
```

`tests/screenshots.mjs` regenerates the screenshots in `shots/` (gitignored).

## Share format

`surprise.html#DATA` where `DATA` is either

- `z.` + base64url of the surprise JSON deflated with `CompressionStream('deflate-raw')`, or
- `j.` + base64url of the plain JSON (fallback).

Old/corrupt hashes render a friendly "didn't arrive completely" message instead of a broken page.

## Deploy to GitHub Pages

1. Push this folder to a new GitHub repository (the default branch can be `main` or `master`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push/commit - the included workflow (`.github/workflows/deploy.yml`) runs `npm ci`, builds, and publishes `dist/`.
4. Your site appears at `https://<user>.github.io/<repo>/`.

Because the build uses relative paths (`base: './'`), it works from a repository sub-path automatically - no configuration needed.

## Structure

```
index.html            editor / landing entry
surprise.html         recipient entry
src/
  main.jsx            landing + editor router
  editor/             editor shell + 7 sections
  recipient/          SurpriseView (used by recipient AND live preview)
  components/         ImagePicker, ImageCropper, LivePreview, ShareSheet, DraftsSheet, ui
  sharing/codec.js    JSON <-> deflate/base64url link codec
  utils/              image compression/cropping, defaults, drafts storage
  styles/             base, themes, landing, editor, recipient
  animations/         floating decorations, particles, typewriter
public/               icons, decorations, manifest, service worker
tests/                e2e.mjs, shots-live.mjs, screenshots.mjs
```

## Notes

- Anyone with the link can open the surprise - treat it like a private letter.
- Photos in the link are capped (max 1000px, WebP) to keep links shareable; the editor warns when a link gets too large.
- No analytics, no tracking, no server.

const MAX_DIMENSION = 1000;
const SHARE_QUALITY = 0.72;

export const MAX_GIF_BYTES = 4 * 1024 * 1024;

export const isGifFile = (file) =>
  Boolean(file) && (file.type === 'image/gif' || /\.gif$/i.test(file.name || ''));

export const isGifSrc = (src) => /^data:image\/gif\b/i.test(String(src || ''));

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(new Error('could not read file'));
    fr.readAsDataURL(file);
  });

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.createObjectURL(url);
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

const toCanvas = (img, maxDim) => {
  let { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

const canvasToUrl = (canvas, quality, alphaAware) => {
  // WebP keeps alpha and stays small; PNG is the fallback when encoding is unsupported.
  const attempts = alphaAware ? ['image/webp', 'image/png'] : ['image/webp', 'image/jpeg'];
  for (const type of attempts) {
    try {
      const data = canvas.toDataURL(type, quality);
      if (data.startsWith(`data:${type}`)) return data;
    } catch (e) {
      /* try next format */
    }
  }
  return canvas.toDataURL(alphaAware ? 'image/png' : 'image/jpeg', quality);
};

/**
 * Resizes + compresses an uploaded image into a small data URL that is safe
 * to embed inside the shareable surprise link. Animated GIFs skip the canvas
 * re-encode (it would freeze them) and are kept byte-for-byte, up to 4 MB.
 */
export async function compressImage(file, { maxDim = MAX_DIMENSION, quality = SHARE_QUALITY, alpha = false } = {}) {
  if (isGifFile(file)) {
    if (file.size > MAX_GIF_BYTES) throw new Error('gif-too-big');
    const data = await fileToDataUrl(file);
    if (!data.startsWith('data:image/gif')) throw new Error('gif-unreadable');
    return data;
  }
  const img = await loadImage(file);
  const canvas = toCanvas(img, maxDim);
  const data = canvasToUrl(canvas, quality, alpha);
  canvas.width = canvas.height = 0;
  return data;
}

export async function compressPhotos(files, onProgress, onError) {
  const out = [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    if (!f.type.startsWith('image/')) continue;
    try {
      const data = await compressImage(f, { maxDim: 1000, quality: 0.72 });
      out.push({ id: `ph_${Date.now().toString(36)}_${i}`, data, caption: '' });
    } catch (e) {
      if (onError) onError(f, e);
    }
    if (onProgress) onProgress(i + 1, files.length);
  }
  return out;
}

export const bytesLabel = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

export const isProbablyUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

export const isAudioUrl = (value) => /\.(mp3|m4a|aac|ogg|oga|wav|flac)(\?.*)?$/i.test(String(value || '').trim()) || /^https?:\/\//i.test(String(value || '').trim());

/* ---------- crop helpers ---------- */

export function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Returns the image rotated by a multiple of 90 degrees (canvas), or the original when 0°. */
export function rotateSource(img, rot) {
  const angle = ((rot % 360) + 360) % 360;
  if (angle === 0) return img;
  const swap = angle === 90 || angle === 270;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas;
}

/**
 * Crops a source rect out of an image/canvas and returns a compressed data URL.
 * Never upscales beyond the pixels that actually exist in the source.
 */
export function cropToDataUrl(source, { sx, sy, sw, sh, maxDim = 1200, quality = 0.74, alpha = false }) {
  const srcW = source.width || source.naturalWidth;
  const srcH = source.height || source.naturalHeight;
  const cx = Math.max(0, Math.min(srcW, sx));
  const cy = Math.max(0, Math.min(srcH, sy));
  const cw = Math.max(8, Math.min(sw, srcW - cx));
  const ch = Math.max(8, Math.min(sh, srcH - cy));
  const k = Math.min(1, maxDim / Math.max(cw, ch));
  const outW = Math.max(8, Math.round(cw * k));
  const outH = Math.max(8, Math.round(ch * k));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (alpha) ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(source, cx, cy, cw, ch, 0, 0, outW, outH);
  const data = canvasToUrl(canvas, alpha ? 0.88 : quality, alpha);
  canvas.width = canvas.height = 0;
  return data;
}

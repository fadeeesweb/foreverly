/**
 * Client-side share codec.
 *
 * The surprise is serialised to JSON, optionally deflated with the native
 * CompressionStream API, then base64url encoded and placed in the URL hash.
 * Everything happens in the browser - no server, no database.
 */

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64Url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
    if (b1 === undefined) break;
    out += B64_ALPHABET[((b1 & 15) << 2) | ((b2 || 0) >> 6)];
    if (b2 === undefined) break;
    out += B64_ALPHABET[b2 & 63];
  }
  return out;
}

function base64UrlToBytes(str) {
  const clean = str.replace(/[^A-Za-z0-9\-_]/g, '');
  const lookup = {};
  for (let i = 0; i < B64_ALPHABET.length; i += 1) lookup[B64_ALPHABET[i]] = i;
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const val = lookup[clean[i]];
    if (val === undefined) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

function deflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined') return Promise.resolve(null);
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Response(stream).arrayBuffer().then((buf) => new Uint8Array(buf)).catch(() => null);
  } catch (e) {
    return Promise.resolve(null);
  }
}

function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') return Promise.resolve(null);
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).arrayBuffer().then((buf) => new Uint8Array(buf)).catch(() => null);
  } catch (e) {
    return Promise.resolve(null);
  }
}

const utf8 = (str) => new TextEncoder().encode(str);
const fromUtf8 = (bytes) => new TextDecoder().decode(bytes);

/** Strip editor-only helpers, keep only what the recipient page needs. */
export function toSharePayload(surprise) {
  const clean = {
    v: 1,
    name: surprise.name || '',
    title: surprise.title || '',
    subtitle: surprise.subtitle || '',
    theme: surprise.theme || 'baby-pink',
    themeColors: surprise.themeColors || null,
    cover: surprise.cover || {},
    letter: surprise.letter || {},
    photos: (surprise.photos || []).map((p) => ({ id: p.id, data: p.data, caption: p.caption || '' })),
    layout: surprise.layout || 'polaroid',
    music: {
      title: surprise.music?.title || '',
      artist: surprise.music?.artist || '',
      url: surprise.music?.url || '',
      fileName: surprise.music?.fileName || '',
      autoplay: surprise.music?.autoplay !== false,
      loop: surprise.music?.loop !== false,
      volume: typeof surprise.music?.volume === 'number' ? surprise.music.volume : 0.7,
      start: typeof surprise.music?.start === 'number' ? surprise.music.start : 0,
      end: typeof surprise.music?.end === 'number' ? surprise.music.end : 0
    },
    decorations: (surprise.decorations || []).filter((d) => d.enabled !== false).map((d) => ({
      id: d.id,
      key: d.key,
      name: d.name,
      src: d.src,
      enabled: d.enabled !== false,
      size: d.size,
      opacity: d.opacity,
      rotate: d.rotate,
      animation: d.animation,
      position: d.position,
      delay: d.delay
    })),
    gift: surprise.gift || {},
    secret: surprise.secret || {},
    settings: {
      floating: surprise.settings?.floating !== false,
      particles: surprise.settings?.particles !== false,
      captionFont: surprise.settings?.captionFont || ''
    }
  };
  return clean;
}

export async function encodeSurprise(surprise) {
  const json = JSON.stringify(toSharePayload(surprise));
  const raw = utf8(json);
  const deflated = await deflateRaw(raw);
  if (deflated && deflated.length < raw.length) {
    return `z.${bytesToBase64Url(deflated)}`;
  }
  return `j.${bytesToBase64Url(raw)}`;
}

export async function decodeSurprise(encoded) {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    const marker = encoded.slice(0, 2);
    const body = encoded.slice(2);
    const bytes = base64UrlToBytes(body);
    let json = null;
    if (marker === 'z.') {
      const inflated = await inflateRaw(bytes);
      if (!inflated) return null;
      json = fromUtf8(inflated);
    } else if (marker === 'j.') {
      json = fromUtf8(bytes);
    } else {
      return null;
    }
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || data.v !== 1) return null;
    return data;
  } catch (e) {
    return null;
  }
}

/** Absolute share URL pointing at surprise.html with the encoded payload. */
export async function buildShareUrl(surprise) {
  const encoded = await encodeSurprise(surprise);
  const base = window.location.href.split('#')[0];
  const url = base.replace(/index\.html$/i, '') + 'surprise.html';
  return `${url}#${encoded}`;
}

export function shareLength(url) {
  return url ? url.length : 0;
}

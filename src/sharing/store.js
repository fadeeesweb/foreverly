/**
 * Remote store used to shorten share links.
 *
 * The full payload is written to a Firebase Realtime Database (CORS enabled,
 * public-by-design REST API) and the share link only carries a short record
 * id (…/foreverly/#f.<id>). Only active over https - localhost and file://
 * keep the classic inline link so tests and offline use stay deterministic.
 */

const FIREBASE_DB_URL = 'https://foreverly-share-default-rtdb.firebaseio.com';

const ID_RE = /^[\w-]{1,64}$/;
const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 9;

function dbBase() {
  return FIREBASE_DB_URL.replace(/\/$/, '');
}

function newId() {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < bytes.length; i += 1) id += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return id;
}

export function shortLinksEnabled() {
  return Boolean(FIREBASE_DB_URL) && typeof window !== 'undefined' && window.location.protocol === 'https:';
}

async function putGift(id, payload) {
  const res = await fetch(`${dbBase()}/gifts/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`gift save failed (${res.status})`);
  return id;
}

export async function saveGift(payload) {
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await putGift(newId(), payload);
    } catch (err) {
      lastErr = err;
      if (!/401/.test(String((err && err.message) || ''))) throw err;
    }
  }
  throw lastErr;
}

export async function loadGift(id) {
  if (!ID_RE.test(id)) return null;
  const res = await fetch(`${dbBase()}/gifts/${id}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data !== 'object' || data.v !== 1) return null;
  return data;
}

export async function buildShortShareUrl(payload) {
  const id = await saveGift(payload);
  const base = window.location.href.split('#')[0].replace(/index\.html$/i, '');
  return `${base}#f.${id}`;
}

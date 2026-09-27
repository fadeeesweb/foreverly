/**
 * Remote store used to shorten share links.
 *
 * The full payload is written to a Firebase Realtime Database (CORS enabled,
 * public-by-design REST API) and the share link only carries the record id
 * (surprise.html#f.<id>). Only active over https - localhost and file://
 * keep the classic inline link so tests and offline use stay deterministic.
 */

const FIREBASE_DB_URL = 'https://foreverly-share-default-rtdb.firebaseio.com';

const ID_RE = /^[\w-]{1,64}$/;

function dbBase() {
  return FIREBASE_DB_URL.replace(/\/$/, '');
}

function surpriseBase() {
  const base = window.location.href.split('#')[0];
  return base.replace(/index\.html$/i, '') + 'surprise.html';
}

export function shortLinksEnabled() {
  return Boolean(FIREBASE_DB_URL) && typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export async function saveGift(payload) {
  const res = await fetch(`${dbBase()}/gifts.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`gift save failed (${res.status})`);
  const out = await res.json();
  if (!out || typeof out.name !== 'string' || !ID_RE.test(out.name)) throw new Error('gift id missing');
  return out.name;
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
  return `${surpriseBase()}#f.${id}`;
}

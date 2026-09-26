/**
 * localStorage draft handling.
 * This is device-local storage only - never described as cloud storage.
 */

const CURRENT_KEY = 'foreverly:current:v1';
const DRAFT_INDEX = 'foreverly:drafts:v1';
const PREFS_KEY = 'foreverly:prefs:v1';

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const saveCurrent = (surprise) => {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ surprise, at: Date.now() }));
    return true;
  } catch (e) {
    return false;
  }
};

export const loadCurrent = () => {
  try {
    const parsed = safeParse(localStorage.getItem(CURRENT_KEY), null);
    return parsed && parsed.surprise ? parsed.surprise : null;
  } catch (e) {
    return null;
  }
};

export const listDrafts = () => safeParse(localStorage.getItem(DRAFT_INDEX), []) || [];

export const saveDraft = (surprise, label) => {
  const drafts = listDrafts();
  const id = `draft_${Date.now().toString(36)}`;
  const entry = {
    id,
    label: label || surprise.name || surprise.title || 'Untitled surprise',
    at: Date.now(),
    surprise
  };
  const next = [entry, ...drafts.filter((d) => d.label !== entry.label)].slice(0, 12);
  try {
    localStorage.setItem(DRAFT_INDEX, JSON.stringify(next));
    saveCurrent(surprise);
    return entry;
  } catch (e) {
    return null;
  }
};

export const loadDraft = (id) => {
  const entry = listDrafts().find((d) => d.id === id);
  return entry ? entry.surprise : null;
};

export const deleteDraft = (id) => {
  const next = listDrafts().filter((d) => d.id !== id);
  try {
    localStorage.setItem(DRAFT_INDEX, JSON.stringify(next));
  } catch (e) {
    /* ignore */
  }
  return next;
};

export const clearCurrent = () => {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch (e) {
    /* ignore */
  }
};

export const getPrefs = () => safeParse(localStorage.getItem(PREFS_KEY), {}) || {};

export const setPrefs = (patch) => {
  const next = { ...getPrefs(), ...patch };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch (e) {
    /* ignore */
  }
  return next;
};

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

import React from 'react';

/**
 * Injects the CSS variables for the user-built custom theme.
 * Rendered once per page (editor + recipient) so every
 * [data-theme='custom'] element picks the colors up.
 */
export default function CustomThemeStyle({ colors }) {
  if (!colors || typeof colors !== 'object') return null;
  const c = {
    bg: colors.bg || '#fff5f8',
    bg2: colors.bg2 || '#ffe9f0',
    card: colors.card || '#ffffff',
    text: colors.text || '#3a2430',
    muted: colors.muted || '#8d6f7c',
    accent: colors.accent || '#e0658e',
    accent2: colors.accent2 || '#ff9ebd',
    onAccent: colors.onAccent || '#ffffff'
  };
  const css = `[data-theme='custom']{
--bg:${c.bg};
--bg-2:${c.bg2};
--card:${c.card};
--text:${c.text};
--muted:${c.muted};
--accent:${c.accent};
--accent-2:${c.accent2};
--on-accent:${c.onAccent};
--border:color-mix(in srgb, ${c.accent} 30%, transparent);
--a:${c.accent};
--b:${c.accent2};
--c:${c.bg2};
}`;
  return <style data-foreverly-custom-theme dangerouslySetInnerHTML={{ __html: css }} />;
}

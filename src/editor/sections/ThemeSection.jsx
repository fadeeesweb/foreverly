import React from 'react';
import { Check } from 'lucide-react';
import { Panel, Toggle, Button, ColorField } from '../../components/ui';
import { THEMES, DEFAULT_THEME_COLORS } from '../../utils/defaults';
import FloatingDecor from '../../animations/FloatingDecor';

const COLOR_FIELDS = [
  { key: 'bg', label: 'Background' },
  { key: 'bg2', label: 'Background glow' },
  { key: 'card', label: 'Cards & paper' },
  { key: 'text', label: 'Main text' },
  { key: 'muted', label: 'Soft text' },
  { key: 'accent', label: 'Accent / buttons' },
  { key: 'accent2', label: 'Accent light' },
  { key: 'onAccent', label: 'Text on accent' }
];

export default function ThemeSection({
  value,
  onChange,
  themeColors,
  onThemeColors,
  floating,
  onFloating,
  particles,
  onParticles,
  onShare,
  previewData
}) {
  const pickTheme = (id) => {
    if (id === 'custom' && !themeColors) onThemeColors({ ...DEFAULT_THEME_COLORS });
    onChange(id);
  };

  const setColor = (key, v) => onThemeColors({ ...(themeColors || DEFAULT_THEME_COLORS), [key]: v });

  return (
    <>
      <Panel title="Theme" hint="Six calm palettes, or build your own.">
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-card ${value === t.id ? 'is-active' : ''}`}
              data-theme={t.id === 'custom' ? 'custom' : t.id}
              onClick={() => pickTheme(t.id)}
              aria-pressed={value === t.id}
            >
              <span className="theme-swatches">
                <i className="sw-a" />
                <i className="sw-b" />
                <i className="sw-c" />
              </span>
              <span className="theme-name">{t.name}</span>
              {value === t.id ? <Check className="theme-check" size={15} /> : null}
            </button>
          ))}
        </div>
      </Panel>

      {value === 'custom' ? (
        <Panel title="Your colors" hint="Set the color for every part of the surprise.">
          {COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              value={(themeColors || DEFAULT_THEME_COLORS)[f.key]}
              onChange={(v) => setColor(f.key, v)}
            />
          ))}
        </Panel>
      ) : null}

      <Panel title="Effects" hint="Keep it light so it runs smoothly on any phone.">
        <Toggle label="Floating decorations" checked={floating} onChange={onFloating} />
        <Toggle label="Soft sparkle particles" checked={particles} onChange={onParticles} />
        <div className="theme-live">
          <p className="field-label">Live look</p>
          <div className="theme-live-frame">
            <FloatingDecor decorations={previewData?.decorations || []} enabled={floating} themeId={value} />
            <span className="theme-live-a">Aa</span>
            <span className="theme-live-b">Button</span>
          </div>
        </div>
      </Panel>

      <Panel>
        <Button variant="primary" className="full" onClick={onShare}>
          Finish &amp; get my link
        </Button>
        <p className="field-hint center">
          Everything is stored inside the link you share - no account, no database.
        </p>
      </Panel>
    </>
  );
}

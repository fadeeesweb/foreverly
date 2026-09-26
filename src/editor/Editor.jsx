import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  Gift as GiftIcon,
  Heart,
  Image as ImageIcon,
  Music,
  Palette,
  PenLine,
  Save,
  Sparkles
} from 'lucide-react';
import { SECTION_META, isSectionComplete, defaultSurprise } from '../utils/defaults';
import { saveCurrent, loadCurrent, clearCurrent } from '../storage/drafts';
import CoverSection from './sections/CoverSection';
import LetterSection from './sections/LetterSection';
import MemoriesSection from './sections/MemoriesSection';
import MusicSection from './sections/MusicSection';
import DecorSection from './sections/DecorSection';
import GiftSection from './sections/GiftSection';
import ThemeSection from './sections/ThemeSection';
import ShareSheet from '../components/ShareSheet';
import DraftsSheet from '../components/DraftsSheet';
import LivePreview from '../components/LivePreview';
import SurpriseView from '../recipient/SurpriseView';

const ICONS = {
  Heart,
  PenLine,
  Image: ImageIcon,
  Music,
  Sparkles,
  Gift: GiftIcon,
  Palette
};

const readHashSection = () => {
  const hash = window.location.hash.replace(/^#/, '');
  const match = hash.match(/^\/editor\/([a-z]+)/i);
  if (match) {
    const found = SECTION_META.find((s) => s.id === match[1].toLowerCase());
    if (found) return found.id;
  }
  return 'cover';
};

export default function Editor({ surprise, setSurprise }) {
  const [section, setSection] = useState(readHashSection);
  const [preview, setPreview] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const firstRun = useRef(true);

  const update = useCallback(
    (patch) => setSurprise((prev) => ({ ...prev, ...patch })),
    [setSurprise]
  );

  useEffect(() => {
    const onHash = () => setSection(readHashSection());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    window.location.hash = `/editor/${section}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  useEffect(() => {
    const id = window.setTimeout(() => saveCurrent(surprise), 500);
    return () => window.clearTimeout(id);
  }, [surprise]);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  const completion = useMemo(
    () => SECTION_META.filter((s) => isSectionComplete(surprise, s.id)).length,
    [surprise]
  );

  const startAgain = () => {
    const fresh = defaultSurprise();
    setSurprise(fresh);
    saveCurrent(fresh);
    setShareOpen(false);
    clearCurrent();
    setSection('cover');
    showToast('Fresh canvas ready');
  };

  const renderSection = () => {
    switch (section) {
      case 'cover':
        return <CoverSection surprise={surprise} onChange={setSurprise} />;
      case 'letter':
        return <LetterSection value={surprise.letter} onChange={(letter) => update({ letter })} />;
      case 'memories':
        return (
          <MemoriesSection
            value={surprise}
            photos={surprise.photos}
            layout={surprise.layout}
            onChange={(photos) => update({ photos })}
            onLayout={(layout) => update({ layout, settings: { ...surprise.settings, layout } })}
            onCaptionFont={(captionFont) => update({ settings: { ...surprise.settings, captionFont } })}
          />
        );
      case 'music':
        return <MusicSection value={surprise.music} onChange={(music) => update({ music })} />;
      case 'decor':
        return (
          <DecorSection
            value={surprise.decorations}
            onChange={(decorations) => update({ decorations })}
            floating={surprise.settings.floating}
            onFloating={(v) => update({ settings: { ...surprise.settings, floating: v } })}
          />
        );
      case 'gift':
        return (
          <GiftSection
            gift={surprise.gift}
            secret={surprise.secret}
            onGift={(gift) => update({ gift })}
            onSecret={(secret) => update({ secret })}
          />
        );
      case 'theme':
        return (
          <ThemeSection
            value={surprise.theme}
            onChange={(theme) => update({ theme })}
            themeColors={surprise.themeColors}
            onThemeColors={(themeColors) => update({ themeColors })}
            floating={surprise.settings.floating}
            onFloating={(v) => update({ settings: { ...surprise.settings, floating: v } })}
            particles={surprise.settings.particles}
            onParticles={(v) => update({ settings: { ...surprise.settings, particles: v } })}
            onShare={() => setShareOpen(true)}
            previewData={surprise}
          />
        );
      default:
        return null;
    }
  };

  if (preview) {
    return (
      <div className="preview-host">
        <SurpriseView data={surprise} isPreview onExitPreview={() => setPreview(false)} />
      </div>
    );
  }

  return (
    <div className="editor-root" data-theme={surprise.theme}>
      <header className="top-bar">
        <div className="brand brand-sm">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">FOREVERLY</span>
        </div>
        <div className="top-actions">
          <button type="button" className="top-btn" onClick={() => setDraftsOpen(true)} aria-label="Save draft">
            <Save size={16} />
            <span>Save</span>
          </button>
          <button type="button" className="top-btn accent" onClick={() => setPreview(true)} aria-label="Preview">
            <Eye size={16} />
            <span>Preview</span>
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <div className="editor-col">
          <div className="progress-strip" aria-label={`${completion} of ${SECTION_META.length} sections filled`}>
            <div className="progress-meta">
              <span>{SECTION_META.find((s) => s.id === section)?.label}</span>
              <span>
                {completion}/{SECTION_META.length} done
              </span>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${(completion / SECTION_META.length) * 100}%` }} />
            </div>
          </div>

          <main className="editor-main">{renderSection()}</main>
        </div>

        <LivePreview surprise={surprise} />
      </div>

      <nav className="bottom-nav" aria-label="Editor sections">
        {SECTION_META.map((item) => {
          const Icon = ICONS[item.icon] || Heart;
          const active = section === item.id;
          const done = isSectionComplete(surprise, item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${active ? 'is-active' : ''}`}
              onClick={() => setSection(item.id)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="nav-icon">
                <Icon size={19} strokeWidth={active ? 2 : 1.6} />
                {done ? <span className="nav-dot" aria-hidden="true" /> : null}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" className="fab-share" onClick={() => setShareOpen(true)}>
        <Sparkles size={17} />
        Share
      </button>

      <ShareSheet
        open={shareOpen}
        surprise={surprise}
        onClose={() => setShareOpen(false)}
        onRestart={startAgain}
        onOpenPreview={() => {
          setShareOpen(false);
          setPreview(true);
        }}
      />
      <DraftsSheet
        open={draftsOpen}
        surprise={surprise}
        onClose={() => setDraftsOpen(false)}
        onLoad={(s) => {
          setSurprise(s);
          setDraftsOpen(false);
          showToast('Draft loaded');
        }}
        onToast={showToast}
      />

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export const loadInitialSurprise = () => loadCurrent() || defaultSurprise();

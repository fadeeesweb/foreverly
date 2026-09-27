import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift as GiftIcon,
  Lock,
  Music2,
  Pause,
  Play,
  Sparkles,
  X
} from 'lucide-react';
import { asset, isReducedMotion } from '../utils/helpers';
import { useTypewriter } from '../animations/useTypewriter';
import FloatingDecor from '../animations/FloatingDecor';
import Particles from '../animations/Particles';
import { LETTER_SIZES } from '../utils/defaults';
import '../styles/recipient.css';

const toAsset = (src) => (!src ? '' : /^data:|^(https?:)?\/\//i.test(src) || src.startsWith('blob:') ? src : asset(src));

/* inline style for a chosen custom font, falling back to the theme stack */
const fnt = (fam, fallback = 'var(--serif)') => (fam ? { fontFamily: `"${fam}", ${fallback}` } : {});

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (isReducedMotion() || !('IntersectionObserver' in window)) {
      node.classList.add('is-visible');
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '' }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function Cover({ data, onScrollNext }) {
  const cover = data.cover || {};
  const style = {
    '--cover-color': cover.bgColor || '#ffd9e4',
    '--cover-overlay': `${(cover.overlay ?? 35) / 100}`
  };
  const size = Math.min(52, Math.max(26, cover.textSize || 40));
  return (
    <section
      className={`cover-section anim-${cover.animation || 'soft-rise'}`}
      style={style}
      id="cover"
      aria-label="Cover"
    >
      {cover.bgImage ? <img className="cover-bg" src={toAsset(cover.bgImage)} alt="" aria-hidden="true" /> : null}
      <div className="cover-overlay" aria-hidden="true" />
      <div className={`cover-content align-${cover.align || 'center'}`}>
        {data.name ? (
          <p
            className="cover-eyebrow"
            style={{ ...(cover.eyebColor ? { color: cover.eyebColor } : {}), ...fnt(cover.fontEyebrow) }}
          >
            {data.name}
          </p>
        ) : null}
        <h1
          className="cover-title"
          style={{
            fontSize: `clamp(28px, ${size / 16}rem + 6vw, ${size}px)`,
            ...(cover.titleColor ? { color: cover.titleColor } : {}),
            ...fnt(cover.fontTitle)
          }}
        >
          {data.title || 'For You'}
        </h1>
        {data.subtitle ? (
          <p
            className="cover-subtitle"
            style={{ ...(cover.subtitleColor ? { color: cover.subtitleColor } : {}), ...fnt(cover.fontSubtitle) }}
          >
            {data.subtitle}
          </p>
        ) : null}
        <button type="button" className="scroll-cue" onClick={onScrollNext} aria-label="Scroll to the letter">
          <ChevronDown size={22} strokeWidth={1.6} />
        </button>
      </div>
    </section>
  );
}

function LetterSection({ data, instant = false }) {
  const letter = data.letter || {};
  const sizePx = (LETTER_SIZES.find((s) => s.id === letter.size) || LETTER_SIZES[1]).px;
  const { value, done } = useTypewriter(letter.message, {
    enabled: Boolean(letter.typewriter) && !instant,
    speed: 26
  });
  const showText = letter.typewriter && !instant ? value : letter.message;

  return (
    <section className="section letter-section" id="letter" aria-label="Letter">
      <Reveal>
        <article className={`paper-card align-${letter.align || 'left'}`}>
          <Sparkles className="paper-mark" size={18} strokeWidth={1.5} aria-hidden="true" />
          {letter.title ? (
            <h2
              className="paper-title"
              style={{ ...(letter.titleColor ? { color: letter.titleColor } : {}), ...fnt(letter.fontTitle) }}
            >
              {letter.title}
            </h2>
          ) : (
            <div className="paper-rule" />
          )}
          <p
            className="paper-message"
            style={{
              fontSize: `${sizePx}px`,
              ...(letter.textColor ? { color: letter.textColor } : {}),
              ...fnt(letter.fontMessage)
            }}
          >
            {showText}
            {letter.typewriter && !done ? <span className="caret" aria-hidden="true" /> : null}
          </p>
          {letter.signature ? (
            <p
              className="paper-signature"
              style={{ ...(letter.textColor ? { color: letter.textColor } : {}), ...fnt(letter.fontSignature) }}
            >
              {letter.signature}
            </p>
          ) : null}
        </article>
      </Reveal>
    </section>
  );
}

function MemoriesSection({ data }) {
  const photos = data.photos || [];
  const [index, setIndex] = useState(0);
  const touch = useRef({ x: 0, y: 0 });
  const stripRef = useRef(null);
  const layout = data.layout || data.settings?.layout || 'polaroid';

  useEffect(() => {
    if (index > photos.length - 1) setIndex(Math.max(0, photos.length - 1));
  }, [photos.length, index]);

  if (!photos.length) return null;

  const go = (dir) => setIndex((i) => (i + dir + photos.length) % photos.length);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };

  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  if (layout === 'grid') {
    return (
      <section className="section memories-section" id="memories" aria-label="Memories">
        <Reveal>
          <h2 className="section-heading">Our memories</h2>
          <div className="memory-grid">
            {photos.map((p, i) => (
              <figure className="memory-grid-item" key={p.id || i}>
                <img src={p.data} alt={p.caption || `Memory ${i + 1}`} loading="lazy" decoding="async" />
                {p.caption ? <figcaption style={fnt(data.settings?.captionFont, 'var(--font)')}>{p.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </Reveal>
      </section>
    );
  }

  if (layout === 'film') {
    const scrollFilm = (dir) => {
      const el = stripRef.current;
      if (!el) return;
      const frame = el.querySelector('.film-frame');
      const step = (frame ? frame.getBoundingClientRect().width : el.clientWidth * 0.5) + 12;
      el.scrollBy({ left: dir * step, behavior: isReducedMotion() ? 'auto' : 'smooth' });
    };
    return (
      <section className="section memories-section" id="memories" aria-label="Memories">
        <Reveal>
          <h2 className="section-heading">Our memories</h2>
          <div className="film-wrap">
            <div className="film-strip" ref={stripRef} tabIndex={0} aria-label="Swipe through memories">
              {photos.map((p, i) => (
                <figure className="film-frame" key={p.id || i}>
                  <img src={p.data} alt={p.caption || `Memory ${i + 1}`} loading="lazy" decoding="async" />
                  {p.caption ? <figcaption style={fnt(data.settings?.captionFont, 'var(--font)')}>{p.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
            {photos.length > 1 ? (
              <>
                <button type="button" className="film-nav prev" onClick={() => scrollFilm(-1)} aria-label="Previous photos">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" className="film-nav next" onClick={() => scrollFilm(1)} aria-label="More photos">
                  <ChevronRight size={18} />
                </button>
              </>
            ) : null}
          </div>
          {photos.length > 1 ? <p className="swipe-hint">Swipe the strip or tap the arrows</p> : null}
        </Reveal>
      </section>
    );
  }

  const photo = photos[index];
  return (
    <section className="section memories-section" id="memories" aria-label="Memories">
      <Reveal>
        <h2 className="section-heading">Our memories</h2>
        <div
          className={`memory-stage layout-${layout}`}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="memory-frame" key={photo.id || index}>
            <img src={photo.data} alt={photo.caption || `Memory ${index + 1}`} loading="lazy" decoding="async" />
          </div>
          {photo.caption ? (
            <p className="memory-caption" style={fnt(data.settings?.captionFont, 'var(--font)')}>
              {photo.caption}
            </p>
          ) : null}
          {photos.length > 1 ? (
            <>
              <button type="button" className="mem-nav prev" onClick={() => go(-1)} aria-label="Previous memory">
                <ChevronLeft size={20} />
              </button>
              <button type="button" className="mem-nav next" onClick={() => go(1)} aria-label="Next memory">
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>
        {photos.length > 1 ? (
          <div className="dots" role="tablist" aria-label="Memory position">
            {photos.map((p, i) => (
              <button
                key={p.id || i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Memory ${i + 1}`}
                className={`dot ${i === index ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
        {photos.length > 1 ? <p className="swipe-hint">Swipe to see more</p> : null}
      </Reveal>
    </section>
  );
}

function GiftSection({ data }) {
  const gift = data.gift || {};
  const [open, setOpen] = useState(false);
  if (!gift.title && !gift.message && !gift.image) return null;

  return (
    <section className="section gift-section" id="gift" aria-label="Gift">
      <Reveal>
        {!open ? (
          <div className="gift-closed">
            <div className="gift-box" aria-hidden="true">
              <GiftIcon size={54} strokeWidth={1.2} />
            </div>
            <p className="gift-lead">There&rsquo;s a little something for you.</p>
            <button type="button" className="btn-primary btn-glass" onClick={() => setOpen(true)}>
              Open it
            </button>
          </div>
        ) : (
          <div className="gift-open anim-gift-open">
            {gift.image ? (
              <img className="gift-image" src={toAsset(gift.image)} alt="" loading="lazy" decoding="async" />
            ) : (
              <div className="gift-box open" aria-hidden="true">
                <GiftIcon size={46} strokeWidth={1.2} />
              </div>
            )}
            <p className="gift-eyebrow">A little something for you</p>
            {gift.title ? (
              <h2
                className="gift-title"
                style={{ ...(gift.titleColor ? { color: gift.titleColor } : {}), ...fnt(gift.fontTitle) }}
              >
                {gift.title}
              </h2>
            ) : null}
            {gift.message ? (
              <p className="gift-message" style={{ ...(gift.textColor ? { color: gift.textColor } : {}), ...fnt(gift.fontMessage) }}>
                {gift.message}
              </p>
            ) : null}
          </div>
        )}
      </Reveal>
    </section>
  );
}

function SecretSection({ data }) {
  const secret = data.secret || {};
  const [open, setOpen] = useState(false);
  const anim = secret.animation || 'typewriter';
  const { value, done } = useTypewriter(secret.message, { enabled: open && anim === 'typewriter', speed: 30 });
  if (!secret.message) return null;

  return (
    <section className="section secret-section" id="secret" aria-label="Secret message">
      <Reveal>
        {!open ? (
          <div className="secret-closed">
            <Lock size={22} strokeWidth={1.5} aria-hidden="true" />
            <p>I saved one more message for you.</p>
            <button type="button" className="btn-outline btn-glass" onClick={() => setOpen(true)}>
              Reveal
            </button>
          </div>
        ) : (
          <div className={`secret-open anim-secret-${anim}`} role="status">
            <p className="secret-label">One more thing...</p>
            <p
              className="secret-message"
              style={{ ...(secret.textColor ? { color: secret.textColor } : {}), ...fnt(secret.fontMessage) }}
            >
              {anim === 'typewriter' ? value : secret.message}
              {anim === 'typewriter' && !done ? <span className="caret" aria-hidden="true" /> : null}
            </p>
          </div>
        )}
      </Reveal>
    </section>
  );
}

function MusicControl({ data, muted, onToggle, silent = false, preview = false }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const music = data.music || {};
  const url = music.url;
  const start = music.start || 0;
  const end = music.end || 0;
  const loop = music.loop !== false;
  const volume = typeof music.volume === 'number' ? music.volume : 0.7;

  /* the live dock stays silent - no widget, no audio element */
  useEffect(() => {
    if (!url || silent) return undefined;
    const audio = new Audio();
    audio.src = url;
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (end > 0 && audio.currentTime >= end - 0.1) {
        if (loop) {
          audio.currentTime = start;
          audio.play().catch(() => {});
        } else {
          audio.currentTime = start;
          audio.pause();
        }
      }
    };
    const onEnded = () => {
      if (loop) {
        audio.currentTime = start;
        audio.play().catch(() => {});
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [url, silent, start, end, loop, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (start > 0 && audio.currentTime < start) audio.currentTime = start;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  /* preview opens straight into the surprise, so start the song right away -
     the Preview click is the user gesture that unlocks playback */
  useEffect(() => {
    if (!preview || !url || music.autoplay === false) return undefined;
    const t = window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (start > 0) audio.currentTime = start;
      audio.play().catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [preview, url, music.autoplay, start]);

  useEffect(() => {
    if (silent) return undefined;
    window.__foreverlyAudio = {
      get el() {
        return audioRef.current;
      },
      start: () => {
        const audio = audioRef.current;
        if (!audio || music.autoplay === false) return;
        if (start > 0) audio.currentTime = start;
        audio.play().catch(() => {});
      }
    };
    return () => {
      window.__foreverlyAudio = null;
    };
  }, [silent, music.autoplay, start]);

  /* preview hides the widget while the song auto-plays; with autoplay off it
     stays so the song can be tapped */
  const showWidget = !silent && (!preview || music.autoplay === false);
  if (!url || !showWidget) return null;

  return (
    <div className="music-fab-wrap">
      <button
        type="button"
        className="music-fab"
        onClick={toggle}
        aria-label={playing ? 'Pause music' : 'Play music'}
        data-playing={playing}
      >
        {playing ? <Pause size={17} /> : <Play size={17} />}
        <span className="music-fab-text">
          {playing ? (music.title || 'Music') : 'Music'}
        </span>
        <Music2 size={13} className="music-fab-note" aria-hidden="true" />
      </button>
      {playing ? (
        <button type="button" className="music-mute" onClick={onToggle} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
      ) : null}
    </div>
  );
}

export default function SurpriseView({ data, isPreview = false, onExitPreview, live = false }) {
  const [opened, setOpened] = useState(isPreview);
  const [muted, setMuted] = useState(false);
  const coverRef = useRef(null);

  const theme = data.theme || 'baby-pink';
  const chosenFonts = [
    data.cover?.fontEyebrow,
    data.cover?.fontTitle,
    data.cover?.fontSubtitle,
    data.letter?.fontTitle,
    data.letter?.fontMessage,
    data.letter?.fontSignature,
    data.gift?.fontTitle,
    data.gift?.fontMessage,
    data.secret?.fontMessage,
    data.settings?.captionFont
  ];
  const chosenFontsKey = chosenFonts.join('|');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffd9e4');
  }, [theme]);

  /* pull the custom fonts early so text does not flash in the theme font */
  useEffect(() => {
    if (!document.fonts || !document.fonts.load) return;
    chosenFonts
      .filter(Boolean)
      .forEach((f) => document.fonts.load(`16px "${f}"`).catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenFontsKey]);

  const openSurprise = () => {
    setOpened(true);
    if (data.music?.url && data.music?.autoplay !== false) {
      window.setTimeout(() => {
        if (window.__foreverlyAudio) window.__foreverlyAudio.start();
      }, 650);
    }
  };

  const scrollNext = () => {
    const target = document.getElementById('letter');
    if (target) target.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth' });
  };

  const floating = useMemo(() => data.settings?.floating !== false, [data.settings?.floating]);
  const particles = useMemo(() => data.settings?.particles !== false, [data.settings?.particles]);

  if (!opened) {
    return (
      <div className="welcome-screen" data-theme={theme}>
        <Particles enabled />
        <div className="welcome-inner">
          <p className="welcome-eyebrow">Foreverly</p>
          <h1 className="welcome-title">Someone made something special for you.</h1>
          <p className="welcome-sub">Take a breath. It&rsquo;s all yours.</p>
          <button type="button" className="btn-primary btn-lg btn-glass" onClick={openSurprise}>
            Open Your Surprise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="surprise-root" data-theme={theme}>
      <FloatingDecor decorations={data.decorations || []} enabled={floating} themeId={theme} />
      <Particles enabled={particles} />

      {isPreview && !live ? (
        <div className="preview-bar">
          <span>Preview</span>
          <button type="button" onClick={onExitPreview} className="preview-exit">
            <X size={15} /> Back to editing
          </button>
        </div>
      ) : null}

      <main className="surprise-main">
        <div ref={coverRef}>
          <Cover data={data} onScrollNext={scrollNext} />
        </div>
        <LetterSection data={data} instant={live} />
        <MemoriesSection data={data} />
        <GiftSection data={data} />
        <SecretSection data={data} />
        <footer className="surprise-footer">
          <Sparkles size={14} aria-hidden="true" />
          <span>Made with care, just for you.</span>
        </footer>
      </main>

      <MusicControl
        data={data}
        muted={muted}
        onToggle={() => setMuted((m) => !m)}
        silent={live}
        preview={isPreview && !live}
      />
    </div>
  );
}

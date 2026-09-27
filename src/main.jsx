import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Gift,
  Heart,
  Image as ImageIcon,
  Link2,
  Music,
  Palette,
  PenLine,
  Sparkles,
  Lock
} from 'lucide-react';
import Editor from './editor/Editor';
import RecipientApp from './recipient/RecipientApp';
import CustomThemeStyle from './components/CustomThemeStyle';
import { loadCurrent, saveCurrent } from './storage/drafts';
import { defaultSurprise } from './utils/defaults';
import { asset } from './utils/helpers';
import './styles/base.css';
import './styles/themes.css';
import './styles/landing.css';
import './styles/editor.css';

const isEditorRoute = () => window.location.hash.startsWith('#/editor');
const GIFT_HASH = /^#(f|z|j)\./;

function Landing({ onCreate, onHow }) {
  return (
    <div className="landing" data-theme="baby-pink">
      <header className="landing-top">
        <a className="brand" href="#top" aria-label="Foreverly home">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">FOREVERLY</span>
        </a>
        <button type="button" className="top-btn accent" onClick={onCreate}>
          Create
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={13} aria-hidden="true" /> Digital surprise studio
            </p>
            <h1>Create something they&rsquo;ll never forget.</h1>
            <p className="hero-sub">
              Turn your words, memories, music and little surprises into a digital gift made just for them.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={onCreate}>
                Create a Surprise <ArrowRight size={17} />
              </button>
              <button type="button" className="btn btn-outline btn-lg" onClick={onHow}>
                How it works
              </button>
            </div>
          </div>

          <div className="phone" aria-hidden="true">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="mock-cover">
                <img className="mock-bg" src={asset('assets/mock-cover.svg')} alt="" />
                <div className="mock-cover-copy">
                  <span className="mock-eyebrow">For Sarah</span>
                  <strong>For You, Always.</strong>
                  <span className="mock-sub">Something I made just for you.</span>
                </div>
              </div>
              <div className="mock-letter">
                <span className="mock-rule" />
                <p>
                  Every day with you feels like a little gift I never expected to receive...
                </p>
                <span className="mock-sign">Always yours</span>
              </div>
              <div className="mock-row">
                <img src={asset('assets/mock-photo-1.svg')} alt="" />
                <img src={asset('assets/mock-photo-2.svg')} alt="" />
                <img src={asset('assets/mock-photo-3.svg')} alt="" />
              </div>
              <div className="mock-gift">
                <Gift size={16} /> There&rsquo;s a little something for you.
              </div>
              <img className="mock-decor d1" src={asset('decorations/heart.svg')} alt="" />
              <img className="mock-decor d2" src={asset('decorations/sparkle.svg')} alt="" />
              <img className="mock-decor d3" src={asset('decorations/floral.svg')} alt="" />
            </div>
          </div>
        </section>

        <section className="section-block" id="how">
          <h2>How it works</h2>
          <div className="steps">
            <article className="step">
              <span className="step-num">1</span>
              <h3>Build it</h3>
              <p>Add a letter, photos, a song, decorations and a hidden message in a mobile-first editor.</p>
            </article>
            <article className="step">
              <span className="step-num">2</span>
              <h3>Share the link</h3>
              <p>FOREVERLY packs everything into one private link you can copy or send straight from your phone.</p>
            </article>
            <article className="step">
              <span className="step-num">3</span>
              <h3>They open it</h3>
              <p>They tap once, the music starts and the whole surprise unfolds - no app, no account.</p>
            </article>
          </div>
        </section>

        <section className="section-block">
          <h2>Everything in one little gift</h2>
          <div className="feature-grid">
            <article className="feature">
              <PenLine size={18} />
              <h3>Digital letter</h3>
              <p>A handwritten-feel letter with a typewriter reveal.</p>
            </article>
            <article className="feature">
              <ImageIcon size={18} />
              <h3>Memories</h3>
              <p>Polaroid, grid, story or film-strip photo layouts.</p>
            </article>
            <article className="feature">
              <Music size={18} />
              <h3>Music</h3>
              <p>Your song starts the moment they open the surprise.</p>
            </article>
            <article className="feature">
              <Gift size={18} />
              <h3>Gift &amp; secret</h3>
              <p>A box to open and one last message kept for the end.</p>
            </article>
            <article className="feature">
              <Sparkles size={18} />
              <h3>Decorations</h3>
              <p>Soft floating PNG accents, custom or built-in.</p>
            </article>
            <article className="feature">
              <Palette size={18} />
              <h3>Themes</h3>
              <p>Six elegant palettes from baby pink to midnight rose.</p>
            </article>
          </div>
        </section>

        <section className="section-block note-block">
          <div className="note-card">
            <Link2 size={16} aria-hidden="true" />
            <p>
              Your surprise travels inside one tiny private link - no app, no account, no public profile. Keep the link
              private, because anyone who has it can open the surprise.
            </p>
          </div>
          <div className="note-card">
            <Lock size={16} aria-hidden="true" />
            <p>
              Drafts are saved in your browser only with local storage. They are never uploaded to a server.
            </p>
          </div>
        </section>

        <section className="cta-block">
          <h2>Ready to make their day?</h2>
          <button type="button" className="btn btn-primary btn-lg" onClick={onCreate}>
            Create a Surprise <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <span className="brand brand-sm">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">FOREVERLY</span>
        </span>
        <p>Made for the people who deserve something personal.</p>
      </footer>
    </div>
  );
}

function Root() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [route, setRoute] = useState(isEditorRoute() ? 'editor' : 'landing');
  const [surprise, setSurprise] = useState(() => loadCurrent() || defaultSurprise());

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);
      setRoute(isEditorRoute() ? 'editor' : 'landing');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    saveCurrent(surprise);
  }, [surprise]);

  const goCreate = () => {
    window.location.hash = '/editor/cover';
    setRoute('editor');
  };

  const goHow = () => {
    const el = document.getElementById('how');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (GIFT_HASH.test(hash)) return <RecipientApp />;

  return (
    <>
      <CustomThemeStyle colors={surprise.themeColors} />
      {route === 'editor' ? (
        <Editor surprise={surprise} setSurprise={setSurprise} />
      ) : (
        <Landing onCreate={goCreate} onHow={goHow} />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<Root />);

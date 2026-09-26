import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart } from 'lucide-react';
import { decodeSurprise } from '../sharing/codec';
import SurpriseView from './SurpriseView';
import CustomThemeStyle from '../components/CustomThemeStyle';
import { defaultSurprise } from '../utils/defaults';
import '../styles/base.css';
import '../styles/themes.css';
import '../styles/recipient.css';

function BrokenLink() {
  return (
    <div className="welcome-screen" data-theme="baby-pink">
      <div className="welcome-inner">
        <p className="welcome-eyebrow">Foreverly</p>
        <h1 className="welcome-title">This surprise didn&rsquo;t arrive completely.</h1>
        <p className="welcome-sub">
          The link may have been cut off while sharing. Ask for a fresh link and it will open right away.
        </p>
        <a className="btn-outline" href="./index.html">
          Go to Foreverly
        </a>
      </div>
    </div>
  );
}

function PlaceholderPreview() {
  const data = defaultSurprise();
  data.name = 'For You';
  data.title = 'A little surprise';
  data.subtitle = 'This is how a surprise looks while you are creating one.';
  return <SurpriseView data={data} />;
}

function App() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      setState({ status: 'empty', data: null });
      return () => {
        cancelled = true;
      };
    }
    decodeSurprise(hash)
      .then((data) => {
        if (cancelled) return;
        setState(data ? { status: 'ready', data } : { status: 'broken', data: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'broken', data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="link-loading" data-theme="baby-pink" role="status" aria-live="polite">
        <Heart size={26} strokeWidth={1.4} />
        <span>Opening your surprise...</span>
      </div>
    );
  }
  if (state.status === 'broken') return <BrokenLink />;
  if (state.status === 'empty') return <PlaceholderPreview />;
  return (
    <>
      <CustomThemeStyle colors={state.data.themeColors} />
      <SurpriseView data={state.data} />
    </>
  );
}

const container = document.getElementById('root');
createRoot(container).render(<App />);

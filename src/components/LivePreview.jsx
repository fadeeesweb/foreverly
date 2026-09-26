import { useEffect, useRef, useState } from 'react';
import { MonitorPlay } from 'lucide-react';
import SurpriseView from '../recipient/SurpriseView';

const WIDE = '(min-width: 960px)';

function useIsWide() {
  const [wide, setWide] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(WIDE).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const onChange = () => setWide(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}

/** Sticky phone-frame live preview of the surprise, shown beside the editor on wide screens. */
export default function LivePreview({ surprise }) {
  const wide = useIsWide();
  const frameRef = useRef(null);
  const [frameH, setFrameH] = useState(560);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => setFrameH(Math.round(el.getBoundingClientRect().height)));
      ro.observe(el);
      return () => ro.disconnect();
    }
    const onResize = () => setFrameH(Math.round(el.getBoundingClientRect().height));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [wide]);

  if (!wide) return null;

  return (
    <aside className="live-preview" aria-label="Live preview">
      <p className="live-preview-head">
        <MonitorPlay size={15} aria-hidden="true" />
        <span>Live preview</span>
      </p>
      <div className="live-frame" ref={frameRef} style={{ '--live-h': `${frameH}px` }}>
        <div className="live-scroll">
          <SurpriseView data={surprise} isPreview live />
        </div>
      </div>
      <p className="live-note">Exactly what they will see when they open your link.</p>
    </aside>
  );
}

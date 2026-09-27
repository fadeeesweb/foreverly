import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, RotateCcw, Share2, AlertCircle } from 'lucide-react';
import { Sheet, Button } from './ui';
import { buildShareUrl, toSharePayload } from '../sharing/codec';
import { buildShortShareUrl, shortLinksEnabled } from '../sharing/store';
import { bytesLabel } from '../utils/image';

export default function ShareSheet({ open, surprise, onClose, onRestart, onOpenPreview }) {
  const [url, setUrl] = useState('');
  const [short, setShort] = useState(false);
  const [building, setBuilding] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setBuilding(true);
    setError('');
    setCopied(false);
    setShort(false);
    buildShareUrl(surprise)
      .then(async (inline) => {
        if (!alive) return;
        if (!shortLinksEnabled()) {
          setUrl(inline);
          setBuilding(false);
          setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
          return;
        }
        try {
          const built = await buildShortShareUrl(toSharePayload(surprise));
          if (!alive) return;
          setUrl(built);
          setShort(true);
        } catch (e) {
          await new Promise((r) => setTimeout(r, 1200));
          if (!alive) return;
          try {
            const retry = await buildShortShareUrl(toSharePayload(surprise));
            if (!alive) return;
            setUrl(retry);
            setShort(true);
          } catch (e2) {
            if (!alive) return;
            setUrl(inline);
            setError(
              'The short link service is unreachable right now (network or an ad-blocker), so the full link below was built instead. It works fine, just longer - close and reopen this panel to try again.'
            );
          }
        }
        setBuilding(false);
        setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
      })
      .catch(() => {
        if (!alive) return;
        setError('The link could not be generated.');
        setBuilding(false);
      });
    return () => {
      alive = false;
    };
  }, [open, surprise]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'A surprise for you', text: 'I made something special for you.', url });
    } catch (e) {
      copy();
    }
  };

  const bytes = url.length;
  const heavy = !short && bytes > 1_300_000;

  return (
    <Sheet open={open} title="Your surprise is ready." onClose={onClose}>
      <p className="share-lead">Send this link and only they will see the finished surprise.</p>

      <div className="link-card">
        <div className="link-card-head">
          <span className="link-dot" aria-hidden="true" />
          <span>{short ? 'Short link' : 'Shareable link'}</span>
          <span className="link-size">{building ? '...' : bytesLabel(bytes)}</span>
        </div>
        <p className="link-url">{building ? 'Building your link...' : url}</p>
        <div className="link-actions">
          <Button variant="primary" onClick={copy} disabled={building}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Link copied!' : 'COPY LINK'}
          </Button>
          {canShare ? (
            <Button variant="soft" onClick={share} disabled={building}>
              <Share2 size={16} /> Share
            </Button>
          ) : null}
          <Button
            variant="soft"
            onClick={() => {
              window.open(url, '_blank', 'noopener');
            }}
            disabled={building}
          >
            <ExternalLink size={16} /> Open surprise
          </Button>
        </div>
        <button type="button" className="link-preview-link" onClick={onOpenPreview}>
          Preview it first
        </button>
      </div>

      {error ? (
        <div className="share-warning">
          <AlertCircle size={16} aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {heavy ? (
        <div className="share-warning">
          <AlertCircle size={16} aria-hidden="true" />
          <p>
            This link is quite large ({bytesLabel(bytes)}). Some chat apps cut long links. Try sharing fewer or smaller
            photos, or a shorter song.
          </p>
        </div>
      ) : null}

      <p className="share-note">
        {short
          ? 'This short link stores the surprise data online so it opens instantly, even with photos and music. Anyone with the link can open the surprise, so share it only with the person it was made for.'
          : 'The link contains the surprise data itself, encoded in the address - it is not a private database record. Anyone with the link can open the surprise, so share it only with the person it was made for.'}
      </p>

      <Button variant="ghost" className="full" onClick={onRestart}>
        <RotateCcw size={16} /> START AGAIN
      </Button>
    </Sheet>
  );
}

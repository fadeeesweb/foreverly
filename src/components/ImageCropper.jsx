import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCw, RefreshCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cropToDataUrl, loadImageFromSrc, rotateSource } from '../utils/image';

const PRESETS = [
  { id: 'orig', label: 'Original', value: null },
  { id: '1-1', label: '1:1', value: 1 },
  { id: '4-5', label: '4:5', value: 4 / 5 },
  { id: '16-9', label: '16:9', value: 16 / 9 },
  { id: '9-16', label: '9:16', value: 9 / 16 }
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Mobile-first crop sheet: drag to reposition, pinch/wheel/slider to zoom,
 * rotate and pick an aspect ratio, then export a compressed crop.
 */
export default function ImageCropper({
  open,
  src,
  aspectPresets = PRESETS,
  initialAspect = 'orig',
  alpha = false,
  maxDim = 1200,
  title = 'Crop photo',
  onApply,
  onClose
}) {
  const [img, setImg] = useState(null);
  const [rot, setRot] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(src);
  const [aspectId, setAspectId] = useState(initialAspect);
  const [box, setBox] = useState({ w: 320, h: 320 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const vpRef = useRef(null);
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const aspectValue = useMemo(() => {
    const preset = aspectPresets.find((p) => p.id === aspectId) || aspectPresets[0];
    if (preset.value) return preset.value;
    if (!img) return 1;
    return (img.width || 1) / (img.height || 1);
  }, [aspectId, aspectPresets, img]);

  /* frame size inside the viewport */
  useEffect(() => {
    const measure = () => {
      const el = vpRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const byW = Math.min(w, h * aspectValue);
      setBox({ w: Math.round(byW), h: Math.round(byW / aspectValue) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [aspectValue, open]);

  /* load image + reset transform whenever the source / aspect / rotation changes */
  useEffect(() => {
    if (!open || !src) return undefined;
    let alive = true;
    setBusy(true);
    setError('');
    loadImageFromSrc(src)
      .then((loaded) => {
        if (!alive) return;
        setImg(loaded);
        setPreviewSrc(src);
        setRot(0);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setBusy(false);
      })
      .catch(() => {
        if (!alive) return;
        setError('That image could not be opened.');
        setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [open, src]);

  const srcW = img ? img.width || img.naturalWidth : 1;
  const srcH = img ? img.height || img.naturalHeight : 1;

  const sMin = Math.max(box.w / srcW, box.h / srcH) || 1;
  const scale = sMin * zoom;
  const dispW = srcW * scale;
  const dispH = srcH * scale;
  const maxOffX = Math.max(0, (dispW - box.w) / 2);
  const maxOffY = Math.max(0, (dispH - box.h) / 2);

  const applyOffset = useCallback(
    (x, y) => setOffset({ x: clamp(x, -maxOffX, maxOffX), y: clamp(y, -maxOffY, maxOffY) }),
    [maxOffX, maxOffY]
  );

  const setZoomClamped = useCallback(
    (z) => {
      const next = clamp(z, 1, 4);
      setZoom(next);
      const s2 = sMin * next;
      const w2 = srcW * s2;
      const h2 = srcH * s2;
      const mx = Math.max(0, (w2 - box.w) / 2);
      const my = Math.max(0, (h2 - box.h) / 2);
      setOffset((o) => ({ x: clamp(o.x, -mx, mx), y: clamp(o.y, -my, my) }));
    },
    [sMin, srcW, srcH, box.w, box.h]
  );

  /* keep the image inside the frame when the frame changes size */
  useEffect(() => {
    applyOffset(offset.x, offset.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, maxOffX, maxOffY]);

  /* ---- pointer interactions (pan + pinch) ---- */
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) setZoomClamped(pinch.current.zoom * (dist / pinch.current.dist));
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    if (dx || dy) setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) applyOffset(offset.x, offset.y);
  };

  /* wheel zoom (desktop) */
  useEffect(() => {
    const el = vpRef.current;
    if (!el || !open) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setZoomClamped(zoom * (e.deltaY > 0 ? 0.92 : 1.08));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, zoom, setZoomClamped]);

  const onKeyDown = (e) => {
    const step = 14;
    if (e.key === 'ArrowLeft') applyOffset(offset.x + step, offset.y);
    else if (e.key === 'ArrowRight') applyOffset(offset.x - step, offset.y);
    else if (e.key === 'ArrowUp') applyOffset(offset.x, offset.y + step);
    else if (e.key === 'ArrowDown') applyOffset(offset.x, offset.y - step);
    else if (e.key === '+' || e.key === '=') setZoomClamped(zoom * 1.1);
    else if (e.key === '-') setZoomClamped(zoom * 0.9);
    else return;
    e.preventDefault();
  };

  const rotate = () => {
    if (!img) return;
    const next = (rot + 90) % 360;
    const rotated = rotateSource(img, next);
    const url = rotated === img ? src : rotated.toDataURL(alpha ? 'image/png' : 'image/jpeg', 0.9);
    setRot(next);
    setPreviewSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const apply = () => {
    if (!img) return;
    setBusy(true);
    try {
      const source = rotateSource(img, rot);
      const sw = box.w / scale;
      const sh = box.h / scale;
      const srcX = (dispW / 2 - box.w / 2 - offset.x) / scale;
      const srcY = (dispH / 2 - box.h / 2 - offset.y) / scale;
      const data = cropToDataUrl(source, { sx: srcX, sy: srcY, sw, sh, maxDim, alpha });
      onApply(data);
      setError('');
    } catch (e) {
      setError('Crop failed, try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet crop-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close cropper">
            <X size={17} />
          </button>
        </header>

        <div
          className="crop-viewport"
          ref={vpRef}
          tabIndex={0}
          role="application"
          aria-label="Crop area: drag to reposition, pinch or scroll to zoom"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <div className="crop-frame" ref={frameRef} style={{ width: `${box.w}px`, height: `${box.h}px` }}>
            {img && !busy ? (
              <img
                ref={imgRef}
                className="crop-img"
                src={previewSrc}
                alt=""
                draggable={false}
                style={{
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`
                }}
              />
            ) : (
              <span className="crop-status">{busy ? 'Loading...' : error || 'Image unavailable'}</span>
            )}
            <span className="crop-grid" aria-hidden="true" />
          </div>
        </div>

        <div className="crop-aspects" role="group" aria-label="Aspect ratio">
          {aspectPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`choice ${aspectId === p.id ? 'is-active' : ''}`}
              onClick={() => setAspectId(p.id)}
              aria-pressed={aspectId === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="crop-tools">
          <div className="crop-zoom">
            <button type="button" className="icon-btn" onClick={() => setZoomClamped(zoom * 0.85)} aria-label="Zoom out">
              <ZoomOut size={16} />
            </button>
            <input
              className="slider"
              type="range"
              min="1"
              max="4"
              step="0.01"
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoomClamped(Number(e.target.value))}
            />
            <button type="button" className="icon-btn" onClick={() => setZoomClamped(zoom * 1.18)} aria-label="Zoom in">
              <ZoomIn size={16} />
            </button>
          </div>
          <div className="crop-actions">
            <button type="button" className="btn btn-soft" onClick={rotate} aria-label="Rotate 90 degrees">
              <RotateCw size={16} /> Rotate
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <RefreshCcw size={15} /> Reset
            </button>
          </div>
        </div>

        {error && !busy ? <p className="field-error">{error}</p> : null}

        <div className="crop-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={apply} disabled={busy || !img}>
            <Check size={17} /> Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}

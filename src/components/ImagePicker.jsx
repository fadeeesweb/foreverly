import React, { useRef, useState } from 'react';
import { Crop, ImagePlus, Trash2 } from 'lucide-react';
import { compressImage, isGifFile, isGifSrc } from '../utils/image';
import ImageCropper from './ImageCropper';

export default function ImagePicker({ value, onChange, label = 'Image', alpha = false, hint, maxDim = 900 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState('');

  const gifValue = isGifSrc(value);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const gif = isGifFile(file);
      const data = await compressImage(file, { maxDim, quality: alpha ? 0.84 : 0.74, alpha });
      if (gif) {
        /* keep the animation - the cropper would flatten it to one frame */
        onChange(data);
      } else {
        setCropSrc(data);
      }
    } catch (e) {
      setError(
        e && e.message === 'gif-too-big'
          ? 'That GIF is over 4 MB - please choose a smaller one.'
          : 'Could not read that image. Try another file.'
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="image-picker">
        <button
          type="button"
          className="image-picker-btn"
          onClick={() => inputRef.current && inputRef.current.click()}
          disabled={busy}
        >
          {busy ? (
            <span className="tiny-status">Optimising...</span>
          ) : (
            <>
              <ImagePlus size={17} />
              <span>
                {value ? 'Replace' : 'Upload'} {label.toLowerCase()}
              </span>
            </>
          )}
        </button>
        {value ? (
          <div className="image-picker-preview">
            <img src={value} alt={`${label} preview`} />
            {gifValue ? null : (
              <button
                type="button"
                className="icon-btn crop-btn"
                onClick={() => setCropSrc(value)}
                aria-label={`Crop ${label.toLowerCase()}`}
              >
                <Crop size={14} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => onChange('')}
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files && e.target.files[0])}
        aria-label={`Choose ${label.toLowerCase()}`}
      />

      <ImageCropper
        open={Boolean(cropSrc)}
        src={cropSrc}
        alpha={alpha}
        maxDim={maxDim}
        title={`Crop ${label.toLowerCase()}`}
        onClose={() => setCropSrc('')}
        onApply={(data) => {
          onChange(data);
          setCropSrc('');
        }}
      />
    </div>
  );
}

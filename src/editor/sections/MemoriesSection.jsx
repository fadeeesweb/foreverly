import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Crop, ImagePlus, Trash2 } from 'lucide-react';
import { Panel, Field, ChoiceGroup, Button, FontPicker } from '../../components/ui';
import { compressPhotos } from '../../utils/image';
import ImageCropper from '../../components/ImageCropper';

const LAYOUTS = [
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'grid', label: 'Grid' },
  { id: 'story', label: 'Story' },
  { id: 'film', label: 'Film strip' }
];

export default function MemoriesSection({ value, photos, layout, onChange, onLayout, onCaptionFont }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [crop, setCrop] = useState({ index: -1, src: '' });

  const addFiles = async (files) => {
    if (!files || !files.length) return;
    setBusy(true);
    const added = await compressPhotos(Array.from(files), (i, total) => setProgress(`${i} of ${total}`));
    onChange([...photos, ...added]);
    setBusy(false);
    setProgress('');
    if (inputRef.current) inputRef.current.value = '';
    if (added.length === 1) setCrop({ index: photos.length, src: added[0].data });
  };

  const move = (index, dir) => {
    const next = [...photos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(photos.filter((_, i) => i !== index));
  const caption = (index, text) => {
    const next = photos.map((p, i) => (i === index ? { ...p, caption: text } : p));
    onChange(next);
  };

  return (
    <Panel title="Memories" hint="Photos are optimised for phones before they go into the link.">
      <Button
        variant="soft"
        className="full"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={busy}
      >
        <ImagePlus size={17} />
        {busy ? `Optimising ${progress}` : 'Add photos'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
        aria-label="Add photos"
      />

      <ChoiceGroup label="Layout" value={layout} onChange={onLayout} columns={2} options={LAYOUTS} />

      <FontPicker
        label="Caption font"
        id="caption-font"
        value={(value.settings && value.settings.captionFont) || ''}
        onChange={onCaptionFont}
      />

      {photos.length ? (
        <ul className="photo-list">
          {photos.map((p, i) => (
            <li className="photo-row" key={p.id || i}>
              <img src={p.data} alt={`Memory ${i + 1}`} loading="lazy" />
              <div className="photo-meta">
                <input
                  className="input input-sm"
                  value={p.caption}
                  placeholder="Add a caption"
                  aria-label={`Caption for photo ${i + 1}`}
                  onChange={(e) => caption(i, e.target.value)}
                />
                <div className="photo-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setCrop({ index: i, src: p.data })}
                    aria-label={`Crop photo ${i + 1}`}
                  >
                    <Crop size={15} />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move photo up">
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => move(i, 1)}
                    disabled={i === photos.length - 1}
                    aria-label="Move photo down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => remove(i)} aria-label="Remove photo">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No memories yet. Add a few photos to make it personal.</p>
      )}

      <Field>
        <p className="field-hint">
          Photos stay on this device while you edit. They only travel inside the link you share. Use the crop button on
          any photo to reframe it exactly the way you want.
        </p>
      </Field>

      <ImageCropper
        open={crop.index >= 0 && Boolean(crop.src)}
        src={crop.src}
        title="Crop memory"
        maxDim={1100}
        initialAspect="orig"
        onClose={() => setCrop({ index: -1, src: '' })}
        onApply={(data) => {
          if (crop.index >= 0) onChange(photos.map((p, i) => (i === crop.index ? { ...p, data } : p)));
          setCrop({ index: -1, src: '' });
        }}
      />
    </Panel>
  );
}

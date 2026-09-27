import React, { useRef, useState } from 'react';
import { Crop, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Panel, Field, ChoiceGroup, Slider, Toggle, Button } from '../../components/ui';
import { DECORATIONS, DECOR_ANIMS, makeDecoration } from '../../utils/defaults';
import { compressImage, isGifFile, isGifSrc } from '../../utils/image';
import { asset } from '../../utils/helpers';
import ImageCropper from '../../components/ImageCropper';

export default function DecorSection({ value, onChange, floating, onFloating }) {
  const customInput = useRef(null);
  const [notice, setNotice] = useState('');
  const [crop, setCrop] = useState({ id: null, src: '' });

  const addPreset = (preset) => {
    onChange([...value, makeDecoration({ ...preset, src: preset.src })]);
  };

  const update = (id, patch) => onChange(value.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const remove = (id) => onChange(value.filter((d) => d.id !== id));

  const addCustom = async (file) => {
    if (!file) return;
    try {
      const data = await compressImage(file, { maxDim: 420, quality: 0.86, alpha: true });
      if (isGifFile(file)) {
        /* animated stickers go straight in - cropping would freeze them */
        onChange([...value, makeDecoration({ key: 'custom', name: 'Custom sticker', src: data, size: 44 })]);
        setNotice('');
      } else {
        setCrop({ id: null, src: data });
        setNotice('');
      }
    } catch (e) {
      setNotice(
        e && e.message === 'gif-too-big'
          ? 'That GIF is over 4 MB - please choose a smaller one.'
          : 'That image could not be added.'
      );
    }
    if (customInput.current) customInput.current.value = '';
  };

  const counts = value.reduce((acc, d) => {
    acc[d.key] = (acc[d.key] || 0) + 1;
    return acc;
  }, {});

  return (
    <Panel title="Decorations" hint="Soft floating PNG accents that never cover your text.">
      <Toggle
        label="Floating decorations ON/OFF"
        hint="Show decorations on the recipient's screen."
        checked={floating}
        onChange={onFloating}
      />

      <Field label="Built-in decorations" hint="Tap as many times as you like - every tap adds one more. Remove the ones you don't want below.">
        <div className="decor-grid">
          {DECORATIONS.map((preset) => {
            const count = counts[preset.key] || 0;
            return (
              <button
                key={preset.key}
                type="button"
                className={`decor-chip ${count ? 'is-active' : ''}`}
                onClick={() => addPreset(preset)}
                aria-pressed={count > 0}
                aria-label={`Add ${preset.name}${count ? `, ${count} added` : ''}`}
              >
                <img src={asset(preset.src)} alt="" />
                <span>{preset.name}</span>
                {count ? <span className="decor-count">{count}</span> : null}
              </button>
            );
          })}
        </div>
      </Field>

      <Button variant="soft" className="full" onClick={() => customInput.current && customInput.current.click()}>
        <Plus size={16} /> Upload custom PNG / GIF
      </Button>
      <input
        ref={customInput}
        type="file"
        accept="image/png,image/webp,image/svg+xml,image/gif"
        className="sr-only"
        aria-label="Upload custom decoration"
        onChange={(e) => addCustom(e.target.files && e.target.files[0])}
      />
      {notice ? <p className="field-error">{notice}</p> : null}

      {value.length ? (
        <ul className="decor-list">
          {value.map((d) => (
            <li className="decor-item" key={d.id}>
              <div className="decor-item-head">
                <img
                  src={/^data:|^(https?:)?\/\//i.test(d.src) ? d.src : asset(d.src)}
                  alt=""
                  style={{ width: `${Math.min(36, d.size)}px` }}
                />
                <span className="decor-name">{d.name}</span>
                {d.key === 'custom' && !isGifSrc(d.src) ? (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setCrop({ id: d.id, src: d.src })}
                    aria-label={`Crop ${d.name}`}
                  >
                    <Crop size={15} />
                  </button>
                ) : null}
                <button type="button" className="icon-btn danger" onClick={() => remove(d.id)} aria-label={`Remove ${d.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
              <Slider label="Size" value={d.size} min={16} max={90} suffix="px" onChange={(v) => update(d.id, { size: v })} />
              <Slider label="Opacity" value={Math.round(d.opacity * 100)} min={10} max={100} suffix="%" onChange={(v) => update(d.id, { opacity: v / 100 })} />
              <Slider label="Rotation" value={d.rotate} min={-180} max={180} suffix="°" onChange={(v) => update(d.id, { rotate: v })} />
              <ChoiceGroup
                label="Animation"
                value={d.animation}
                onChange={(v) => update(d.id, { animation: v })}
                columns={3}
                options={DECOR_ANIMS.map((a) => ({ id: a, label: a[0].toUpperCase() + a.slice(1) }))}
              />
              <Slider label="Position left" value={Math.round(d.position?.x ?? 10)} min={2} max={90} suffix="%" onChange={(v) => update(d.id, { position: { ...(d.position || {}), x: v } })} />
              <Slider label="Position top" value={Math.round(d.position?.y ?? 10)} min={2} max={88} suffix="%" onChange={(v) => update(d.id, { position: { ...(d.position || {}), y: v } })} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">
          <Sparkles size={14} aria-hidden="true" /> Add a few decorations to give the page some sparkle.
        </p>
      )}

      <ImageCropper
        open={Boolean(crop.src)}
        src={crop.src}
        alpha
        maxDim={420}
        title="Crop decoration"
        onClose={() => setCrop({ id: null, src: '' })}
        onApply={(data) => {
          if (crop.id) {
            onChange(value.map((d) => (d.id === crop.id ? { ...d, src: data } : d)));
          } else {
            onChange([...value, makeDecoration({ key: 'custom', name: 'Custom sticker', src: data, size: 44 })]);
          }
          setCrop({ id: null, src: '' });
        }}
      />
    </Panel>
  );
}

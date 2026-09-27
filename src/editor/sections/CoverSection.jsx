import React from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { Panel, Field, TextInput, Slider, ChoiceGroup, ColorField, FontPicker } from '../../components/ui';
import ImagePicker from '../../components/ImagePicker';

const SWATCHES = ['#ffd9e4', '#ffeef2', '#f7c8d8', '#e8a8bd', '#f9e7e0', '#fff7f2', '#2a1620', '#120a10'];
const TEXT_SWATCHES = ['#3a2430', '#2a1620', '#ffffff', '#e0658e', '#d14a74', '#ff4d92', '#8d6f7c', '#4a2f31'];

export default function CoverSection({ surprise, onChange }) {
  const cover = surprise.cover;
  const setCover = (patch) => onChange({ ...surprise, cover: { ...cover, ...patch } });
  const setMeta = (patch) => onChange({ ...surprise, ...patch });

  return (
    <Panel title="Cover" hint="The first thing they will see.">
      <Field label="Recipient" htmlFor="cover-name">
        <TextInput
          id="cover-name"
          value={surprise.name}
          onChange={(v) => setMeta({ name: v })}
          placeholder="For Sarah"
        />
      </Field>
      <FontPicker label="Recipient name font" id="cover-name-font" value={cover.fontEyebrow} onChange={(v) => setCover({ fontEyebrow: v })} />

      <Field label="Main title" htmlFor="cover-title">
        <TextInput
          id="cover-title"
          value={surprise.title}
          onChange={(v) => setMeta({ title: v })}
          placeholder="For You, Always."
        />
      </Field>
      <FontPicker label="Title font" id="cover-title-font" value={cover.fontTitle} onChange={(v) => setCover({ fontTitle: v })} />

      <Field label="Subtitle" htmlFor="cover-subtitle">
        <TextInput
          id="cover-subtitle"
          value={surprise.subtitle}
          onChange={(v) => setMeta({ subtitle: v })}
          placeholder="Something I made just for you."
        />
      </Field>
      <FontPicker label="Subtitle font" id="cover-subtitle-font" value={cover.fontSubtitle} onChange={(v) => setCover({ fontSubtitle: v })} />

      <ColorField
        label="Background color"
        value={cover.bgColor}
        onChange={(v) => setCover({ bgColor: v })}
        swatches={SWATCHES}
      />

      <ImagePicker
        label="Background image"
        value={cover.bgImage}
        onChange={(v) => setCover({ bgImage: v })}
        hint="Images are resized and compressed automatically so the shared link stays light. GIFs keep their animation (max 4 MB)."
      />

      <ChoiceGroup
        label="Text alignment"
        value={cover.align}
        onChange={(v) => setCover({ align: v })}
        columns={3}
        options={[
          { id: 'left', label: 'Left', icon: <AlignLeft size={15} /> },
          { id: 'center', label: 'Center', icon: <AlignCenter size={15} /> },
          { id: 'right', label: 'Right', icon: <AlignRight size={15} /> }
        ]}
      />

      <Slider label="Text size" value={cover.textSize} min={26} max={54} suffix="px" onChange={(v) => setCover({ textSize: v })} />
      <Slider label="Overlay strength" value={cover.overlay} min={0} max={80} suffix="%" onChange={(v) => setCover({ overlay: v })} />

      <ColorField
        label="Name color"
        value={cover.eyebColor || '#3a2430'}
        onChange={(v) => setCover({ eyebColor: v })}
        swatches={TEXT_SWATCHES}
      />
      <ColorField
        label="Title color"
        value={cover.titleColor || '#3a2430'}
        onChange={(v) => setCover({ titleColor: v })}
        swatches={TEXT_SWATCHES}
      />
      <ColorField
        label="Subtitle color"
        value={cover.subtitleColor || '#3a2430'}
        onChange={(v) => setCover({ subtitleColor: v })}
        swatches={TEXT_SWATCHES}
      />

      <ChoiceGroup
        label="Entrance animation"
        value={cover.animation}
        onChange={(v) => setCover({ animation: v })}
        columns={2}
        options={[
          { id: 'soft-rise', label: 'Soft rise' },
          { id: 'fade-in', label: 'Fade in' },
          { id: 'zoom', label: 'Gentle zoom' },
          { id: 'none', label: 'None' }
        ]}
      />
    </Panel>
  );
}

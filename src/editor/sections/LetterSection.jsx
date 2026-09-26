import React from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { Panel, Field, TextInput, TextArea, ChoiceGroup, Toggle, ColorField, FontPicker } from '../../components/ui';

const TEXT_SWATCHES = ['#3a2430', '#2a1620', '#ffffff', '#e0658e', '#d14a74', '#ff4d92', '#8d6f7c', '#4a2f31'];

export default function LetterSection({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <Panel title="Letter" hint="A digital letter on premium paper.">
      <Field label="Letter title" htmlFor="letter-title">
        <TextInput
          id="letter-title"
          value={value.title}
          onChange={(v) => set({ title: v })}
          placeholder="To someone who means everything..."
        />
      </Field>
      <FontPicker label="Letter title font" id="letter-title-font" value={value.fontTitle} onChange={(v) => set({ fontTitle: v })} />

      <Field label="Message" htmlFor="letter-message" hint="Write it exactly as you would say it.">
        <TextArea
          id="letter-message"
          value={value.message}
          onChange={(v) => set({ message: v })}
          rows={8}
          placeholder="Start writing..."
        />
      </Field>
      <FontPicker label="Message font" id="letter-message-font" value={value.fontMessage} onChange={(v) => set({ fontMessage: v })} />

      <Field label="Signature" htmlFor="letter-sign">
        <TextInput id="letter-sign" value={value.signature} onChange={(v) => set({ signature: v })} placeholder="Always yours" />
      </Field>
      <FontPicker label="Signature font" id="letter-sign-font" value={value.fontSignature} onChange={(v) => set({ fontSignature: v })} />

      <ChoiceGroup
        label="Alignment"
        value={value.align}
        onChange={(v) => set({ align: v })}
        columns={3}
        options={[
          { id: 'left', label: 'Left', icon: <AlignLeft size={15} /> },
          { id: 'center', label: 'Center', icon: <AlignCenter size={15} /> },
          { id: 'right', label: 'Right', icon: <AlignRight size={15} /> }
        ]}
      />

      <ChoiceGroup
        label="Text size"
        value={value.size}
        onChange={(v) => set({ size: v })}
        columns={3}
        options={[
          { id: 'sm', label: 'Small' },
          { id: 'md', label: 'Medium' },
          { id: 'lg', label: 'Large' }
        ]}
      />

      <Toggle
        label="Typewriter reveal"
        hint="The letter types itself out when they open it."
        checked={Boolean(value.typewriter)}
        onChange={(v) => set({ typewriter: v })}
      />

      <ColorField
        label="Title color"
        value={value.titleColor || '#3a2430'}
        onChange={(v) => set({ titleColor: v })}
        swatches={TEXT_SWATCHES}
      />
      <ColorField
        label="Letter text color"
        value={value.textColor || '#3a2430'}
        onChange={(v) => set({ textColor: v })}
        swatches={TEXT_SWATCHES}
      />
    </Panel>
  );
}

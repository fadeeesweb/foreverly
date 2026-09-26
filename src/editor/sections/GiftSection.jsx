import React from 'react';
import { Lock, Gift as GiftIcon } from 'lucide-react';
import { Panel, Field, TextInput, TextArea, ChoiceGroup, ColorField, FontPicker } from '../../components/ui';
import ImagePicker from '../../components/ImagePicker';
import { SECRET_ANIMS } from '../../utils/defaults';

const TEXT_SWATCHES = ['#3a2430', '#2a1620', '#ffffff', '#e0658e', '#d14a74', '#ff4d92', '#8d6f7c', '#4a2f31'];

export default function GiftSection({ gift, secret, onGift, onSecret }) {
  return (
    <>
      <Panel title="Gift reveal" hint="A little box they open inside the surprise.">
        <div className="mini-badge">
          <GiftIcon size={15} aria-hidden="true" /> There&rsquo;s a little something for you.
        </div>
        <Field label="Gift title" htmlFor="gift-title">
          <TextInput
            id="gift-title"
            value={gift.title}
            onChange={(v) => onGift({ ...gift, title: v })}
            placeholder="A little something for you"
          />
        </Field>
        <FontPicker label="Gift title font" id="gift-title-font" value={gift.fontTitle} onChange={(v) => onGift({ ...gift, fontTitle: v })} />
        <Field label="Gift message" htmlFor="gift-message">
          <TextArea
            id="gift-message"
            value={gift.message}
            onChange={(v) => onGift({ ...gift, message: v })}
            rows={5}
            placeholder="What should they read when the box opens?"
          />
        </Field>
        <FontPicker label="Gift message font" id="gift-message-font" value={gift.fontMessage} onChange={(v) => onGift({ ...gift, fontMessage: v })} />
        <ImagePicker
          label="Gift image"
          value={gift.image}
          onChange={(v) => onGift({ ...gift, image: v })}
          alpha
          hint="A photo, a screenshot of a ticket, a scanned note..."
        />
        <ColorField
          label="Gift title color"
          value={gift.titleColor || '#3a2430'}
          onChange={(v) => onGift({ ...gift, titleColor: v })}
          swatches={TEXT_SWATCHES}
        />
        <ColorField
          label="Gift text color"
          value={gift.textColor || '#3a2430'}
          onChange={(v) => onGift({ ...gift, textColor: v })}
          swatches={TEXT_SWATCHES}
        />
      </Panel>

      <Panel title="One more thing" hint="A secret message revealed at the very end.">
        <div className="mini-badge">
          <Lock size={15} aria-hidden="true" /> I saved one more message for you.
        </div>
        <Field label="Secret message" htmlFor="secret-message">
          <TextArea
            id="secret-message"
            value={secret.message}
            onChange={(v) => onSecret({ ...secret, message: v })}
            rows={5}
            placeholder="The last thing they will read..."
          />
        </Field>
        <FontPicker label="Secret font" id="secret-font" value={secret.fontMessage} onChange={(v) => onSecret({ ...secret, fontMessage: v })} />
        <ChoiceGroup
          label="Reveal animation"
          value={secret.animation}
          onChange={(v) => onSecret({ ...secret, animation: v })}
          columns={2}
          options={SECRET_ANIMS.map((a) => ({
            id: a,
            label: a === 'typewriter' ? 'Typewriter' : a === 'unfold' ? 'Letter unfold' : a === 'glow' ? 'Glow' : 'Fade'
          }))}
        />
        <ColorField
          label="Secret message color"
          value={secret.textColor || '#3a2430'}
          onChange={(v) => onSecret({ ...secret, textColor: v })}
          swatches={TEXT_SWATCHES}
        />
      </Panel>
    </>
  );
}

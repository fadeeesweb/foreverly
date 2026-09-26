import { uid } from './helpers';

export const THEMES = [
  { id: 'baby-pink', name: 'Baby Pink' },
  { id: 'soft-blush', name: 'Soft Blush' },
  { id: 'rose', name: 'Rose' },
  { id: 'cream-pink', name: 'Cream & Pink' },
  { id: 'midnight-rose', name: 'Midnight Rose' },
  { id: 'black-pink', name: 'Black & Pink' },
  { id: 'custom', name: 'Custom' }
];

/** Seed colors for the custom theme builder (baby pink starting point). */
export const DEFAULT_THEME_COLORS = {
  bg: '#fff5f8',
  bg2: '#ffe9f0',
  card: '#ffffff',
  text: '#3a2430',
  muted: '#8d6f7c',
  accent: '#e0658e',
  accent2: '#ff9ebd',
  onAccent: '#ffffff'
};

export const LETTER_SIZES = [
  { id: 'sm', label: 'Small', px: 15 },
  { id: 'md', label: 'Medium', px: 17 },
  { id: 'lg', label: 'Large', px: 20 }
];

export const DECORATIONS = [
  { key: 'heart', name: 'Blush Heart', src: 'decorations/heart.svg' },
  { key: 'star', name: 'Tiny Star', src: 'decorations/star.svg' },
  { key: 'sparkle', name: 'Sparkle', src: 'decorations/sparkle.svg' },
  { key: 'flower', name: 'Soft Flower', src: 'decorations/floral.svg' },
  { key: 'ribbon', name: 'Ribbon', src: 'decorations/ribbon.svg' },
  { key: 'cloud', name: 'Tiny Cloud', src: 'decorations/cloud.svg' }
];

export const DECOR_ANIMS = ['float', 'drift', 'bounce', 'rotate', 'fade', 'none'];

export const SECRET_ANIMS = ['fade', 'typewriter', 'unfold', 'glow'];

export const makeDecoration = (preset) => ({
  id: uid('dec'),
  key: preset.key || 'custom',
  name: preset.name || 'Decoration',
  src: preset.src,
  enabled: true,
  size: preset.size || 34,
  opacity: preset.opacity || 0.75,
  rotate: preset.rotate || 0,
  animation: preset.animation || 'float',
  position: preset.position || {
    x: Math.round(6 + Math.random() * 80),
    y: Math.round(8 + Math.random() * 76)
  },
  delay: Math.round(Math.random() * 4000)
});

export const defaultSurprise = () => ({
  v: 1,
  name: '',
  title: 'For You, Always.',
  subtitle: 'Something I made just for you.',
  theme: 'baby-pink',
  themeColors: null,
  cover: {
    bgColor: '#ffd9e4',
    bgImage: '',
    align: 'center',
    textSize: 40,
    overlay: 35,
    animation: 'soft-rise',
    titleColor: '',
    subtitleColor: '',
    eyebColor: '',
    fontEyebrow: '',
    fontTitle: '',
    fontSubtitle: ''
  },
  letter: {
    title: 'To someone who means more than words can explain...',
    message:
      'Every day with you feels like a little gift I never expected to receive.\n\nThank you for the laughter, the quiet moments, and for being the person I always want to tell everything to.',
    signature: 'Always yours',
    align: 'left',
    size: 'md',
    typewriter: true,
    titleColor: '',
    textColor: '',
    fontTitle: '',
    fontMessage: '',
    fontSignature: ''
  },
  photos: [],
  layout: 'polaroid',
  music: { title: '', artist: '', url: '', fileName: '', autoplay: true, loop: true, volume: 0.7, start: 0, end: 0 },
  decorations: DECORATIONS.slice(0, 4).map((d) =>
    makeDecoration({
      ...d,
      size: 30,
      opacity: 0.7,
      position: { x: 8 + Math.round(Math.random() * 76), y: 10 + Math.round(Math.random() * 70) }
    })
  ),
  gift: { title: 'A little something for you', message: '', image: '', titleColor: '', textColor: '', fontTitle: '', fontMessage: '' },
  secret: { message: '', animation: 'typewriter', textColor: '', fontMessage: '' },
  settings: { floating: true, particles: true, layout: 'polaroid', captionFont: '' }
});

export const SECTION_META = [
  { id: 'cover', label: 'Cover', icon: 'Heart' },
  { id: 'letter', label: 'Letter', icon: 'PenLine' },
  { id: 'memories', label: 'Memories', icon: 'Image' },
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'decor', label: 'Decor', icon: 'Sparkles' },
  { id: 'gift', label: 'Gift', icon: 'Gift' },
  { id: 'theme', label: 'Theme', icon: 'Palette' }
];

export const isSectionComplete = (surprise, id) => {
  switch (id) {
    case 'cover':
      return Boolean(surprise.name || surprise.title);
    case 'letter':
      return Boolean(surprise.letter.message && surprise.letter.message.trim());
    case 'memories':
      return surprise.photos.length > 0;
    case 'music':
      return Boolean((surprise.music.url && surprise.music.url.trim()) || surprise.music.fileName);
    case 'decor':
      return surprise.decorations.some((d) => d.enabled);
    case 'gift':
      return Boolean(surprise.gift.message || surprise.secret.message);
    case 'theme':
      return Boolean(surprise.theme);
    default:
      return false;
  }
};

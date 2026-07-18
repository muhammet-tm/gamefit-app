// Avatar color system.
// Everything renders through CSS variables so one rig serves every
// skin/hair/class combination with zero extra SVG paths.

export const SKIN_TONES = {
  porcelain: { base: '#F2D5B8', shadow: '#DDB894' },
  tan:       { base: '#E0B088', shadow: '#C79268' },
  olive:     { base: '#C68F5E', shadow: '#A8713F' },
  bronze:    { base: '#A66A3F', shadow: '#8A5230' },
  umber:     { base: '#7C4A2D', shadow: '#603520' },
  ebony:     { base: '#573123', shadow: '#3E2118' },
};

// Hair presets: style × color baked into one id (kept flat so the profile
// stores a single string).
export const HAIR_STYLES = ['short', 'fade', 'ponytail', 'curly'];

export const HAIR_COLORS = {
  black:  { base: '#23252E', shadow: '#15161C', light: '#3F4453' },
  brown:  { base: '#5B3A24', shadow: '#402817', light: '#7E5637' },
  blonde: { base: '#C99C55', shadow: '#A57B3A', light: '#E5BE7C' },
  silver: { base: '#B9BFCC', shadow: '#8E95A6', light: '#DEE3EC' },
};

export function hairPreset(hairId) {
  // 'short_brown' -> { style:'short', color:{...} }; tolerant of bad input
  const [style, color] = String(hairId || 'short_black').split('_');
  return {
    style: HAIR_STYLES.includes(style) ? style : 'short',
    color: HAIR_COLORS[color] || HAIR_COLORS.black,
  };
}

// Class identities — gear colors tuned to the Dark RPG Athletic palette.
// c1 = primary gear, c2 = secondary/trim, glow = tier-3+ energy accent.
export const CLASS_COLORS = {
  warrior: { c1: '#B33A2B', c2: '#7A2018', metal: '#8A8F9E', glow: '#FF8C00' },
  mage:    { c1: '#5B3FA8', c2: '#3D2A73', metal: '#B9BFCC', glow: '#9664FF' },
  archer:  { c1: '#3E6B3A', c2: '#284926', metal: '#7A5B3A', glow: '#C8FF00' },
  knight:  { c1: '#3D5A80', c2: '#2A3F5C', metal: '#AEB6C4', glow: '#388BFF' },
  ninja:   { c1: '#2E3340', c2: '#1C202A', metal: '#9AA1B2', glow: '#2DD4BF' },
};

export const AVATAR_CLASSES = ['warrior', 'mage', 'archer', 'knight', 'ninja'];

export const CLASS_LABELS = {
  warrior: 'Warrior', mage: 'Mage', archer: 'Archer', knight: 'Knight', ninja: 'Ninja',
};

export const CLASS_TAGLINES = {
  warrior: 'Raw power. Heavy lifts.',
  mage: 'Mind over muscle.',
  archer: 'Precision & endurance.',
  knight: 'Discipline is armor.',
  ninja: 'Speed in silence.',
};

export const DEFAULT_CONFIG = {
  version: 2,
  class: 'warrior',
  skin_tone: 'tan',
  hair: 'short_black',
};

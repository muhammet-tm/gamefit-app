// Normalize any historical avatar_config into the v2 shape:
//   { version: 2, class, skin_tone, hair }
// Old shape (Base44 era): { gender, skin, outfit, hair }.
import { DEFAULT_CONFIG, AVATAR_CLASSES, SKIN_TONES } from './palettes';

const OUTFIT_TO_CLASS = {
  blue: 'knight',
  black: 'ninja',
  red: 'warrior',
  green: 'archer',
  purple: 'mage',
};

const OLD_SKIN_TO_TONE = {
  light: 'porcelain',
  medium: 'tan',
  dark: 'bronze',
  deepbrown: 'umber',
};

const OLD_HAIR_TO_COLOR = {
  brown: 'brown',
  black: 'black',
  blonde: 'blonde',
  white: 'silver',
  pink: 'silver', // closest available; user can re-pick
};

export function normalizeAvatarConfig(config) {
  if (!config || typeof config !== 'object') return { ...DEFAULT_CONFIG };

  if (config.version === 2) {
    return {
      version: 2,
      class: AVATAR_CLASSES.includes(config.class) ? config.class : DEFAULT_CONFIG.class,
      skin_tone: SKIN_TONES[config.skin_tone] ? config.skin_tone : DEFAULT_CONFIG.skin_tone,
      hair: typeof config.hair === 'string' ? config.hair : DEFAULT_CONFIG.hair,
    };
  }

  // v1 → v2
  const cls = OUTFIT_TO_CLASS[config.outfit] || DEFAULT_CONFIG.class;
  const tone = OLD_SKIN_TO_TONE[config.skin] || DEFAULT_CONFIG.skin_tone;
  const hairColor = OLD_HAIR_TO_COLOR[config.hair] || 'black';
  const style = config.gender === 'female' ? 'ponytail' : 'short';
  return { version: 2, class: cls, skin_tone: tone, hair: `${style}_${hairColor}` };
}

export function isLegacyConfig(config) {
  return !config || typeof config !== 'object' || config.version !== 2;
}

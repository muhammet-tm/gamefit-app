// Normalize any historical avatar_config into the v3 shape:
//   { version: 3, class, body, skin_tone, hair }
// v1 (Base44 era): { gender, skin, outfit, hair }
// v2: { version:2, class, skin_tone, hair }  — male rig only, no body field
import {
  DEFAULT_CONFIG, AVATAR_CLASSES, SKIN_TONES, BODY_TYPES,
  hairStylesFor, hairForBody, DEFAULT_HAIR_BY_BODY,
} from './palettes';

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

// Closest female equivalent when a v2 (male-rig) config moves to the female rig
const MALE_TO_FEMALE_STYLE = {
  short: 'bob',
  fade: 'bob',
  ponytail: 'bun',
  curly: 'wavy',
};

function validHair(hair, body) {
  const [style, color] = String(hair || '').split('_');
  if (hairStylesFor(body).includes(style) && color) return `${style}_${color}`;
  return null;
}

/**
 * @param {object} config stored avatar_config, any version
 * @param {object} [opts] { gender } — profile gender, used only to pick the
 *        body for configs saved before bodies existed.
 */
export function normalizeAvatarConfig(config, opts = {}) {
  const genderBody = opts.gender === 'female' ? 'female' : 'male';

  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_CONFIG, body: genderBody, hair: DEFAULT_HAIR_BY_BODY[genderBody] };
  }

  if (config.version === 3) {
    const body = BODY_TYPES.includes(config.body) ? config.body : genderBody;
    return {
      version: 3,
      class: AVATAR_CLASSES.includes(config.class) ? config.class : DEFAULT_CONFIG.class,
      body,
      skin_tone: SKIN_TONES[config.skin_tone] ? config.skin_tone : DEFAULT_CONFIG.skin_tone,
      hair: validHair(config.hair, body) || DEFAULT_HAIR_BY_BODY[body],
    };
  }

  if (config.version === 2) {
    // v2 predates bodies: fall back to the profile's gender, converting the
    // stored male style to its closest female counterpart if needed.
    const [style, color] = String(config.hair || '').split('_');
    const hairColor = color || 'black';
    const hair = genderBody === 'female'
      ? `${MALE_TO_FEMALE_STYLE[style] || 'long'}_${hairColor}`
      : `${style || 'short'}_${hairColor}`;
    return {
      version: 3,
      class: AVATAR_CLASSES.includes(config.class) ? config.class : DEFAULT_CONFIG.class,
      body: genderBody,
      skin_tone: SKIN_TONES[config.skin_tone] ? config.skin_tone : DEFAULT_CONFIG.skin_tone,
      hair: hairForBody(hair, genderBody),
    };
  }

  // v1 → v3
  const body = config.gender === 'female' ? 'female' : genderBody;
  const cls = OUTFIT_TO_CLASS[config.outfit] || DEFAULT_CONFIG.class;
  const tone = OLD_SKIN_TO_TONE[config.skin] || DEFAULT_CONFIG.skin_tone;
  const hairColor = OLD_HAIR_TO_COLOR[config.hair] || 'black';
  const style = body === 'female' ? 'long' : 'short';
  return { version: 3, class: cls, body, skin_tone: tone, hair: `${style}_${hairColor}` };
}

export function isLegacyConfig(config) {
  return !config || typeof config !== 'object' || config.version !== 3;
}

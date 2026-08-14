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

// Two distinct rigs — each is its own drawn character, not a reskin.
export const BODY_TYPES = ['male', 'female'];

export const BODY_LABELS = { male: 'Male', female: 'Female' };

// Hair presets: style × color baked into one id (kept flat so the profile
// stores a single string). Styles are per body: each rig has its own skull
// shape and hairline, so a style drawn for one does not fit the other.
export const HAIR_STYLES_BY_BODY = {
  male: ['short', 'fade', 'ponytail', 'curly'],
  female: ['long', 'bob', 'braid', 'bun', 'wavy'],
};

export const DEFAULT_HAIR_BY_BODY = { male: 'short_black', female: 'long_black' };

export function hairStylesFor(body) {
  return HAIR_STYLES_BY_BODY[body] || HAIR_STYLES_BY_BODY.male;
}

// legacy export — the male set, kept so older imports keep working
export const HAIR_STYLES = HAIR_STYLES_BY_BODY.male;

export const HAIR_COLORS = {
  black:  { base: '#23252E', shadow: '#15161C', light: '#3F4453' },
  brown:  { base: '#5B3A24', shadow: '#402817', light: '#7E5637' },
  blonde: { base: '#C99C55', shadow: '#A57B3A', light: '#E5BE7C' },
  silver: { base: '#B9BFCC', shadow: '#8E95A6', light: '#DEE3EC' },
};

export function hairPreset(hairId, body = 'male') {
  // 'short_brown' -> { style:'short', color:{...} }; tolerant of bad input.
  // A style belonging to the other rig falls back to that body's default.
  const styles = hairStylesFor(body);
  const [style, color] = String(hairId || '').split('_');
  return {
    style: styles.includes(style) ? style : styles[0],
    color: HAIR_COLORS[color] || HAIR_COLORS.black,
  };
}

/** Keep a hair id valid when the body changes, preserving the colour. */
export function hairForBody(hairId, body) {
  const color = String(hairId || '').split('_')[1] || 'black';
  const styles = hairStylesFor(body);
  const style = String(hairId || '').split('_')[0];
  return `${styles.includes(style) ? style : styles[0]}_${HAIR_COLORS[color] ? color : 'black'}`;
}

// Class identities. c1 = primary gear, c2 = secondary/trim, metal = hard
// surfaces, glow = the tier-3+ energy accent.
//
// These are per-theme, and they have to be. The originals were authored
// against the old near-black page (#161A22) and lost roughly a quarter of
// their contrast when phase 1 moved the ground to navy: every c2 fell under
// 1.35:1 on a card, and ninja's *primary* measured 1.05, which is invisible.
// Light theme fails the other way, so no single value serves both.
//
// The floor is 2.2:1 against the ground a piece actually renders on
// (--gf-bg-elevated on AvatarScreen, --gf-bg-surface in lists). That is below
// a text threshold on purpose: these are large filled shapes, not glyphs.
// Two more constraints the numbers alone won't catch:
//   - pairwise c1 separation > 25 ΔE, or two classes read as the same player
//     in a leaderboard row. Closest here is knight/ninja at 34.0 dark.
//   - c1-to-c2 separation 12-45 ΔE, or the kit reads as one flat shape
//     (too low) or as two unrelated garments (too high).
// scripts/check-avatar-contrast.mjs enforces all three.
//
// Ninja inverts deliberately. A near-black ninja cannot exist on a navy card,
// so the class became the light one: bone-white wraps over a dark rig. It is
// now the highest-contrast class in the set, which suits "speed in silence"
// better than the invisible version did.
// `text` is the class colour when it carries a LABEL rather than filling a
// shape, so it answers to 4.5:1 on --gf-bg-elevated, not 2.2. In dark the glow
// already clears it (5.36-8.74). In light the glow does not (3.60-4.48), so
// text falls back to c1 (4.53-8.22). Same split as --gf-gold / --gf-gold-text.
export const CLASS_PALETTES = {
  warrior: {
    dark:  { c1: '#E9633C', c2: '#B03C1C', metal: '#A8B0BE', glow: '#FF8C3A', text: '#FF8C3A' },
    light: { c1: '#B33A1E', c2: '#7C2510', metal: '#5E6878', glow: '#C25812', text: '#B33A1E' },
  },
  mage: {
    dark:  { c1: '#B25AC8', c2: '#8E46A6', metal: '#C2C8D6', glow: '#E07FF0', text: '#E07FF0' },
    light: { c1: '#8A3AA0', c2: '#5E2470', metal: '#6A7386', glow: '#9B3FB5', text: '#8A3AA0' },
  },
  archer: {
    dark:  { c1: '#4E9A4A', c2: '#357A38', metal: '#9C7A4E', glow: '#B8E04A', text: '#B8E04A' },
    light: { c1: '#2F6B32', c2: '#1D471F', metal: '#6B4F30', glow: '#4A7A18', text: '#2F6B32' },
  },
  knight: {
    dark:  { c1: '#6E9BC9', c2: '#456C96', metal: '#BFC7D4', glow: '#7FC4FF', text: '#7FC4FF' },
    light: { c1: '#3A6A9E', c2: '#254A70', metal: '#68727F', glow: '#2E6FA8', text: '#3A6A9E' },
  },
  ninja: {
    dark:  { c1: '#D7DDE8', c2: '#8892A6', metal: '#5E6878', glow: '#4FE0C8', text: '#4FE0C8' },
    light: { c1: '#3A4152', c2: '#5E6878', metal: '#8892A6', glow: '#1F7A6E', text: '#3A4152' },
  },
};

export const THEMES = ['dark', 'light'];

// Everything the art needs that is NOT class identity: the training kit under
// the gear, hard surfaces, wood, and the contour.
//
// These exist because the class files held 68 hardcoded hex values that the
// phase 1 token migration never reached — palettes.js and the art both kept
// private colour tables, so the design system swap simply did not apply to
// them. Anything an art file paints now comes from here.
//
// `contour` is the load-bearing one. Skin tone is user identity, so it cannot
// be adjusted to clear a contrast floor: ebony (#573123) measures 1.18 on a
// dark card and porcelain (#F2D5B8) measures 1.13 on a light one. The rig gets
// an outline instead. It is also the only edit that survives downscaling to a
// 40px leaderboard row.
//
// The contour sits at the OPPOSITE end of the range from the ground — light on
// dark, dark on light — and that direction is not cosmetic. No single line
// colour can contrast with all six tones, because they span porcelain to
// ebony. It does not need to: a body reads if the skin beats the card by
// itself, OR the line beats both the card and that skin. Light skins already
// clear a navy card (porcelain 9.49), so on dark the line only has to rescue
// the dark tones, which a light line does (ebony 6.20). Light theme is the
// mirror. Invert either value and the tones it was there to rescue vanish.
export const RIG_PALETTES = {
  dark: {
    contour:     '#9AA8BC',  // light line: rescues umber and ebony on navy
    kit:         '#3B4559',  // training tank
    kitShadow:   '#2C3547',
    kitAlt:      '#454F63',  // shorts, a step up so the two garments separate
    kitAltShadow:'#333C4E',
    shoe:        '#4A5568',
    shoeSole:    '#D2D8E4',
    steelDark:   '#5E667A',
    steel:       '#8A93A8',
    steelLight:  '#C9CEDC',
    wood:        '#8A6B45',
    woodDark:    '#5C452B',
    gold:        '#F4B044',
    goldLight:   '#FFD98A',
  },
  light: {
    contour:     '#101A24',  // dark line: rescues porcelain and tan on white
    kit:         '#3B4559',
    kitShadow:   '#2C3547',
    kitAlt:      '#4A5568',
    kitAltShadow:'#333C4E',
    shoe:        '#3A4453',
    shoeSole:    '#8A93A8',
    steelDark:   '#4A5568',
    steel:       '#6A7386',
    steelLight:  '#98A2B3',
    wood:        '#6B5233',
    woodDark:    '#43331F',
    gold:        '#8A5A06',
    goldLight:   '#B8801A',
  },
};

/** Resolve the non-class rig colours for a theme. Pure — safe in Node. */
export function rigColors(theme = 'dark') {
  return RIG_PALETTES[theme] || RIG_PALETTES.dark;
}

// Shop accessory colours. These are per-ITEM identity, not per-class: a crown's
// gems are ruby and sapphire for every player, so they deliberately do not take
// --av-c1/--av-c2. They still need both themes, because several of these pieces
// (flames, wings, cape, the floating badges) extend past the body onto bare
// card, and people pay coins for them — wings' highlight was #FFFFFF, which is
// 1.0:1 on a white surface.
//
// Light values are darkened rather than re-hued, so a ruby stays a ruby.
export const ITEM_PALETTES = {
  dark: {
    ruby:          '#B33A2B',  // crown centre gem, cape body
    rubyDark:      '#7A2018',
    rubyLight:     '#D4553F',
    sapphire:      '#388BFF',  // crown side gems, shield face
    sapphireLight: '#7FB4FF',
    ember:         '#FF8C00',  // flame tongues
    ice:           '#7FDBFF',  // diamond badge
    iceLight:      '#B7ECFF',
    iceDark:       '#3FA7D6',
    highlight:     '#FFFFFF',  // wing feather catch
  },
  light: {
    ruby:          '#A32F20',
    rubyDark:      '#6E1D12',
    rubyLight:     '#C2452C',
    sapphire:      '#1D6FD1',
    sapphireLight: '#3F86DE',
    ember:         '#C25812',
    ice:           '#2A86AD',
    iceLight:      '#4FA6C9',
    iceDark:       '#1B6480',
    highlight:     '#F2F5F7',
  },
};

/** Resolve shop-accessory colours for a theme. Pure — safe in Node. */
export function itemColors(theme = 'dark') {
  return ITEM_PALETTES[theme] || ITEM_PALETTES.dark;
}

/**
 * The complete CSS variable map for one avatar.
 *
 * <Avatar/> spreads this onto the <svg>, and the render scripts substitute it
 * into the markup string, because resvg does not resolve custom properties.
 * Both go through here on purpose: the scripts used to keep their own list of
 * nine replacements, which would quietly miss any variable added later and
 * render `var(--av-kit)` as nothing.
 */
export function avatarCssVars({ avatarClass, skinTone, hair, body = 'male', theme = 'dark' }) {
  const skin = SKIN_TONES[skinTone] || SKIN_TONES[DEFAULT_CONFIG.skin_tone];
  const { color: hairColor } = hairPreset(hair, body);
  const c = classColors(avatarClass, theme);
  const rig = rigColors(theme);
  const item = itemColors(theme);
  return {
    '--av-skin': skin.base,
    '--av-skin-shadow': skin.shadow,
    '--av-hair': hairColor.base,
    '--av-hair-shadow': hairColor.shadow,
    '--av-hair-light': hairColor.light,
    '--av-c1': c.c1,
    '--av-c2': c.c2,
    '--av-metal': c.metal,
    '--av-glow': c.glow,
    '--av-contour': rig.contour,
    '--av-kit': rig.kit,
    '--av-kit-shadow': rig.kitShadow,
    '--av-kit-alt': rig.kitAlt,
    '--av-kit-alt-shadow': rig.kitAltShadow,
    '--av-shoe': rig.shoe,
    '--av-shoe-sole': rig.shoeSole,
    '--av-steel-dark': rig.steelDark,
    '--av-steel': rig.steel,
    '--av-steel-light': rig.steelLight,
    '--av-wood': rig.wood,
    '--av-wood-dark': rig.woodDark,
    '--av-gold': rig.gold,
    '--av-gold-light': rig.goldLight,
    '--av-item-ruby': item.ruby,
    '--av-item-ruby-dark': item.rubyDark,
    '--av-item-ruby-light': item.rubyLight,
    '--av-item-sapphire': item.sapphire,
    '--av-item-sapphire-light': item.sapphireLight,
    '--av-item-ember': item.ember,
    '--av-item-ice': item.ice,
    '--av-item-ice-light': item.iceLight,
    '--av-item-ice-dark': item.iceDark,
    '--av-item-highlight': item.highlight,
  };
}

/**
 * Substitute every var(--av-*) reference in an SVG string with its literal
 * value. Longest name first, so --av-skin-shadow is replaced before --av-skin
 * leaves a dangling `-shadow)` behind.
 */
export function bakeAvatarVars(svg, opts) {
  const vars = avatarCssVars(opts);
  return Object.keys(vars)
    .sort((a, b) => b.length - a.length)
    .reduce((out, name) => out.replaceAll(`var(${name})`, vars[name]), svg);
}

/** Resolve one class's colours for a theme. Pure — safe in Node render scripts. */
export function classColors(avatarClass, theme = 'dark') {
  const entry = CLASS_PALETTES[avatarClass] || CLASS_PALETTES.warrior;
  return entry[theme] || entry.dark;
}

// Back-compat: the dark set under the original name. Dark is the primary theme
// and every historical caller assumed it.
export const CLASS_COLORS = Object.fromEntries(
  Object.keys(CLASS_PALETTES).map(c => [c, classColors(c, 'dark')]),
);

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
  version: 3,
  class: 'warrior',
  body: 'male',
  skin_tone: 'tan',
  hair: 'short_black',
};

// Tier presentation config. Tier gear itself lives in the class files
// (cumulative); this maps tier → outer glow treatment.
export const TIER_GLOW = {
  1: null,
  2: null,
  3: { size: 3, color: 'class' },   // class energy awakens
  4: { size: 5, color: 'class' },
  5: { size: 7, color: '#E0680E' }, // max tier: the ember signature
};

// Rank ladder — one system for tiers, emblems, and titles.
// T1=L1-2 Bronze · T2=L3-4 Silver · T3=L5-6 Gold · T4=L7-9 Platinum · T5=L10 Apex
//
// Ratios on --gf-bg-primary (#0B1A24) / --gf-bg-surface (#112532):
//   bronze 5.72/5.09 · silver 9.96/8.87 · gold 9.38/8.35 ·
//   platinum 8.39/7.46 · apex 5.18/4.61 — all AA body on both grounds.
// Bronze was #B5754A until axe caught it at 4.20 on the surface; these labels
// render on cards, so the surface ratio is the one that binds, not the page.
// Apex moved off violet (#9664FF), which measured 3.36:1 and failed AA.
// Adjacent tiers are separated by lightness or hue so the ladder reads as
// five distinct steps rather than a gradient.
// These values are mirrored in gamefit-web's tokens.css; change both together.
export const TIER_CONFIG = {
  1: { label: 'Bronze',   color: '#C08657', bg: 'rgba(192,134,87,0.10)',  border: 'rgba(192,134,87,0.35)',  glow: null },
  2: { label: 'Silver',   color: '#B9C4CC', bg: 'rgba(185,196,204,0.08)', border: 'rgba(185,196,204,0.35)', glow: '#B9C4CC' },
  3: { label: 'Gold',     color: '#F4B044', bg: 'rgba(244,176,68,0.08)',  border: 'rgba(244,176,68,0.4)',   glow: '#F4B044' },
  4: { label: 'Platinum', color: '#7FBBD4', bg: 'rgba(127,187,212,0.08)', border: 'rgba(127,187,212,0.4)',  glow: '#7FBBD4' },
  5: { label: 'Apex',     color: '#E0680E', bg: 'rgba(224,104,14,0.10)',  border: 'rgba(224,104,14,0.5)',   glow: '#E0680E' },
};

// TIER_BADGES (medal emoji per tier) was removed: at both render sites the
// tier label sat immediately beside it, and one already drew a <RankEmblem/>.
// The glyph repeated what the label and the emblem already said.

// relative import so the avatar package also works outside Vite (render scripts)
export { AVATAR_TIER_LEVELS } from '../../lib/mockData';

/**
 * Flatten a class's gear up to `tier`.
 *
 * Tiers are cumulative: a tier-4 avatar wears everything from tiers 1-4. That
 * models the progression well for additive pieces (a belt, then a pauldron on
 * top of it) but not for replacement. Class identity now starts at tier 1 in
 * cloth and escalates in material, so a tier-4 steel helm is not worn *over*
 * the tier-1 headband — it is the same slot in a better material.
 *
 * A piece may carry `id`, and any later piece may list `supersedes: [id, ...]`.
 * Superseded pieces are dropped rather than drawn under. Relying on the newer
 * art to simply cover the older art is what produces the classic artifact of a
 * bone horn poking out from behind a steel one.
 */
export function cumulativeGear(classDef, tier) {
  const t = Math.min(Math.max(tier || 1, 1), 5);
  const pieces = [];
  for (let i = 1; i <= t; i++) {
    if (classDef.gear[i]) pieces.push(...classDef.gear[i]);
  }
  const superseded = new Set();
  for (const p of pieces) {
    for (const id of p.supersedes || []) superseded.add(id);
  }
  return superseded.size ? pieces.filter(p => !p.id || !superseded.has(p.id)) : pieces;
}

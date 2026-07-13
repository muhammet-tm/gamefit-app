// Tier presentation config. Tier gear itself lives in the class files
// (cumulative); this maps tier → outer glow treatment.
export const TIER_GLOW = {
  1: null,
  2: null,
  3: { size: 3, color: 'class' },   // class energy awakens
  4: { size: 5, color: 'class' },
  5: { size: 7, color: '#9664FF' }, // max tier: the purple signature
};

// Rank ladder — one system for tiers, emblems, and titles.
// T1=L1-2 Bronze · T2=L3-4 Silver · T3=L5-6 Gold · T4=L7-9 Platinum · T5=L10 Apex
export const TIER_CONFIG = {
  1: { label: 'Bronze',   color: '#CD8A4E', bg: 'rgba(205,138,78,0.10)',  border: 'rgba(205,138,78,0.35)',  glow: null },
  2: { label: 'Silver',   color: '#B9BFCC', bg: 'rgba(185,191,204,0.08)', border: 'rgba(185,191,204,0.35)', glow: '#B9BFCC' },
  3: { label: 'Gold',     color: '#FFB800', bg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.4)',    glow: '#FFB800' },
  4: { label: 'Platinum', color: '#8FD3E8', bg: 'rgba(143,211,232,0.08)', border: 'rgba(143,211,232,0.4)',  glow: '#8FD3E8' },
  5: { label: 'Apex',     color: '#9664FF', bg: 'rgba(150,100,255,0.10)', border: 'rgba(150,100,255,0.5)',  glow: '#9664FF' },
};

export const TIER_BADGES = { 1: '🥉', 2: '🥈', 3: '🥇', 4: '💠', 5: '👑' };

// relative import so the avatar package also works outside Vite (render scripts)
export { AVATAR_TIER_LEVELS } from '../../lib/mockData';

export function cumulativeGear(classDef, tier) {
  const t = Math.min(Math.max(tier || 1, 1), 5);
  const pieces = [];
  for (let i = 1; i <= t; i++) {
    if (classDef.gear[i]) pieces.push(...classDef.gear[i]);
  }
  return pieces;
}

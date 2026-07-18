// The rank ladder — one vocabulary for levels everywhere.
// 10 levels map onto 5 ranks with sub-ranks (higher number = earlier):
//   L1  Bronze II    L2  Bronze I
//   L3  Silver II    L4  Silver I
//   L5  Gold II      L6  Gold I
//   L7  Platinum III L8  Platinum II   L9 Platinum I
//   L10 APEX
import { TIER_CONFIG } from '@/components/avatar/tiers';
import { getAvatarTier } from '@/lib/mockData';

const SUB_RANKS = {
  1: 'II', 2: 'I',
  3: 'II', 4: 'I',
  5: 'II', 6: 'I',
  7: 'III', 8: 'II', 9: 'I',
  10: '',
};

export function getRank(level) {
  const lvl = Math.min(Math.max(Number(level) || 1, 1), 10);
  const tier = getAvatarTier(lvl);
  const cfg = TIER_CONFIG[tier];
  const sub = SUB_RANKS[lvl];
  return {
    level: lvl,
    tier,
    name: cfg.label,                                  // "Gold"
    sub,                                              // "II"
    display: sub ? `${cfg.label} ${sub}` : cfg.label, // "Gold II" / "Apex"
    color: cfg.color,
    bg: cfg.bg,
    border: cfg.border,
    badge: { 1: '🥉', 2: '🥈', 3: '🥇', 4: '💠', 5: '👑' }[tier],
  };
}

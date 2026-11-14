// The rank ladder — one vocabulary for levels everywhere.
// 10 levels map onto 5 ranks with sub-ranks (higher number = earlier):
//   L1  Beginner II      L2  Beginner I
//   L3  Novice II        L4  Novice I
//   L5  Intermediate II  L6  Intermediate I
//   L7  Advanced III     L8  Advanced II     L9 Advanced I
//   L10 Elite
// (Bronze, Silver, Gold, Platinum, and Apex until November 2026; the colours
// still follow the metals.)
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
    // No `badge` glyph. It was a medal emoji with no consumer anywhere in the
    // app; rank is shown by <RankEmblem/> plus the `display` string.
  };
}

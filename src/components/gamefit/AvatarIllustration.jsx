import React from 'react';

const AVATAR_COLORS = {
  warrior: { base: '#E85D04', accent: '#F48C06', glow: '#FFB800' },
  mage: { base: '#7C3AED', accent: '#A855F7', glow: '#C084FC' },
  archer: { base: '#16A34A', accent: '#22C55E', glow: '#C8FF00' },
  knight: { base: '#1E40AF', accent: '#3B82F6', glow: '#93C5FD' },
  ninja: { base: '#111827', accent: '#374151', glow: '#6B7280' },
};

const TIER_EFFECTS = {
  1: { outline: false, glow: false, crown: false, wings: false },
  2: { outline: true, glow: false, crown: false, wings: false },
  3: { outline: true, glow: true, crown: false, wings: false },
  4: { outline: true, glow: true, crown: true, wings: false },
  5: { outline: true, glow: true, crown: true, wings: true },
};

export default function AvatarIllustration({ style = 'warrior', tier = 1, size = 120, className = '' }) {
  const colors = AVATAR_COLORS[style] || AVATAR_COLORS.warrior;
  const effects = TIER_EFFECTS[tier] || TIER_EFFECTS[1];

  const avatarShapes = {
    warrior: (
      <g>
        {/* Body */}
        <rect x="35" y="55" width="30" height="35" rx="4" fill={colors.base} />
        {/* Head */}
        <circle cx="50" cy="42" r="16" fill="#FBBF24" />
        {/* Helmet */}
        <rect x="34" y="30" width="32" height="18" rx="8" fill={colors.base} />
        <rect x="38" y="36" width="24" height="8" rx="2" fill={colors.accent} />
        {/* Arms */}
        <rect x="20" y="55" width="14" height="28" rx="4" fill={colors.base} />
        <rect x="66" y="55" width="14" height="28" rx="4" fill={colors.base} />
        {/* Sword */}
        <rect x="75" y="38" width="5" height="40" rx="2" fill="#D1D5DB" />
        <rect x="72" y="52" width="11" height="4" rx="1" fill={colors.accent} />
        {/* Legs */}
        <rect x="35" y="88" width="12" height="18" rx="3" fill={colors.base} />
        <rect x="53" y="88" width="12" height="18" rx="3" fill={colors.base} />
        {/* Boots */}
        <rect x="33" y="103" width="16" height="8" rx="2" fill="#374151" />
        <rect x="51" y="103" width="16" height="8" rx="2" fill="#374151" />
      </g>
    ),
    mage: (
      <g>
        {/* Robe */}
        <path d="M25 55 Q50 50 75 55 L80 110 Q50 115 20 110 Z" fill={colors.base} />
        {/* Head */}
        <circle cx="50" cy="42" r="16" fill="#FBBF24" />
        {/* Wizard hat */}
        <path d="M34 38 L50 5 L66 38 Z" fill={colors.base} />
        <ellipse cx="50" cy="38" rx="18" ry="5" fill={colors.accent} />
        {/* Staff */}
        <rect x="76" y="25" width="4" height="65" rx="2" fill="#8B5CF6" />
        <circle cx="78" cy="22" r="8" fill={colors.glow} opacity="0.9" />
        <circle cx="78" cy="22" r="5" fill="white" />
        {/* Stars on robe */}
        <text x="42" y="75" fontSize="10" fill={colors.accent}>✦</text>
        <text x="55" y="88" fontSize="8" fill={colors.accent}>✦</text>
        {/* Sleeves */}
        <path d="M25 55 L10 75 L22 78 L35 65" fill={colors.accent} />
        <path d="M75 55 L90 75 L78 78 L65 65" fill={colors.accent} />
      </g>
    ),
    archer: (
      <g>
        {/* Tunic */}
        <rect x="34" y="55" width="32" height="40" rx="4" fill={colors.base} />
        {/* Head */}
        <circle cx="50" cy="42" r="16" fill="#FBBF24" />
        {/* Hood */}
        <path d="M32 40 Q50 20 68 40 L66 50 Q50 42 34 50 Z" fill={colors.base} />
        {/* Arms */}
        <rect x="20" y="55" width="13" height="25" rx="4" fill={colors.base} />
        <rect x="67" y="55" width="13" height="25" rx="4" fill={colors.base} />
        {/* Bow */}
        <path d="M16 30 Q8 50 16 70" fill="none" stroke={colors.accent} strokeWidth="3" />
        <line x1="16" y1="30" x2="16" y2="70" stroke="#D1D5DB" strokeWidth="1.5" />
        {/* Arrow */}
        <line x1="16" y1="50" x2="32" y2="50" stroke="#D1D5DB" strokeWidth="2" />
        <polygon points="33,47 38,50 33,53" fill="#E85D04" />
        {/* Legs */}
        <rect x="35" y="93" width="11" height="18" rx="3" fill="#166534" />
        <rect x="54" y="93" width="11" height="18" rx="3" fill="#166534" />
        {/* Boots */}
        <rect x="33" y="108" width="15" height="6" rx="2" fill="#374151" />
        <rect x="52" y="108" width="15" height="6" rx="2" fill="#374151" />
      </g>
    ),
    knight: (
      <g>
        {/* Full Armor */}
        <rect x="30" y="52" width="40" height="45" rx="5" fill={colors.base} />
        {/* Shoulder pads */}
        <ellipse cx="26" cy="55" rx="12" ry="8" fill={colors.accent} />
        <ellipse cx="74" cy="55" rx="12" ry="8" fill={colors.accent} />
        {/* Head/Helmet */}
        <circle cx="50" cy="42" r="16" fill={colors.base} />
        {/* Visor */}
        <rect x="36" y="36" width="28" height="12" rx="4" fill={colors.base} />
        <rect x="38" y="39" width="24" height="6" rx="2" fill="#0F172A" />
        <rect x="46" y="39" width="8" height="6" fill={colors.glow} opacity="0.6" />
        {/* Shield */}
        <path d="M68 60 L80 60 L80 80 Q74 88 68 80 Z" fill={colors.accent} />
        <text x="71" y="74" fontSize="8" fill={colors.base}>⚔</text>
        {/* Arms */}
        <rect x="14" y="52" width="14" height="30" rx="4" fill={colors.accent} />
        <rect x="72" y="52" width="14" height="30" rx="4" fill={colors.accent} />
        {/* Legs */}
        <rect x="33" y="95" width="14" height="17" rx="3" fill={colors.accent} />
        <rect x="53" y="95" width="14" height="17" rx="3" fill={colors.accent} />
        {/* Boots */}
        <rect x="31" y="109" width="18" height="7" rx="2" fill="#1E293B" />
        <rect x="51" y="109" width="18" height="7" rx="2" fill="#1E293B" />
      </g>
    ),
    ninja: (
      <g>
        {/* Outfit */}
        <rect x="32" y="52" width="36" height="44" rx="4" fill={colors.base} />
        {/* Head/Mask */}
        <circle cx="50" cy="42" r="16" fill="#1F2937" />
        {/* Eye slit */}
        <rect x="36" y="38" width="28" height="6" rx="3" fill={colors.base} />
        <rect x="42" y="38" width="16" height="6" rx="2" fill={colors.glow} opacity="0.8" />
        {/* Arms */}
        <rect x="18" y="52" width="13" height="28" rx="4" fill={colors.base} />
        <rect x="69" y="52" width="13" height="28" rx="4" fill={colors.base} />
        {/* Shurikens */}
        <text x="10" y="60" fontSize="12" fill={colors.glow}>✦</text>
        {/* Katana */}
        <rect x="73" y="30" width="4" height="50" rx="2" fill="#E5E7EB" transform="rotate(-15 75 55)" />
        <rect x="70" y="52" width="10" height="3" rx="1" fill={colors.glow} transform="rotate(-15 75 55)" />
        {/* Belt */}
        <rect x="32" y="72" width="36" height="5" rx="2" fill={colors.glow} opacity="0.7" />
        {/* Legs */}
        <rect x="33" y="94" width="12" height="18" rx="3" fill={colors.base} />
        <rect x="55" y="94" width="12" height="18" rx="3" fill={colors.base} />
        {/* Foot wraps */}
        <rect x="31" y="108" width="16" height="6" rx="2" fill="#111827" />
        <rect x="53" y="108" width="16" height="6" rx="2" fill="#111827" />
      </g>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {effects.glow && (
          <filter id={`glow-${style}-${tier}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
        {tier === 5 && (
          <radialGradient id={`legendGrad-${style}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {/* Tier 5 legendary aura */}
      {tier === 5 && (
        <ellipse cx="50" cy="90" rx="48" ry="30" fill={`url(#legendGrad-${style})`} />
      )}

      {/* Main avatar */}
      <g filter={effects.glow ? `url(#glow-${style}-${tier})` : undefined}>
        {avatarShapes[style] || avatarShapes.warrior}
      </g>

      {/* Tier 2+ outline glow */}
      {effects.outline && (
        <g opacity="0.3" stroke={colors.glow} strokeWidth="2" fill="none">
          <circle cx="50" cy="42" r="17" />
        </g>
      )}

      {/* Tier 4+ crown */}
      {effects.crown && (
        <g>
          <text x="38" y="18" fontSize="16" fill="#FFD700">👑</text>
        </g>
      )}

      {/* Tier 5 wings */}
      {effects.wings && (
        <g opacity="0.7">
          <path d="M15 60 Q-5 40 5 70 Q15 65 20 70" fill={colors.glow} />
          <path d="M85 60 Q105 40 95 70 Q85 65 80 70" fill={colors.glow} />
        </g>
      )}
    </svg>
  );
}
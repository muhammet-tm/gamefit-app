import React from 'react';
import { getRank } from '@/lib/ranks';

// Shield emblem for the rank ladder. Pure SVG in the tier color with a
// metallic edge; `showLabel` adds "GOLD II" beneath.
export default function RankEmblem({ level = 1, size = 40, showLabel = false, className = '' }) {
  const rank = getRank(level);

  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ gap: 3 }}>
      <svg width={size} height={size * 1.12} viewBox="0 0 44 50" role="img"
        aria-label={`Rank ${rank.display}`}>
        {/* shield body */}
        <path d="M22,2 L39,8 C40,8.4 41,9.4 41,11 L41,26 C41,36 33,44 22,48 C11,44 3,36 3,26 L3,11
                 C3,9.4 4,8.4 5,8 Z"
          fill={rank.color} opacity="0.16" />
        <path d="M22,4 L37.5,9.6 C38.4,9.9 39,10.7 39,11.8 L39,26 C39,35 31.8,42.3 22,45.9
                 C12.2,42.3 5,35 5,26 L5,11.8 C5,10.7 5.6,9.9 6.5,9.6 Z"
          fill="none" stroke={rank.color} strokeWidth="2.4" />
        {/* inner chevron */}
        <path d="M22,14 L31,20 L28,24 L22,20 L16,24 L13,20 Z" fill={rank.color} />
        <path d="M22,24 L29,28.5 L26.5,32 L22,29 L17.5,32 L15,28.5 Z" fill={rank.color} opacity="0.55" />
        {/* sub-rank pips */}
        {rank.sub && [...rank.sub].map((_, i, arr) => (
          <circle key={i} cx={22 + (i - (arr.length - 1) / 2) * 7} cy="38" r="2.2" fill={rank.color} />
        ))}
        {/* Apex crown mark */}
        {rank.tier === 5 && (
          <path d="M15,36 L18,40 L22,36.5 L26,40 L29,36 L28,42 L16,42 Z" fill={rank.color} />
        )}
      </svg>
      {showLabel && (
        <span className="font-heading font-black uppercase"
          style={{ color: rank.color, fontSize: Math.max(10, size * 0.26), letterSpacing: '0.06em' }}>
          {rank.display}
        </span>
      )}
    </div>
  );
}

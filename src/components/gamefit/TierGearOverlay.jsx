import React from 'react';
import { motion } from 'framer-motion';

// Gear/visual overlays rendered on top of HumanAvatar per progression tier
// Tier 1: plain (Recruit)
// Tier 2: sweatband + basic gear glow
// Tier 3: helmet + glowing aura ring
// Tier 4: full armor shimmer + wing hints
// Tier 5: crown + wings + legendary flame aura

const TIER_CONFIG = {
  1: { label: 'Recruit',    color: '#8A8F9E', bg: 'rgba(138,143,158,0.1)',  border: 'rgba(138,143,158,0.3)',  glow: null },
  2: { label: 'Warrior',    color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.35)',  glow: '#60A5FA' },
  3: { label: 'Champion',   color: '#C8FF00', bg: 'rgba(200,255,0,0.08)',   border: 'rgba(200,255,0,0.4)',    glow: '#C8FF00' },
  4: { label: 'Legend',     color: '#FFB800', bg: 'rgba(255,184,0,0.1)',    border: 'rgba(255,184,0,0.45)',   glow: '#FFB800' },
  5: { label: 'Titan',      color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',    border: 'rgba(255,77,77,0.5)',    glow: '#FF4D4D' },
};

const TIER_BADGES = {
  1: '🥋',
  2: '⚔️',
  3: '🏆',
  4: '💎',
  5: '👑',
};

// SVG gear overlays rendered inside the avatar container
function GearSVG({ tier, size }) {
  const s = size || 160;
  const cx = s / 2;

  if (tier === 1) return null;

  if (tier === 2) {
    // Sweatband headband
    return (
      <svg width={s} height={s * 1.4} viewBox="0 0 120 168" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {/* Sweatband */}
        <rect x="39" y="19" width="42" height="7" rx="3.5" fill="#60A5FA" opacity="0.9" />
        <rect x="41" y="20" width="38" height="3" rx="1.5" fill="white" opacity="0.3" />
        {/* Wristbands */}
        <rect x="18" y="104" width="12" height="6" rx="3" fill="#60A5FA" opacity="0.8" />
        <rect x="90" y="104" width="12" height="6" rx="3" fill="#60A5FA" opacity="0.8" />
      </svg>
    );
  }

  if (tier === 3) {
    // Sport helmet visor + knee guards
    return (
      <svg width={s} height={s * 1.4} viewBox="0 0 120 168" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {/* Helmet top cap */}
        <path d="M40 22 Q42 8 60 6 Q78 8 80 22 Q76 12 60 10 Q44 12 40 22" fill="#C8FF00" opacity="0.85" />
        {/* Visor strip */}
        <rect x="42" y="25" width="36" height="5" rx="2.5" fill="rgba(200,255,0,0.6)" />
        <rect x="42" y="26" width="36" height="2" rx="1" fill="white" opacity="0.25" />
        {/* Shin guards */}
        <rect x="36" y="130" width="12" height="16" rx="4" fill="#C8FF00" opacity="0.5" />
        <rect x="72" y="130" width="12" height="16" rx="4" fill="#C8FF00" opacity="0.5" />
      </svg>
    );
  }

  if (tier === 4) {
    // Full armor chest plate + pauldrons + greaves
    return (
      <svg width={s} height={s * 1.4} viewBox="0 0 120 168" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {/* Crown base */}
        <path d="M44 16 L50 6 L60 12 L70 6 L76 16 L72 20 L48 20 Z" fill="#FFB800" opacity="0.9" />
        <circle cx="50" cy="6" r="2.5" fill="#FF5722" />
        <circle cx="60" cy="12" r="2.5" fill="#60A5FA" />
        <circle cx="70" cy="6" r="2.5" fill="#C8FF00" />
        {/* Chest armor plate */}
        <path d="M40 64 Q60 60 80 64 L78 92 Q60 97 42 92 Z" fill="rgba(255,184,0,0.25)" stroke="#FFB800" strokeWidth="1.5" opacity="0.8" />
        {/* Center emblem */}
        <polygon points="60,68 63,76 71,76 65,81 67,89 60,84 53,89 55,81 49,76 57,76" fill="#FFB800" opacity="0.7" />
        {/* Pauldrons */}
        <ellipse cx="37" cy="68" rx="8" ry="6" fill="rgba(255,184,0,0.5)" stroke="#FFB800" strokeWidth="1" />
        <ellipse cx="83" cy="68" rx="8" ry="6" fill="rgba(255,184,0,0.5)" stroke="#FFB800" strokeWidth="1" />
        {/* Greaves */}
        <rect x="34" y="120" width="14" height="28" rx="5" fill="rgba(255,184,0,0.4)" stroke="#FFB800" strokeWidth="1" />
        <rect x="72" y="120" width="14" height="28" rx="5" fill="rgba(255,184,0,0.4)" stroke="#FFB800" strokeWidth="1" />
      </svg>
    );
  }

  if (tier === 5) {
    // Legendary: full crown + wings + aura rings
    return (
      <svg width={s} height={s * 1.4} viewBox="0 0 120 168" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {/* Wings */}
        <path d="M18 65 Q-15 40 2 72 Q10 69 18 78" fill="#FF4D4D" opacity="0.85" />
        <path d="M19 65 Q-8 50 6 74" fill="#FF8C00" opacity="0.6" />
        <path d="M102 65 Q135 40 118 72 Q110 69 102 78" fill="#FF4D4D" opacity="0.85" />
        <path d="M101 65 Q128 50 114 74" fill="#FF8C00" opacity="0.6" />
        {/* Crown */}
        <path d="M42 14 L48 4 L60 10 L72 4 L78 14 L74 18 L46 18 Z" fill="#FF4D4D" opacity="0.95" />
        <circle cx="48" cy="4" r="3" fill="#FFB800" />
        <circle cx="60" cy="10" r="3" fill="#C8FF00" />
        <circle cx="72" cy="4" r="3" fill="#60A5FA" />
        {/* Runes on crown */}
        <line x1="52" y1="14" x2="52" y2="18" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="60" y1="12" x2="60" y2="18" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="68" y1="14" x2="68" y2="18" stroke="white" strokeWidth="1" opacity="0.7" />
        {/* Armor */}
        <path d="M38 62 Q60 58 82 62 L80 95 Q60 100 40 95 Z" fill="rgba(255,77,77,0.2)" stroke="#FF4D4D" strokeWidth="1.5" opacity="0.9" />
        {/* Skull emblem */}
        <circle cx="60" cy="76" r="8" fill="none" stroke="#FF4D4D" strokeWidth="1.5" opacity="0.8" />
        <text x="60" y="80" textAnchor="middle" fontSize="10" fill="#FF4D4D" opacity="0.9">⚡</text>
        {/* Greaves */}
        <rect x="33" y="118" width="16" height="30" rx="5" fill="rgba(255,77,77,0.4)" stroke="#FF4D4D" strokeWidth="1.2" />
        <rect x="71" y="118" width="16" height="30" rx="5" fill="rgba(255,77,77,0.4)" stroke="#FF4D4D" strokeWidth="1.2" />
        {/* Ground flame */}
        <ellipse cx="60" cy="164" rx="30" ry="4" fill="#FF4D4D" opacity="0.2" />
      </svg>
    );
  }

  return null;
}

export default function TierGearOverlay({ tier = 1, size = 160, children }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG[1];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size * 1.4 }}>
      {/* Glow ring behind avatar */}
      {cfg.glow && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 0.85,
            height: size * 0.85,
            top: '4%',
            left: '7.5%',
            boxShadow: `0 0 ${tier * 10}px ${tier * 5}px ${cfg.glow}40`,
            border: `2px solid ${cfg.glow}50`,
            borderRadius: '50%',
          }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1.03, 0.97] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
      )}

      {/* Avatar children */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Gear SVG overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <GearSVG tier={tier} size={size} />
      </div>
    </div>
  );
}

export { TIER_CONFIG, TIER_BADGES };
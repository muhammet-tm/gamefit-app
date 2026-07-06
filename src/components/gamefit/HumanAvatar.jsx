import React from 'react';

// Liftoff-style cartoon human avatar
// skin: 'light' | 'medium' | 'dark' | 'deepbrown'
// gender: 'male' | 'female'
// outfit: 'blue' | 'black' | 'red' | 'green' | 'purple'
// hair: 'brown' | 'black' | 'blonde' | 'white' | 'pink'

const SKIN = {
  light:     { base: '#F5C9A0', mid: '#E8A87C', shadow: '#D4895A', lip: '#D4895A' },
  medium:    { base: '#D4956A', mid: '#C07A4F', shadow: '#A05E35', lip: '#A05E35' },
  dark:      { base: '#8D5524', mid: '#6B3F1A', shadow: '#4A2810', lip: '#6B3F1A' },
  deepbrown: { base: '#5C3317', mid: '#3E1F0A', shadow: '#2A1005', lip: '#3E1F0A' },
};

const OUTFIT = {
  blue:   { shirt: '#5BB8E8', shirtDark: '#3A9FD4', shorts: '#4AA8DC', shortsDark: '#2E8FC4' },
  black:  { shirt: '#4A5568', shirtDark: '#2D3748', shorts: '#374151', shortsDark: '#1F2937' },
  red:    { shirt: '#EF5350', shirtDark: '#C62828', shorts: '#E53935', shortsDark: '#B71C1C' },
  green:  { shirt: '#66BB6A', shirtDark: '#388E3C', shorts: '#4CAF50', shortsDark: '#2E7D32' },
  purple: { shirt: '#AB47BC', shirtDark: '#7B1FA2', shorts: '#9C27B0', shortsDark: '#6A1B9A' },
};

const HAIR = {
  brown:  { base: '#5D3A1A', mid: '#4A2E12', hi: '#7D5A2A' },
  black:  { base: '#1A1A1A', mid: '#0D0D0D', hi: '#333' },
  blonde: { base: '#D4A017', mid: '#B8860B', hi: '#F0C040' },
  white:  { base: '#C8C8C8', mid: '#A0A0A0', hi: '#E8E8E8' },
  pink:   { base: '#E91E8C', mid: '#C2185B', hi: '#F48FB1' },
};

export default function HumanAvatar({ skin = 'light', gender = 'male', outfit = 'blue', hair = 'brown', size = 120, tier = 1, className = '' }) {
  const sk = SKIN[skin] || SKIN.light;
  const oc = OUTFIT[outfit] || OUTFIT.blue;
  const hc = HAIR[hair] || HAIR.brown;

  const glowColor = tier >= 3 ? '#C8FF00' : tier >= 2 ? '#FFB800' : null;
  const showCrown = tier >= 4;
  const showWings = tier >= 5;

  const filterId = `glow-${skin}-${tier}`;

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 120 168"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {tier >= 3 && (
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
        <radialGradient id={`skin-face-${skin}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={sk.base} />
          <stop offset="100%" stopColor={sk.mid} />
        </radialGradient>
      </defs>

      {/* Wings tier 5 */}
      {showWings && (
        <g opacity="0.8">
          <path d="M18 70 Q-10 45 5 75 Q12 72 18 80" fill="#C8FF00" />
          <path d="M102 70 Q130 45 115 75 Q108 72 102 80" fill="#C8FF00" />
        </g>
      )}

      {/* Ground glow */}
      {glowColor && (
        <ellipse cx="60" cy="162" rx="28" ry="5" fill={glowColor} opacity="0.3" />
      )}

      <g filter={tier >= 3 ? `url(#${filterId})` : undefined}>

        {gender === 'female' ? <FemaleBody sk={sk} oc={oc} hc={hc} /> : <MaleBody sk={sk} oc={oc} hc={hc} />}

      </g>

      {/* Crown tier 4 */}
      {showCrown && (
        <g>
          <path d="M42 14 L48 5 L60 11 L72 5 L78 14 L74 18 L46 18 Z" fill="#FFD700" stroke="#FFA000" strokeWidth="0.5" />
          <circle cx="48" cy="5" r="2.5" fill="#FF5722" />
          <circle cx="60" cy="11" r="2.5" fill="#42A5F5" />
          <circle cx="72" cy="5" r="2.5" fill="#66BB6A" />
        </g>
      )}
    </svg>
  );
}

function MaleBody({ sk, oc, hc }) {
  return (
    <g>
      {/* === SHOES === */}
      <ellipse cx="44" cy="158" rx="13" ry="6" fill="#E8E8E8" />
      <ellipse cx="76" cy="158" rx="13" ry="6" fill="#E8E8E8" />
      <ellipse cx="44" cy="155" rx="11" ry="5" fill="white" />
      <ellipse cx="76" cy="155" rx="11" ry="5" fill="white" />
      <path d="M33 155 Q44 150 55 155" stroke="#DDD" strokeWidth="0.8" fill="none" />
      <path d="M65 155 Q76 150 87 155" stroke="#DDD" strokeWidth="0.8" fill="none" />

      {/* === LEGS === */}
      {/* Left leg */}
      <path d="M46 118 Q42 136 40 150 Q44 153 48 150 Q50 136 52 118 Z" fill={sk.base} />
      {/* Right leg */}
      <path d="M74 118 Q78 136 80 150 Q76 153 72 150 Q70 136 68 118 Z" fill={sk.base} />
      {/* Leg shadow inner */}
      <path d="M48 118 Q46 135 44 150" stroke={sk.mid} strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M72 118 Q74 135 76 150" stroke={sk.mid} strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* === SHORTS === */}
      <path d="M36 95 Q60 100 84 95 L80 120 Q60 125 40 120 Z" fill={oc.shorts} />
      <path d="M60 98 L60 122" stroke={oc.shortsDark} strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Shorts highlight */}
      <path d="M42 96 Q60 100 78 96" stroke="white" strokeWidth="1" opacity="0.2" fill="none" />

      {/* === ARMS === */}
      {/* Left arm */}
      <path d="M38 68 Q25 80 22 100 Q20 108 25 110 Q30 112 33 104 Q36 85 42 74" fill={sk.base} />
      <ellipse cx="24" cy="109" rx="6" ry="6" fill={sk.base} />
      {/* Left hand */}
      <ellipse cx="24" cy="111" rx="5" ry="5.5" fill={sk.base} />
      <path d="M20 109 Q19 115 21 118" stroke={sk.mid} strokeWidth="1" fill="none" />
      <path d="M24 109 Q23 116 25 119" stroke={sk.mid} strokeWidth="1" fill="none" />
      <path d="M28 108 Q28 115 27 117" stroke={sk.mid} strokeWidth="1" fill="none" />

      {/* Right arm */}
      <path d="M82 68 Q95 80 98 100 Q100 108 95 110 Q90 112 87 104 Q84 85 78 74" fill={sk.base} />
      <ellipse cx="96" cy="109" rx="6" ry="6" fill={sk.base} />
      {/* Right hand */}
      <ellipse cx="96" cy="111" rx="5" ry="5.5" fill={sk.base} />
      <path d="M92 109 Q91 115 93 118" stroke={sk.mid} strokeWidth="1" fill="none" />
      <path d="M96 109 Q95 116 97 119" stroke={sk.mid} strokeWidth="1" fill="none" />
      <path d="M100 108 Q100 115 99 117" stroke={sk.mid} strokeWidth="1" fill="none" />

      {/* Arm muscle shadow */}
      <path d="M28 82 Q25 92 24 100" stroke={sk.shadow} strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M92 82 Q95 92 96 100" stroke={sk.shadow} strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* === TANK TOP === */}
      {/* Main body */}
      <path d="M36 60 Q60 55 84 60 L84 97 Q60 102 36 97 Z" fill={oc.shirt} />
      {/* Shoulder straps */}
      <path d="M44 52 L40 65 L50 67 L52 52 Z" fill={oc.shirt} />
      <path d="M76 52 L80 65 L70 67 L68 52 Z" fill={oc.shirt} />
      {/* Center seam */}
      <path d="M60 57 L60 97" stroke={oc.shirtDark} strokeWidth="1" opacity="0.4" fill="none" />
      {/* Side shadows */}
      <path d="M38 62 Q36 80 37 95" stroke={oc.shirtDark} strokeWidth="2.5" opacity="0.3" fill="none" />
      <path d="M82 62 Q84 80 83 95" stroke={oc.shirtDark} strokeWidth="2.5" opacity="0.3" fill="none" />
      {/* Chest highlight */}
      <path d="M45 60 Q60 57 75 60" stroke="white" strokeWidth="1.5" opacity="0.25" fill="none" />
      {/* Neck opening */}
      <path d="M50 52 Q60 56 70 52" fill={oc.shirt} />

      {/* Muscle definition - pecs */}
      <path d="M44 68 Q52 65 57 70 Q55 78 47 78 Q40 76 44 68" fill={oc.shirtDark} opacity="0.12" />
      <path d="M76 68 Q68 65 63 70 Q65 78 73 78 Q80 76 76 68" fill={oc.shirtDark} opacity="0.12" />

      {/* === NECK === */}
      <path d="M50 48 Q60 44 70 48 L68 58 Q60 55 52 58 Z" fill={sk.base} />
      {/* Neck shadow */}
      <path d="M52 50 Q60 47 68 50" stroke={sk.shadow} strokeWidth="0.8" opacity="0.3" fill="none" />

      {/* === HEAD === */}
      {/* Head shape */}
      <ellipse cx="60" cy="32" rx="22" ry="24" fill={`url(#skin-face-${Object.keys(SKIN).find(k => SKIN[k] === sk) || 'light'})`} />
      <ellipse cx="60" cy="32" rx="22" ry="24" fill={sk.base} />

      {/* Jaw */}
      <path d="M40 38 Q60 54 80 38" stroke={sk.mid} strokeWidth="1" fill="none" opacity="0.4" />

      {/* Ears */}
      <ellipse cx="38" cy="33" rx="4" ry="5.5" fill={sk.base} />
      <ellipse cx="82" cy="33" rx="4" ry="5.5" fill={sk.base} />
      <ellipse cx="38" cy="33" rx="2.5" ry="3.5" fill={sk.mid} opacity="0.4" />
      <ellipse cx="82" cy="33" rx="2.5" ry="3.5" fill={sk.mid} opacity="0.4" />

      {/* === HAIR === */}
      {/* Hair base */}
      <path d="M39 25 Q42 10 60 8 Q78 10 81 25 Q78 15 60 13 Q42 15 39 25" fill={hc.base} />
      <path d="M39 26 Q38 20 40 16 Q42 10 60 8 Q78 10 80 16 Q82 20 81 26" fill={hc.base} />
      {/* Hair highlight */}
      <path d="M48 11 Q60 8 72 11" stroke={hc.hi} strokeWidth="1.5" opacity="0.6" fill="none" />
      {/* Side hair */}
      <path d="M39 22 Q37 28 38 34" stroke={hc.base} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M81 22 Q83 28 82 34" stroke={hc.base} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* === EYES === */}
      {/* Eye whites */}
      <ellipse cx="50" cy="33" rx="6" ry="5.5" fill="white" />
      <ellipse cx="70" cy="33" rx="6" ry="5.5" fill="white" />
      {/* Iris */}
      <circle cx="51" cy="33" r="3.8" fill="#3D2B1F" />
      <circle cx="71" cy="33" r="3.8" fill="#3D2B1F" />
      {/* Pupil */}
      <circle cx="51" cy="33" r="2.2" fill="#1A1A1A" />
      <circle cx="71" cy="33" r="2.2" fill="#1A1A1A" />
      {/* Eye shine */}
      <circle cx="52.5" cy="31.5" r="1.1" fill="white" />
      <circle cx="72.5" cy="31.5" r="1.1" fill="white" />
      {/* Eyelid top */}
      <path d="M44 31 Q50 28 56 31" stroke="#2C1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M64 31 Q70 28 76 31" stroke="#2C1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Eyelid bottom subtle */}
      <path d="M45 35.5 Q50 37 55 35.5" stroke={sk.mid} strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d="M65 35.5 Q70 37 75 35.5" stroke={sk.mid} strokeWidth="0.7" fill="none" opacity="0.5" />

      {/* Eyebrows */}
      <path d="M44 27.5 Q50 25 56 27" stroke={hc.mid} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M64 27 Q70 25 76 27.5" stroke={hc.mid} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M57 38 Q60 43 63 38" stroke={sk.shadow} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="57.5" cy="40" rx="2" ry="1.2" fill={sk.mid} opacity="0.4" />
      <ellipse cx="62.5" cy="40" rx="2" ry="1.2" fill={sk.mid} opacity="0.4" />

      {/* Smile */}
      <path d="M50 45 Q60 51 70 45" stroke={sk.shadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M52 46 Q60 50 68 46 Q60 50 52 46" fill="white" opacity="0.9" />

      {/* Cheeks */}
      <ellipse cx="42" cy="40" rx="5.5" ry="3" fill="#FFB3A0" opacity="0.35" />
      <ellipse cx="78" cy="40" rx="5.5" ry="3" fill="#FFB3A0" opacity="0.35" />

      {/* Chin shadow */}
      <ellipse cx="60" cy="51" rx="8" ry="2.5" fill={sk.mid} opacity="0.2" />
    </g>
  );
}

function FemaleBody({ sk, oc, hc }) {
  return (
    <g>
      {/* === SHOES === */}
      <ellipse cx="44" cy="158" rx="13" ry="6" fill="#E8E8E8" />
      <ellipse cx="76" cy="158" rx="13" ry="6" fill="#E8E8E8" />
      <ellipse cx="44" cy="155" rx="11" ry="5" fill="white" />
      <ellipse cx="76" cy="155" rx="11" ry="5" fill="white" />

      {/* === LEGGINGS === */}
      {/* Left leg */}
      <path d="M44 118 Q40 136 39 152 Q43 155 47 152 Q49 136 52 118 Z" fill={oc.shorts} />
      {/* Right leg */}
      <path d="M76 118 Q80 136 81 152 Q77 155 73 152 Q71 136 68 118 Z" fill={oc.shorts} />
      {/* Legging highlight */}
      <path d="M42 120 Q41 136 40 150" stroke="white" strokeWidth="1" opacity="0.15" fill="none" />
      <path d="M78 120 Q79 136 80 150" stroke="white" strokeWidth="1" opacity="0.15" fill="none" />

      {/* === SPORTS BRA / TOP === */}
      {/* Main sports bra */}
      <path d="M38 72 Q60 67 82 72 L80 92 Q60 96 40 92 Z" fill={oc.shirt} />
      {/* Straps */}
      <path d="M48 55 L44 72 L52 73 L54 55 Z" fill={oc.shirt} />
      <path d="M72 55 L76 72 L68 73 L66 55 Z" fill={oc.shirt} />
      {/* Waist area (midriff) */}
      <path d="M42 92 Q60 96 78 92 L78 106 Q60 110 42 106 Z" fill={sk.base} />
      {/* Waist highlight */}
      <path d="M44 95 Q60 99 76 95" stroke="white" strokeWidth="0.8" opacity="0.2" fill="none" />
      {/* Leggings high waist */}
      <path d="M38 105 Q60 110 82 105 L82 122 Q60 127 38 122 Z" fill={oc.shorts} />
      {/* Leggings waistband */}
      <path d="M38 105 Q60 108 82 105 L82 110 Q60 113 38 110 Z" fill={oc.shortsDark} />

      {/* Shirt highlight */}
      <path d="M44 72 Q60 68 76 72" stroke="white" strokeWidth="1.5" opacity="0.25" fill="none" />
      {/* Side shadow */}
      <path d="M40 73 Q38 82 39 91" stroke={oc.shirtDark} strokeWidth="2" opacity="0.3" fill="none" />
      <path d="M80 73 Q82 82 81 91" stroke={oc.shirtDark} strokeWidth="2" opacity="0.3" fill="none" />

      {/* === ARMS === */}
      {/* Left arm */}
      <path d="M40 73 Q27 83 25 100 Q23 108 28 110 Q33 112 35 105 Q37 87 43 76" fill={sk.base} />
      <ellipse cx="27" cy="109" rx="5.5" ry="5.5" fill={sk.base} />
      {/* Left hand */}
      <ellipse cx="27" cy="111" rx="4.5" ry="5" fill={sk.base} />
      <path d="M23 109 Q22 115 24 118" stroke={sk.mid} strokeWidth="0.8" fill="none" />
      <path d="M27 109 Q26 116 28 118" stroke={sk.mid} strokeWidth="0.8" fill="none" />
      <path d="M31 108 Q31 114 30 117" stroke={sk.mid} strokeWidth="0.8" fill="none" />

      {/* Right arm */}
      <path d="M80 73 Q93 83 95 100 Q97 108 92 110 Q87 112 85 105 Q83 87 77 76" fill={sk.base} />
      <ellipse cx="93" cy="109" rx="5.5" ry="5.5" fill={sk.base} />
      {/* Right hand */}
      <ellipse cx="93" cy="111" rx="4.5" ry="5" fill={sk.base} />
      <path d="M89 109 Q88 115 90 118" stroke={sk.mid} strokeWidth="0.8" fill="none" />
      <path d="M93 109 Q92 116 94 118" stroke={sk.mid} strokeWidth="0.8" fill="none" />
      <path d="M97 108 Q97 114 96 117" stroke={sk.mid} strokeWidth="0.8" fill="none" />

      {/* === NECK === */}
      <path d="M52 48 Q60 44 68 48 L67 57 Q60 54 53 57 Z" fill={sk.base} />

      {/* === HEAD === */}
      <ellipse cx="60" cy="31" rx="21" ry="22" fill={sk.base} />

      {/* Ears */}
      <ellipse cx="39" cy="32" rx="3.5" ry="5" fill={sk.base} />
      <ellipse cx="81" cy="32" rx="3.5" ry="5" fill={sk.base} />
      <ellipse cx="39" cy="32" rx="2" ry="3" fill={sk.mid} opacity="0.4" />
      <ellipse cx="81" cy="32" rx="2" ry="3" fill={sk.mid} opacity="0.4" />

      {/* === LONG HAIR BACK === */}
      <path d="M40 22 Q35 50 36 90 Q40 95 44 90 Q42 55 44 25" fill={hc.base} />
      <path d="M80 22 Q85 50 84 90 Q80 95 76 90 Q78 55 76 25" fill={hc.base} />
      {/* Hair volume sides */}
      <path d="M38 30 Q33 55 35 80" stroke={hc.mid} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M82 30 Q87 55 85 80" stroke={hc.mid} strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Hair top */}
      <path d="M40 22 Q42 8 60 6 Q78 8 80 22 Q76 13 60 11 Q44 13 40 22" fill={hc.base} />
      <path d="M40 22 Q40 12 60 10 Q80 12 80 22 Q78 16 60 14 Q42 16 40 22" fill={hc.base} />
      {/* Hair highlight */}
      <path d="M48 9 Q60 6 72 9" stroke={hc.hi} strokeWidth="1.5" opacity="0.6" fill="none" />

      {/* === EYES === */}
      <ellipse cx="49" cy="31" rx="6" ry="5.5" fill="white" />
      <ellipse cx="71" cy="31" rx="6" ry="5.5" fill="white" />
      <circle cx="50" cy="31" r="3.8" fill="#3D2B1F" />
      <circle cx="72" cy="31" r="3.8" fill="#3D2B1F" />
      <circle cx="50" cy="31" r="2.2" fill="#1A1A1A" />
      <circle cx="72" cy="31" r="2.2" fill="#1A1A1A" />
      <circle cx="51.5" cy="29.5" r="1.1" fill="white" />
      <circle cx="73.5" cy="29.5" r="1.1" fill="white" />
      {/* Eyelashes */}
      <path d="M43 29 Q49 26 55 29" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M65 29 Q71 26 77 29" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyebrow - softer for female */}
      <path d="M43 25.5 Q49 23 55 25" stroke={hc.base} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M65 25 Q71 23 77 25.5" stroke={hc.base} strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M58 37 Q60 41 62 37" stroke={sk.shadow} strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="58" cy="39" rx="1.5" ry="1" fill={sk.mid} opacity="0.35" />
      <ellipse cx="62" cy="39" rx="1.5" ry="1" fill={sk.mid} opacity="0.35" />

      {/* Smile */}
      <path d="M51 43 Q60 49 69 43" stroke={sk.shadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M53 44 Q60 48 67 44" fill="white" opacity="0.9" />

      {/* Cheeks */}
      <ellipse cx="41" cy="38" rx="5" ry="2.8" fill="#FFB3BA" opacity="0.5" />
      <ellipse cx="79" cy="38" rx="5" ry="2.8" fill="#FFB3BA" opacity="0.5" />

      {/* Chin shadow */}
      <ellipse cx="60" cy="49" rx="7" ry="2" fill={sk.mid} opacity="0.2" />
    </g>
  );
}

// Re-export skin/outfit/hair constants for use in pickers
export const SKIN_TONES = Object.keys(SKIN);
export const OUTFIT_OPTIONS = Object.keys(OUTFIT);
export const HAIR_OPTIONS = Object.keys(HAIR);
export { SKIN, OUTFIT, HAIR };
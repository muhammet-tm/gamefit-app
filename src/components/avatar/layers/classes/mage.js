// MAGE — orb staff in the right fist, rune sash, deep hood, arcane ring.
// v2: the hood is a real hood (peak, rim shadow, shoulder cascade).

export default {
  gear: {
    1: [
      // staff aligned with the right fist (149,166)
      { slot: 'gear', d: `M146,72 L152,72 L154,240 L148,240 Z`, fill: '#4A3020' },
      { slot: 'gear', d: `M149,72 L152,72 L154,240 L151,240 Z`, fill: '#3A2517' },
      // head cradle + orb
      { slot: 'gear', d: `M141,68 C141,58 157,58 157,68 C157,73 153,76 149,76 C145,76 141,73 141,68 Z`,
        fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M149,54 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M145,49 a3.5,3.5 0 1,1 7,2.4 a5,5 0 0,0 -7,-2.4`, fill: '#CBB7FF', opacity: 0.9 },
      // sash across the chest
      { slot: 'gear', d: `M128,76 L74,126 L79,135 L132,85 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M103,99 L74,126 L79,135 L107,108 Z`, fill: 'var(--av-c2)' },
    ],
    2: [
      // layered shoulder cape
      { slot: 'gear', d: `M62,86 C66,70 82,60 100,60 C118,60 134,70 138,86 L133,96 C128,82 115,74 100,74
          C85,74 72,82 67,96 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M112,62 C124,66 133,74 138,86 L133,96 C129,84 120,77 110,74 Z`, fill: '#2E1F5C' },
      { slot: 'gear', d: `M67,96 C72,88 78,83 86,80 L84,90 C78,92 72,96 69,101 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M133,96 C128,88 122,83 114,80 L116,90 C122,92 128,96 131,101 Z`, fill: 'var(--av-c1)' },
      // rune belt + tome
      { slot: 'gear', d: `M76,128 L124,128 L125,139 L75,139 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M70,138 L86,138 L86,158 L70,158 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M70,138 L86,138 L86,143 L70,143 Z`, fill: 'var(--av-metal)' },
      { slot: 'gear', d: `M77,146 L79,150 L77,154 L75,150 Z`, fill: 'var(--av-metal)' },
    ],
    3: [
      // orb charge + drifting runes + belt glyphs
      { slot: 'gear', d: `M149,54 m-4.5,0 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0`,
        fill: 'var(--av-glow)', opacity: 0.95 },
      { slot: 'auraF', d: `M162,88 l4.5,6 -4.5,6 -4.5,-6 Z`, fill: 'var(--av-glow)', opacity: 0.85 },
      { slot: 'auraF', d: `M136,108 l3.4,4.5 -3.4,4.5 -3.4,-4.5 Z`, fill: 'var(--av-glow)', opacity: 0.6 },
      { slot: 'auraF', d: `M160,132 l2.8,3.8 -2.8,3.8 -2.8,-3.8 Z`, fill: 'var(--av-glow)', opacity: 0.45 },
      { slot: 'gear', d: `M92,131 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: 'var(--av-glow)' },
      { slot: 'gear', d: `M101,131 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: 'var(--av-glow)' },
      { slot: 'gear', d: `M110,131 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: 'var(--av-glow)' },
    ],
    4: [
      // deep hood: peak, wide rim, cascade onto the shoulders — face open
      { slot: 'head', hidesHair: true,
        d: `M100,2 C86,4 78,15 78,30 C78,42 82,51 89,56 L92,50 C87,45 85,36 87,27
          C90,17 95,13 100,13 C105,13 110,17 113,27 C115,36 113,45 108,50 L111,56 C118,51 122,42 122,30
          C122,15 114,4 100,2 Z`, fill: 'var(--av-c1)' },
      { slot: 'head', d: `M100,2 C114,4 122,15 122,30 C122,42 118,51 111,56 L108,50 C113,45 115,36 113,27
          C110,17 105,13 100,13 Z`, fill: 'var(--av-c2)' },
      // rim shadow over the brow
      { slot: 'head', d: `M87,26 C90,20 95,16 100,16 C105,16 110,20 113,26 C108,23 92,23 87,26 Z`,
        fill: '#1E1440', opacity: 0.85 },
      // cascade onto the shoulders
      { slot: 'head', d: `M86,52 C80,60 78,66 82,71 L118,71 C122,66 120,60 114,52 C108,60 92,60 86,52 Z`,
        fill: 'var(--av-c2)' },
    ],
    5: [
      // arcane ring aura + orbit runes
      { slot: 'auraB', d: `M100,150 m-74,0 a74,74 0 1,0 148,0 a74,74 0 1,0 -148,0
          M100,150 m-64,0 a64,64 0 1,1 128,0 a64,64 0 1,1 -128,0`,
        fill: '#9664FF', opacity: 0.3, aura: true, fillRule: 'evenodd' },
      { slot: 'auraB', d: `M100,150 m-57,0 a57,57 0 1,0 114,0 a57,57 0 1,0 -114,0
          M100,150 m-51,0 a51,51 0 1,1 102,0 a51,51 0 1,1 -102,0`,
        fill: 'var(--av-glow)', opacity: 0.35, aura: true, fillRule: 'evenodd' },
      { slot: 'auraB', d: `M100,70 l5.5,8 -5.5,8 -5.5,-8 Z`, fill: 'var(--av-glow)', opacity: 0.75, aura: true },
      { slot: 'auraB', d: `M100,214 l5.5,8 -5.5,8 -5.5,-8 Z`, fill: 'var(--av-glow)', opacity: 0.75, aura: true },
      { slot: 'auraB', d: `M26,142 l5.5,8 -5.5,8 -5.5,-8 Z`, fill: '#9664FF', opacity: 0.75, aura: true },
      { slot: 'auraB', d: `M174,142 l5.5,8 -5.5,8 -5.5,-8 Z`, fill: '#9664FF', opacity: 0.75, aura: true },
    ],
  },
};

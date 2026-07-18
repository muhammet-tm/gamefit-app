// ARCHER — recurve bow held at the left side (fully visible), quiver over
// the right shoulder, bracers, pointed cowl, wind aura.
// v2: the bow is now a real silhouette element gripped by the left fist.

export default {
  gear: {
    1: [
      // recurve stave: tall arc through the left fist (52,166)
      { slot: 'back', d: `M60,62 C38,96 32,152 46,212 C48,219 56,218 55,211 C44,156 48,104 66,68
          C69,62 63,56 60,62 Z`, fill: '#4A3020' },
      { slot: 'back', d: `M63,60 C66,60 68,64 66,68 C55,90 50,116 50,142 L45,142 C46,112 52,82 63,60 Z`,
        fill: '#3A2517' },
      // recurve tips
      { slot: 'back', d: `M58,56 C62,50 70,50 72,56 C68,56 63,58 60,62 Z`, fill: '#3A2517' },
      { slot: 'back', d: `M44,214 C40,220 44,228 51,228 C48,224 46,219 47,214 Z`, fill: '#3A2517' },
      // string
      { slot: 'back', d: `M62,60 L48,214 L50,215 L64,61 Z`, fill: '#D8DCE6', opacity: 0.85 },
      // quiver strap across the chest
      { slot: 'gear', d: `M74,78 L128,120 L124,129 L70,87 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M100,98 L128,120 L124,129 L96,107 Z`, fill: 'var(--av-c2)' },
    ],
    2: [
      // quiver over the right shoulder + arrows in open air
      { slot: 'back', d: `M124,40 L144,48 L134,96 L116,90 Z`, fill: 'var(--av-c2)' },
      { slot: 'back', d: `M135,44 L144,48 L134,96 L126,93 Z`, fill: '#1D3520' },
      // arrow shafts + fletchings rising past the head line
      { slot: 'back', d: `M128,42 L131,20 L134,42 Z`, fill: '#8A6B45' },
      { slot: 'back', d: `M136,46 L142,26 L145,48 Z`, fill: '#8A6B45' },
      { slot: 'back', d: `M127,22 L131,12 L136,24 L131,28 Z`, fill: 'var(--av-c1)' },
      { slot: 'back', d: `M138,28 L144,18 L148,30 L142,34 Z`, fill: '#5B8A54' },
      // bracers
      { slot: 'gear', d: `M50,138 L64,142 L61,154 L47,150 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M136,142 L150,138 L153,150 L139,154 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M50,142 L63,146 L62,149 L49,145 Z`, fill: 'var(--av-metal)' },
      { slot: 'gear', d: `M137,146 L150,142 L151,145 L138,149 Z`, fill: 'var(--av-metal)' },
    ],
    3: [
      // energy fletching + charged string + strap studs
      { slot: 'back', d: `M126,14 L131,4 L137,16 L131,21 Z`, fill: 'var(--av-glow)', opacity: 0.9 },
      { slot: 'back', d: `M62,60 L52,166 L55,166 L64,61 Z`, fill: 'var(--av-glow)', opacity: 0.55 },
      { slot: 'gear', d: `M96,102 m-2.2,0 a2.2,2.2 0 1,0 4.4,0 a2.2,2.2 0 1,0 -4.4,0`, fill: 'var(--av-glow)' },
      { slot: 'gear', d: `M110,112 m-2.2,0 a2.2,2.2 0 1,0 4.4,0 a2.2,2.2 0 1,0 -4.4,0`, fill: 'var(--av-glow)' },
    ],
    4: [
      // pointed cowl with short shoulder cape — face open
      { slot: 'head', hidesHair: true,
        d: `M100,0 C86,3 78,14 79,30 C80,42 84,51 90,56 L93,50 C88,44 86,35 88,26
          C91,16 96,12 100,12 C104,12 109,16 112,26 C114,35 112,44 107,50 L110,56 C116,51 120,42 121,30
          C122,14 114,3 100,0 Z`, fill: 'var(--av-c1)' },
      { slot: 'head', d: `M100,0 C114,3 122,14 121,30 C120,42 116,51 110,56 L107,50 C112,44 114,35 112,26
          C109,16 104,12 100,12 Z`, fill: 'var(--av-c2)' },
      { slot: 'head', d: `M88,25 C91,19 95,15 100,15 C105,15 109,19 112,25 C107,22 93,22 88,25 Z`,
        fill: '#14240F', opacity: 0.85 },
      { slot: 'head', d: `M87,52 C81,60 79,66 83,71 L117,71 C121,66 119,60 113,52 C107,60 93,60 87,52 Z`,
        fill: 'var(--av-c2)' },
    ],
    5: [
      // wind streams + drifting leaves
      { slot: 'auraB', d: `M26,118 C48,108 76,106 100,114 C76,118 54,126 38,138 C28,142 22,126 26,118 Z`,
        fill: 'var(--av-glow)', opacity: 0.3, aura: true },
      { slot: 'auraB', d: `M174,92 C154,82 128,82 106,92 C128,94 150,102 164,112 C174,116 180,100 174,92 Z`,
        fill: 'var(--av-glow)', opacity: 0.3, aura: true },
      { slot: 'auraB', d: `M32,184 C56,176 84,178 106,190 C82,192 60,198 44,208 C32,212 26,192 32,184 Z`,
        fill: '#9664FF', opacity: 0.25, aura: true },
      { slot: 'auraB', d: `M172,168 C154,158 128,158 108,168 C128,170 148,178 160,188 C172,192 178,176 172,168 Z`,
        fill: '#9664FF', opacity: 0.25, aura: true },
      { slot: 'auraF', d: `M58,98 c4,-7 12,-7 14,0 c-5,5 -11,5 -14,0 Z`, fill: 'var(--av-glow)', opacity: 0.55 },
      { slot: 'auraF', d: `M148,198 c4,-7 12,-7 14,0 c-5,5 -11,5 -14,0 Z`, fill: 'var(--av-glow)', opacity: 0.45 },
    ],
  },
};

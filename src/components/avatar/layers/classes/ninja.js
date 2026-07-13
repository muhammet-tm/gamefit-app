// NINJA — katana slung across the back (hilt over the left shoulder, blade
// past the right hip), flowing scarf, half-mask + headband, shadow wisps.
// v2: the katana and scarf are now real silhouette elements.

export default {
  gear: {
    1: [
      // dual katana grips crossed over both shoulders (blades sheathed on
      // the back — the crossed hilts ARE the silhouette)
      { slot: 'back', d: `M54,34 C51,31 55,25 59,28 L74,50 L68,56 Z`, fill: '#1C202A' },
      { slot: 'back', d: `M56,32 L72,52 M60,28 L76,48`, stroke: '#3E4454', strokeWidth: 1.6, fill: 'none' },
      { slot: 'back', d: `M68,52 C72,48 78,48 81,52 C84,56 84,61 80,64 C76,67 70,66 68,62 C66,59 66,55 68,52 Z`,
        fill: 'var(--av-c2)' },
      { slot: 'back', d: `M146,34 C149,31 145,25 141,28 L126,50 L132,56 Z`, fill: '#1C202A' },
      { slot: 'back', d: `M144,32 L128,52 M140,28 L124,48`, stroke: '#3E4454', strokeWidth: 1.6, fill: 'none' },
      { slot: 'back', d: `M132,52 C128,48 122,48 119,52 C116,56 116,61 120,64 C124,67 130,66 132,62 C134,59 134,55 132,52 Z`,
        fill: 'var(--av-c2)' },
      // sheath lines peeking at both sides of the waist
      { slot: 'back', d: `M70,120 L60,146 L66,149 L76,124 Z`, fill: '#1C202A' },
      { slot: 'back', d: `M130,120 L140,146 L134,149 L124,124 Z`, fill: '#12151D' },
      // waist wrap + knot tails
      { slot: 'gear', d: `M76,128 L124,128 L125,141 L75,141 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M76,134 L124,134 L124,137 L76,137 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M75,136 C68,145 65,156 68,168 C73,161 78,150 80,141 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M80,138 C76,146 74,155 76,164 C80,158 83,148 84,141 Z`, fill: '#1C202A' },
      // forearm wraps
      { slot: 'gear', d: `M50,140 L64,144 L61,156 L47,152 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M136,144 L150,140 L153,152 L139,156 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M50,145 L63,149 L62,152 L49,148 Z`, fill: '#12151D' },
      { slot: 'gear', d: `M137,148 L150,144 L151,147 L138,151 Z`, fill: '#12151D' },
    ],
    2: [
      // scarf: neck wrap + big tail streaming left
      { slot: 'gear', d: `M85,56 C91,64 109,64 115,56 C119,60 120,68 116,73 C107,80 93,80 84,73
          C80,68 81,60 85,56 Z`, fill: 'var(--av-c1)' },
      { slot: 'back', d: `M86,62 C70,68 52,82 42,102 C52,98 66,88 76,78 C82,72 86,68 86,62 Z`,
        fill: 'var(--av-c1)' },
      { slot: 'back', d: `M84,68 C72,78 60,94 54,110 C64,104 74,92 82,80 C85,76 86,72 84,68 Z`,
        fill: 'var(--av-c2)' },
      // shin guards
      { slot: 'gear', d: `M80,206 L98,206 L97,232 L82,232 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M103,206 L121,206 L119,232 L104,232 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M80,206 L98,206 L98,210 L80,210 Z`, fill: '#12151D' },
      { slot: 'gear', d: `M103,206 L121,206 L121,210 L103,210 Z`, fill: '#12151D' },
    ],
    3: [
      // glowing seams
      { slot: 'gear', d: `M76,134 L124,134 L124,136 L76,136 Z`, fill: 'var(--av-glow)', opacity: 0.9 },
      { slot: 'gear', d: `M50,146 L63,150 L62,153 L49,149 Z`, fill: 'var(--av-glow)', opacity: 0.7 },
      { slot: 'gear', d: `M137,149 L150,145 L151,148 L138,152 Z`, fill: 'var(--av-glow)', opacity: 0.7 },
      { slot: 'back', d: `M68,52 C72,48 78,48 81,52 L79,55 C76,52 72,52 70,55 Z`,
        fill: 'var(--av-glow)', opacity: 0.8 },
      { slot: 'back', d: `M132,52 C128,48 122,48 119,52 L121,55 C124,52 128,52 130,55 Z`,
        fill: 'var(--av-glow)', opacity: 0.8 },
      { slot: 'gear', d: `M80,208 L98,208 L98,209.5 L80,209.5 Z`, fill: 'var(--av-glow)', opacity: 0.6 },
      { slot: 'gear', d: `M103,208 L121,208 L121,209.5 L103,209.5 Z`, fill: 'var(--av-glow)', opacity: 0.6 },
    ],
    4: [
      // half-mask covering the lower face
      { slot: 'head', d: `M84,40 C87,49 93,55 100,55 C107,55 113,49 116,40 C117,47 114,54 108,58
          C103,61 97,61 92,58 C86,54 83,47 84,40 Z`, fill: 'var(--av-c1)' },
      { slot: 'head', d: `M100,55 C107,55 113,49 116,40 C117,47 114,54 108,58 C105,60 102,61 100,61 Z`,
        fill: 'var(--av-c2)' },
      // headband + knot + streaming tails
      { slot: 'head', d: `M82,24 L118,24 L118,32 L82,32 Z`, fill: 'var(--av-c2)' },
      { slot: 'head', d: `M82,24 L118,24 L118,26.5 L82,26.5 Z`, fill: 'var(--av-glow)', opacity: 0.55 },
      { slot: 'head', d: `M116,27 m-3.5,0 a3.5,3.5 0 1,0 7,0 a3.5,3.5 0 1,0 -7,0`, fill: 'var(--av-c1)' },
      // tails stream right, away from the katana grip
      { slot: 'back', d: `M118,26 C130,24 142,28 150,38 C140,38 130,36 122,32 C119,30 117,28 118,26 Z`,
        fill: 'var(--av-c2)' },
      { slot: 'back', d: `M118,30 C128,34 138,44 142,56 C133,50 125,42 120,36 C118,34 117,32 118,30 Z`,
        fill: '#1C202A' },
    ],
    5: [
      // shadow wisps
      { slot: 'auraB', d: `M50,222 C34,196 32,158 46,126 C48,144 54,158 64,166 C56,142 60,110 78,88
          C74,112 78,132 88,146 C74,160 62,188 62,214 C60,224 54,230 50,222 Z`,
        fill: 'var(--av-glow)', opacity: 0.22, aura: true },
      { slot: 'auraB', d: `M150,222 C166,196 168,158 154,126 C152,144 146,158 136,166 C144,142 140,110 122,88
          C126,112 122,132 112,146 C126,160 138,188 138,214 C140,224 146,230 150,222 Z`,
        fill: '#9664FF', opacity: 0.22, aura: true },
      { slot: 'auraF', d: `M60,106 c2,-9 12,-11 16,-4 c-7,0 -12,4 -16,4 Z`, fill: 'var(--av-glow)', opacity: 0.4 },
      { slot: 'auraF', d: `M140,118 c-2,-9 -12,-11 -16,-4 c7,0 12,4 16,4 Z`, fill: '#9664FF', opacity: 0.4 },
    ],
  },
};

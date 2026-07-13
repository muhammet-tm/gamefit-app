// KNIGHT — hip sword, contoured steel breastplate, full helm with plume,
// radiant aura. v2: darker steel with edge highlights, plate follows the
// V-taper, helm actually encloses the head.

const STEEL = '#8A93A8';
const STEEL_DARK = '#5E667A';
const STEEL_EDGE = '#B8C2D6';

export default {
  gear: {
    1: [
      // scabbard angled out from the left hip
      { slot: 'back', d: `M72,138 L82,142 L62,200 C60,206 52,204 54,198 Z`, fill: 'var(--av-c2)' },
      { slot: 'back', d: `M77,140 L82,142 L62,200 C61,203 58,204 56,203 C63,182 71,158 77,140 Z`,
        fill: '#22334A' },
      { slot: 'back', d: `M57,192 L66,196 L64,202 L55,198 Z`, fill: STEEL },
      // hilt: crossguard, grip, pommel
      { slot: 'gear', d: `M64,132 L88,142 L86,149 L62,139 Z`, fill: STEEL },
      { slot: 'gear', d: `M78,128 L86,131 L82,143 C81,147 74,145 76,140 Z`, fill: '#4A3020' },
      { slot: 'gear', d: `M81,124 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0`, fill: STEEL_EDGE },
      // baldric strap
      { slot: 'gear', d: `M126,78 L72,128 L77,137 L130,87 Z`, fill: 'var(--av-c2)' },
    ],
    2: [
      // contoured breastplate with center ridge + waist cut
      { slot: 'gear', d: `M68,82 C74,70 86,64 100,64 C114,64 126,70 132,82 L128,104 C126,116 123,126 120,134
          L80,134 C77,126 74,116 72,104 Z`, fill: STEEL },
      { slot: 'gear', d: `M110,66 C121,69 129,75 132,82 L128,104 C126,118 123,128 120,134 L105,134
          C111,120 114,102 114,88 C114,79 113,71 110,66 Z`, fill: STEEL_DARK },
      // top edge highlight + center ridge
      { slot: 'gear', d: `M68,82 C74,70 86,64 100,64 C114,64 126,70 132,82 L129,84 C123,73 112,68 100,68
          C88,68 77,73 71,84 Z`, fill: STEEL_EDGE },
      { slot: 'gear', d: `M98,68 L102,68 L101,134 L99,134 Z`, fill: STEEL_DARK },
      // abdominal plate lines
      { slot: 'gear', d: `M80,112 C88,116 112,116 120,112 L119,116 C111,120 89,120 81,116 Z`, fill: STEEL_DARK },
      // pauldrons seated on the deltoids
      { slot: 'gear', d: `M45,84 C43,68 58,58 74,63 C82,66 86,73 85,81 C73,72 55,75 45,84 Z`, fill: STEEL },
      { slot: 'gear', d: `M155,84 C157,68 142,58 126,63 C118,66 114,73 115,81 C127,72 145,75 155,84 Z`,
        fill: STEEL_DARK },
      { slot: 'gear', d: `M52,74 C58,66 68,63 76,66 L74,70 C67,68 58,70 52,76 Z`, fill: STEEL_EDGE },
      // rivets
      { slot: 'gear', d: `M84,88 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: STEEL_DARK },
      { slot: 'gear', d: `M116,88 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: STEEL_EDGE },
    ],
    3: [
      // energy edges
      { slot: 'gear', d: `M99,70 L101,70 L101,132 L99,132 Z`, fill: 'var(--av-glow)', opacity: 0.8 },
      { slot: 'gear', d: `M45,84 C44,74 50,66 60,63 L61,67 C53,70 48,76 47,84 Z`,
        fill: 'var(--av-glow)', opacity: 0.85 },
      { slot: 'gear', d: `M155,84 C156,74 150,66 140,63 L139,67 C147,70 152,76 153,84 Z`,
        fill: 'var(--av-glow)', opacity: 0.6 },
      { slot: 'gear', d: `M80,112 C88,116 112,116 120,112 L120,114 C112,118 88,118 80,114 Z`,
        fill: 'var(--av-glow)', opacity: 0.5 },
    ],
    4: [
      // full helm enclosing the head: dome, visor slit, cheek guards
      { slot: 'head', hidesHair: true,
        d: `M81,32 C80,14 89,7 100,7 C111,7 120,14 119,32 C119,42 116,50 110,55
          C106,58 94,58 90,55 C84,50 81,42 81,32 Z`, fill: STEEL },
      { slot: 'head', d: `M100,7 C111,7 120,14 119,32 C119,42 116,50 110,55 C107,57 103,58 100,58
          C107,50 110,40 109,28 C109,18 105,10 100,7 Z`, fill: STEEL_DARK },
      // visor slit
      { slot: 'head', d: `M85,30 L115,30 L114,35 L86,35 Z`, fill: '#12151D' },
      { slot: 'head', d: `M85,30 L115,30 L115,31.5 L85,31.5 Z`, fill: STEEL_EDGE, opacity: 0.6 },
      // breath holes
      { slot: 'head', d: `M96,44 m-1.2,0 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0`, fill: '#12151D' },
      { slot: 'head', d: `M102,44 m-1.2,0 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0`, fill: '#12151D' },
      // plume arcing back
      { slot: 'head', d: `M94,10 C88,2 76,0 68,8 C74,8 80,10 84,14 C87,17 91,14 94,10 Z`,
        fill: 'var(--av-c1)' },
      { slot: 'head', d: `M94,10 C90,5 82,2 74,4 C80,6 86,10 89,14 Z`, fill: '#2A4058' },
    ],
    5: [
      // radiant burst — points reach well past the body silhouette
      { slot: 'auraB', d: `M100,150 m-76,0 a76,76 0 1,0 152,0 a76,76 0 1,0 -152,0`,
        fill: '#9664FF', opacity: 0.16, aura: true },
      { slot: 'auraB', d: `M100,40 L112,114 L184,128 L114,144 L126,224 L100,156 L74,224 L86,144 L16,128 L88,114 Z`,
        fill: 'var(--av-glow)', opacity: 0.3, aura: true },
      { slot: 'auraB', d: `M100,72 L108,118 L156,127 L108,138 L116,194 L100,146 L84,194 L92,138 L44,127 L92,118 Z`,
        fill: '#E8F1FF', opacity: 0.22, aura: true },
      // corner glints
      { slot: 'auraB', d: `M40,72 l4,6 -4,6 -4,-6 Z`, fill: 'var(--av-glow)', opacity: 0.6, aura: true },
      { slot: 'auraB', d: `M162,196 l4,6 -4,6 -4,-6 Z`, fill: '#9664FF', opacity: 0.6, aura: true },
    ],
  },
};

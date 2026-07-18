// Shop accessories as SVG layer sets, keyed by catalog id (matches the
// `accessories` DB table / AccessoryShop). Each renders on top of any
// class/tier combination. `animated: 'pulse'|'flicker'` gets a subtle
// CSS animation from Avatar.jsx (disabled for reduced motion).

export const ACCESSORY_LAYERS = {
  halo: {
    slot: 'head',
    animated: 'pulse',
    paths: [
      { d: `M100,9 m-24,0 a24,9 0 1,0 48,0 a24,9 0 1,0 -48,0
            M100,9 m-18,0 a18,6 0 1,1 36,0 a18,6 0 1,1 -36,0`,
        fill: '#FFD700', fillRule: 'evenodd' },
      { d: `M100,9 m-24,0 a24,9 0 1,0 48,0 a24,9 0 1,0 -48,0
            M100,9 m-21,0 a21,7.5 0 1,1 42,0 a21,7.5 0 1,1 -42,0`,
        fill: '#FFF3B0', fillRule: 'evenodd', opacity: 0.7 },
    ],
  },
  crown: {
    slot: 'head',
    paths: [
      { d: `M82,14 L88,2 L96,10 L100,0 L104,10 L112,2 L118,14 L116,20 L84,20 Z`, fill: '#FFD700' },
      { d: `M84,20 L116,20 L115,25 L85,25 Z`, fill: '#E0A800' },
      { d: `M100,8 m-2.5,0 a2.5,2.5 0 1,0 5,0 a2.5,2.5 0 1,0 -5,0`, fill: '#B33A2B' },
      { d: `M89,15 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0`, fill: '#388BFF' },
      { d: `M111,15 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0`, fill: '#388BFF' },
    ],
  },
  flames: {
    slot: 'auraF',
    animated: 'flicker',
    paths: [
      { d: `M56,180 C48,160 50,138 60,122 C60,134 64,142 70,146 C66,130 70,112 80,100
            C78,116 82,128 90,136 C80,148 72,164 70,182 C66,190 58,188 56,180 Z`,
        fill: '#FF8C00', opacity: 0.55 },
      { d: `M144,180 C152,160 150,138 140,122 C140,134 136,142 130,146 C134,130 130,112 120,100
            C122,116 118,128 110,136 C120,148 128,164 130,182 C134,190 142,188 144,180 Z`,
        fill: '#FF8C00', opacity: 0.55 },
      { d: `M62,172 C58,158 60,144 66,134 C67,144 70,150 74,154 C72,162 68,170 68,178 C66,182 63,178 62,172 Z`,
        fill: '#FFB800', opacity: 0.7 },
      { d: `M138,172 C142,158 140,144 134,134 C133,144 130,150 126,154 C128,162 132,170 132,178 C134,182 137,178 138,172 Z`,
        fill: '#FFB800', opacity: 0.7 },
    ],
  },
  lightning: {
    slot: 'auraF',
    animated: 'flicker',
    paths: [
      { d: `M58,96 L70,96 L62,120 L74,120 L54,156 L60,128 L48,128 Z`, fill: '#FFE24D', opacity: 0.85 },
      { d: `M142,96 L130,96 L138,120 L126,120 L146,156 L140,128 L152,128 Z`, fill: '#FFE24D', opacity: 0.85 },
      { d: `M70,70 L78,70 L73,84 L81,84 L68,106 L72,90 L64,90 Z`, fill: '#C8FF00', opacity: 0.6 },
      { d: `M130,70 L122,70 L127,84 L119,84 L132,106 L128,90 L136,90 Z`, fill: '#C8FF00', opacity: 0.6 },
    ],
  },
  shield_glow: {
    slot: 'gear',
    animated: 'pulse',
    paths: [
      { d: `M46,108 C46,98 54,92 64,92 C74,92 82,98 82,108 C82,124 74,136 64,140 C54,136 46,124 46,108 Z`,
        fill: '#388BFF', opacity: 0.9 },
      { d: `M50,108 C50,101 56,96 64,96 C72,96 78,101 78,108 C78,121 71,131 64,135 C57,131 50,121 50,108 Z`,
        fill: '#2A3F5C' },
      { d: `M64,100 L68,110 L64,126 L60,110 Z`, fill: '#7FB4FF', opacity: 0.9 },
    ],
  },
  sword_glow: {
    slot: 'gear',
    animated: 'pulse',
    paths: [
      { d: `M150,90 L156,96 L128,160 C126,164 120,162 121,158 Z`, fill: '#C8FF00', opacity: 0.9 },
      { d: `M152,92 L156,96 L128,160 C127,162 125,163 123,162 Z`, fill: '#8FBF00', opacity: 0.9 },
      { d: `M144,96 L160,104 L157,109 L141,101 Z`, fill: '#4A5065' },
      { d: `M154,86 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0`, fill: '#C8FF00', opacity: 0.6 },
    ],
  },
  wings: {
    slot: 'back',
    animated: 'pulse',
    paths: [
      { d: `M78,86 C54,72 28,74 12,92 C28,94 40,100 48,108 C36,110 26,116 20,124 C34,126 48,124 60,118
            C50,126 44,136 42,146 C58,140 72,128 80,112 C84,104 84,94 78,86 Z`,
        fill: '#E8ECF4' },
      { d: `M122,86 C146,72 172,74 188,92 C172,94 160,100 152,108 C164,110 174,116 180,124 C166,126 152,124 140,118
            C150,126 156,136 158,146 C142,140 128,128 120,112 C116,104 116,94 122,86 Z`,
        fill: '#C9CEDC' },
      { d: `M78,86 C62,77 44,75 30,82 C44,84 58,92 66,102 C70,96 74,90 78,86 Z`, fill: '#FFFFFF', opacity: 0.7 },
      { d: `M122,86 C138,77 156,75 170,82 C156,84 142,92 134,102 C130,96 126,90 122,86 Z`, fill: '#FFFFFF', opacity: 0.5 },
    ],
  },
  cape: {
    slot: 'back',
    paths: [
      { d: `M74,74 C66,120 64,180 70,224 C80,216 90,214 100,214 C110,214 120,216 130,224 C136,180 134,120 126,74
            C118,68 82,68 74,74 Z`, fill: '#B33A2B' },
      { d: `M100,70 C110,70 122,72 126,74 C134,120 136,180 130,224 C120,216 110,214 100,214 Z`, fill: '#7A2018' },
      { d: `M74,74 C70,98 68,128 68,156 C74,150 80,148 84,148 C82,122 80,96 82,76 Z`, fill: '#D4553F', opacity: 0.5 },
    ],
  },
  star_badge: {
    slot: 'badge',
    paths: [
      { d: `M170,44 L175,54 L186,56 L178,64 L180,75 L170,70 L160,75 L162,64 L154,56 L165,54 Z`,
        fill: '#FFD700' },
      { d: `M170,50 L173,56 L180,57 L175,62 L176,69 L170,66 L164,69 L165,62 L160,57 L167,56 Z`,
        fill: '#FFF3B0' },
    ],
  },
  diamond: {
    slot: 'badge',
    animated: 'pulse',
    paths: [
      { d: `M170,42 L184,54 L170,78 L156,54 Z`, fill: '#7FDBFF' },
      { d: `M170,42 L184,54 L170,60 Z`, fill: '#B7ECFF' },
      { d: `M156,54 L170,60 L170,78 Z`, fill: '#3FA7D6' },
    ],
  },
};

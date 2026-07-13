// WARRIOR — greatsword over the right shoulder, layered pauldron, horned
// dome helm, flame aura. v2: blade fully outside the body silhouette,
// helm actually reads as a helm.

export default {
  gear: {
    1: [
      // greatsword: broad blade rising past the right shoulder into open air
      { slot: 'back', d: `M148,12 L157,20 L128,86 C125,92 118,90 119,84 L142,22 Z`,
        fill: 'var(--av-metal)' },
      { slot: 'back', d: `M152,15 L157,20 L128,86 C126,89 122,90 120,88 C130,66 143,36 152,15 Z`,
        fill: '#6E7382' },
      // fuller line
      { slot: 'back', d: `M148,20 L151,23 L127,80 L124,78 Z`, fill: '#565B69', opacity: 0.8 },
      // crossguard
      { slot: 'back', d: `M112,82 L134,92 L131,99 L109,89 Z`, fill: 'var(--av-c2)' },
      // grip + pommel (disappears behind the shoulder)
      { slot: 'back', d: `M116,92 L124,96 L118,110 C116,114 110,112 112,107 Z`, fill: '#4A3020' },
      { slot: 'back', d: `M113,112 m-4.5,0 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0`, fill: 'var(--av-metal)' },
      // chest strap
      { slot: 'gear', d: `M124,74 L70,124 L75,133 L128,83 Z`, fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M99,97 L70,124 L75,133 L103,106 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M106,96 m-3.6,0 a3.6,3.6 0 1,0 7.2,0 a3.6,3.6 0 1,0 -7.2,0`,
        fill: 'var(--av-metal)' },
      // wrist wraps
      { slot: 'gear', d: `M46,148 L60,152 L58,160 L44,156 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M140,152 L154,148 L156,156 L142,160 Z`, fill: 'var(--av-c2)' },
    ],
    2: [
      // left pauldron: two heavy plates seated on the deltoid
      { slot: 'gear', d: `M46,84 C44,68 58,58 74,63 C82,66 86,74 85,82 C73,74 56,76 46,84 Z`,
        fill: 'var(--av-c1)' },
      { slot: 'gear', d: `M49,92 C48,80 60,72 74,76 C81,78 84,84 83,90 C72,83 57,84 49,92 Z`,
        fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M66,62 C74,64 82,70 85,78 L85,82 C79,77 72,73 66,72 Z`, fill: '#8A2318' },
      // rivets
      { slot: 'gear', d: `M56,82 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: 'var(--av-metal)' },
      { slot: 'gear', d: `M68,76 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`, fill: 'var(--av-metal)' },
      // heavy belt + buckle
      { slot: 'gear', d: `M76,128 L124,128 L125,140 L75,140 Z`, fill: 'var(--av-c2)' },
      { slot: 'gear', d: `M94,127 L106,127 L106,141 L94,141 Z`, fill: 'var(--av-metal)' },
      { slot: 'gear', d: `M97,130 L103,130 L103,138 L97,138 Z`, fill: '#4A3020' },
    ],
    3: [
      // awakened energy: pauldron rim, blade edge, strap stud
      { slot: 'gear', d: `M49,92 C48,80 60,72 74,76 L73,80 C61,77 52,84 49,92 Z`,
        fill: 'var(--av-glow)', opacity: 0.9 },
      { slot: 'back', d: `M153,16 L157,20 L129,84 L125,81 Z`, fill: 'var(--av-glow)', opacity: 0.6 },
      { slot: 'gear', d: `M106,96 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0`,
        fill: 'var(--av-glow)' },
      { slot: 'gear', d: `M76,132 L124,132 L124,134 L76,134 Z`, fill: 'var(--av-glow)', opacity: 0.5 },
    ],
    4: [
      // horned dome helm — sits above the brow, face fully open
      { slot: 'head', hidesHair: true,
        d: `M81,32 C80,13 89,6 100,6 C111,6 120,13 119,32 L119,30 C119,32 118,33 117,33 L83,33
            C82,33 81,32 81,30 Z`, fill: 'var(--av-metal)' },
      { slot: 'head', d: `M100,6 C111,6 120,13 119,32 C119,32 118,33 117,33 L104,33 C108,24 107,13 100,6 Z`,
        fill: '#6E7382' },
      // brow band above the eyes
      { slot: 'head', d: `M81,28 L119,28 L119,33 L81,33 Z`, fill: 'var(--av-c2)' },
      { slot: 'head', d: `M81,28 L119,28 L119,29.6 L81,29.6 Z`, fill: '#D8853F', opacity: 0.7 },
      // horns rising from the dome sides, sweeping up and out
      { slot: 'head', d: `M85,20 C77,16 71,8 70,-0 C79,2 87,8 91,15 C93,18 89,22 85,20 Z`,
        fill: '#D8DCE6' },
      { slot: 'head', d: `M115,20 C123,16 129,8 130,-0 C121,2 113,8 109,15 C107,18 111,22 115,20 Z`,
        fill: '#AEB4C2' },
      { slot: 'head', d: `M72,2 C78,4 84,9 88,14 L91,15 C87,8 80,3 72,2 Z`, fill: '#8A8F9E' },
    ],
    5: [
      // flame aura: wide tongues clearly visible beside the arms and shoulders
      { slot: 'auraB', d: `M100,260 C52,252 30,210 38,160 C43,126 58,94 80,70 C74,98 78,116 90,126
          C82,98 92,60 114,36 C110,66 120,86 136,98 C152,112 162,138 162,166 C166,214 142,252 100,260 Z`,
        fill: '#9664FF', opacity: 0.25, aura: true },
      { slot: 'auraB', d: `M100,252 C64,246 46,214 52,172 C56,144 68,116 86,96 C82,116 88,130 98,138
          C92,114 100,84 118,64 C116,88 124,104 136,114 C148,128 154,148 154,172 C158,216 134,246 100,252 Z`,
        fill: 'var(--av-glow)', opacity: 0.28, aura: true },
      // free-floating tongue tips beside the shoulders
      { slot: 'auraB', d: `M52,84 C50,70 56,56 66,48 C62,60 64,72 70,80 C64,86 56,90 52,84 Z`,
        fill: 'var(--av-glow)', opacity: 0.35, aura: true },
      { slot: 'auraB', d: `M148,84 C150,70 144,56 134,48 C138,60 136,72 130,80 C136,86 144,90 148,84 Z`,
        fill: '#9664FF', opacity: 0.35, aura: true },
    ],
  },
};

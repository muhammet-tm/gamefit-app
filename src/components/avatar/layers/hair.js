// Hair styles as layered path sets over the skull (male skull: x83-117,
// female: x84-116; top y11, hairline ~y22, ears y35). v2 "lively" pass: every
// style gets volume, a shadow side, highlight strands (--av-hair-light) and a
// few flyaways so the hair reads as strand groups instead of a flat helmet.
// `back` renders behind the head, `front` on top of it.

export const HAIR_PATHS = {
  // ================= male styles =================

  // ---- swept athletic crop with a lifted fringe
  short: {
    front: [
      // full mass with lifted front quiff
      { d: `M82,34 C80,17 88,8 99,9 C104,6 112,8 114,13 C118,16 119,25 118,33
            C117,27 114,23 109,22 C111,25 110,28 107,28 C103,21 93,20 88,24
            C84,26.6 82,30 82,34 Z`, fill: 'var(--av-hair)' },
      // right-side shadow mass
      { d: `M104,9 C109,8 114,11 115,15 C118,18 119,26 118,33 C117,27 114,23 109,22
            C111,25 110,28 107,28 C107,20 106,13 104,9 Z`, fill: 'var(--av-hair-shadow)' },
      // highlight strands sweeping with the quiff
      { d: `M88,20 C92,15 99,13 104,15 C99,14.6 93,16.6 90,20.6 Z`, fill: 'var(--av-hair-light)', opacity: 0.9 },
      { d: `M85,26 C87,22 91,19.6 95,19 C91,20.6 88,23.2 86.6,26.6 Z`, fill: 'var(--av-hair-light)', opacity: 0.6 },
      // flyaways
      { d: `M97,8.6 C98,7 100,6.2 102,6.8 C100.4,7.2 98.8,8 98,9.4 Z`, fill: 'var(--av-hair)' },
      { d: `M106,9 C107.6,8 110,8.2 111,9.6 C109.4,9.2 107.6,9.4 106.6,10.4 Z`, fill: 'var(--av-hair-shadow)' },
    ],
  },

  // ---- tight fade: short textured top, skin-faded temples
  fade: {
    front: [
      // top mass, slightly boxy
      { d: `M84,26 C85,15 91,10.6 100,10.6 C109,10.6 115,15 116,26 C116,22 113,18.6 108,17.6
            C102,15.6 92,16 88,19.6 C85.6,21.6 84,23.6 84,26 Z`, fill: 'var(--av-hair)' },
      { d: `M101,11 C108,11 114,15 116,25 C115,21 112,18.4 108,17.6 C106,14.6 103.6,12.2 101,11 Z`,
        fill: 'var(--av-hair-shadow)' },
      // faded temples: translucent blend into the skin
      { d: `M84,26 C84,29 84.4,32 85,34 L88,34 C87,31 86.6,28 87,25.4 Z`,
        fill: 'var(--av-hair-shadow)', opacity: 0.45 },
      { d: `M116,26 C116,29 115.6,32 115,34 L112,34 C113,31 113.4,28 113,25.4 Z`,
        fill: 'var(--av-hair-shadow)', opacity: 0.55 },
      // top texture ticks
      { d: `M90,15.6 C92,14 94,13.2 96,13 C94,14 92.4,15 91.4,16.6 Z`, fill: 'var(--av-hair-light)', opacity: 0.8 },
      { d: `M98,12.8 C100,12 102,12 104,12.6 C102,13 100,13.4 98.8,14.4 Z`, fill: 'var(--av-hair-light)', opacity: 0.6 },
      { d: `M106,14.4 C108,14 110,14.6 111,15.8 C109.4,15.2 107.6,15.2 106.6,15.8 Z`, fill: 'var(--av-hair-light)', opacity: 0.45 },
    ],
  },

  // ---- sleek back-swept top with a swinging tail
  ponytail: {
    back: [
      // tie + full tail curving out right with a flick
      { d: `M112,20 C119,23 122,31 121,40 C120,50 122,60 128,66 C124,72 117,71 113,64
            C108,55 108,42 110,32 C110.6,27.6 111,23.6 112,20 Z`, fill: 'var(--av-hair-shadow)' },
      { d: `M121,40 C120,50 122,60 128,66 C126,69 122,70 119,68 C116,60 116,48 118,39 Z`,
        fill: 'var(--av-hair)' },
      // strand lines inside the tail
      { d: `M114,30 C113,40 113.6,52 117,60 C114.6,52 114,40 115.6,30.6 Z`, fill: 'var(--av-hair-light)', opacity: 0.55 },
      // tail tip flick
      { d: `M124,64 C127,68 128,72 126,76 C123,73 121,69 121,66 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      // sleek swept-back top
      { d: `M82,33 C80,17 89,9.6 100,9.6 C111,9.6 119,17 118,32 C116,25 112,21 106,20
            C108,24 106,26.6 104,27 C100,21 91,20.6 87,24.6 C84,27 82.6,30 82,33 Z`,
        fill: 'var(--av-hair)' },
      { d: `M110,12 C115,15 118,22 118,31 C116,25 112,21 106,20 C108,17 109.4,14.4 110,12 Z`,
        fill: 'var(--av-hair-shadow)' },
      // tie band
      { d: `M110,21 C113,20 116,21 117,23 C115,25 112,25 110,24 Z`, fill: 'var(--av-hair-shadow)' },
      // sweep highlights
      { d: `M86,22 C90,16 98,13.6 105,15.4 C99,14.8 91,17 88,22.6 Z`, fill: 'var(--av-hair-light)', opacity: 0.85 },
      { d: `M93,12.4 C97,11 102,11 105,12.4 C101,12 96.6,12.4 94,13.8 Z`, fill: 'var(--av-hair-light)', opacity: 0.5 },
      // baby-hair flyaway at the crown
      { d: `M90,10.6 C91,8.8 93,8 95,8.6 C93.2,9 91.6,9.8 91,11.2 Z`, fill: 'var(--av-hair)' },
    ],
  },

  // ---- springy coils with per-coil shading
  curly: {
    front: [
      // coil cloud silhouette
      { d: `M81,31 C77,24 81,15 88,13 C89,7.6 97,5 102,8 C108,4.6 116,8 117,14 C122,17 122,26 117,30
            C118,25 115,21 110,21 C112,25 110,28 106,28 C102,22 94,21.6 90,25 C86.6,27.6 84,30 84.6,33.6
            C83,33.6 81.8,32.6 81,31 Z`, fill: 'var(--av-hair)' },
      // right shadow coils
      { d: `M102,8 C108,4.6 116,8 117,14 C122,17 122,26 117,30 C118,25 115,21 110,21
            C111,16 108,11 102,9.6 Z`, fill: 'var(--av-hair-shadow)' },
      // individual coil bumps (light side)
      { d: `M84,20 a4.6,4.6 0 0 1 7,-3.4 a4.8,4.8 0 0 0 -5.4,4.8 Z`, fill: 'var(--av-hair-light)', opacity: 0.7 },
      { d: `M92,11.6 a5,5 0 0 1 7.6,-1.4 a5.4,5.4 0 0 0 -6.4,2.8 Z`, fill: 'var(--av-hair-light)', opacity: 0.85 },
      { d: `M103,10 a4.6,4.6 0 0 1 6.6,1.2 a5,5 0 0 0 -6,-0.2 Z`, fill: 'var(--av-hair-light)', opacity: 0.5 },
      // coil shadows between bumps
      { d: `M90,17 a3.6,3.6 0 0 1 5,-2 a4.2,4.2 0 0 0 -3.8,3.4 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.6 },
      { d: `M100,13.6 a3.6,3.6 0 0 1 5.2,-1 a4.2,4.2 0 0 0 -4.2,2.4 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.5 },
      // springy flyaway coils
      { d: `M85,13.6 c-1.6,-2 -0.6,-4.6 1.8,-5 c-1.2,1.2 -1.6,3 -0.6,4.6 Z`, fill: 'var(--av-hair)' },
      { d: `M113,9.4 c1.8,-1.4 4.2,-0.6 4.8,1.6 c-1.4,-1 -3.2,-1.2 -4.4,-0.4 Z`, fill: 'var(--av-hair-shadow)' },
    ],
  },

  // ================= female styles =================
  // Long styles must drape in FRONT of the shoulders: with the arms down,
  // anything drawn in the `back` slot below the jaw is fully occluded by the
  // torso and arms. Locks run outside the neck and inside the pauldron line
  // (x83/117) so class gear stays readable.

  // ---- long loose hair, twin locks past the chest
  long: {
    back: [
      { d: `M82,32 C79,16 88,7 100,7 C112,7 121,16 118,32 C119,48 118,62 114,74
            L86,74 C82,62 81,48 82,32 Z`, fill: 'var(--av-hair)' },
      { d: `M106,10 C114,13 121,20 118,32 C119,48 118,62 114,74 L104,74
            C110,60 111,36 106,10 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      // crown with a side part
      { d: `M83,33 C81,17 89,8 100,8 C111,8 120,17 118,33 C117,26 114,21 108,19
            C102,15 92,17 88,22 C85,25 83.6,29 83,33 Z`, fill: 'var(--av-hair)' },
      { d: `M104,9 C112,11 119,19 118,33 C117,26 114,21 108,19 C107,15 105.6,11.6 104,9 Z`,
        fill: 'var(--av-hair-shadow)' },
      // left lock: temple -> outside the shoulder -> tapering past the chest
      { d: `M84,24 C78,34 74,50 74,68 C74,88 77,108 82,126
            C86,110 84,92 83,74 C82,56 83,38 88,28 Z`, fill: 'var(--av-hair)' },
      // right lock (shadow side)
      { d: `M116,24 C122,34 126,50 126,68 C126,88 123,108 118,126
            C114,110 116,92 117,74 C118,56 117,38 112,28 Z`, fill: 'var(--av-hair-shadow)' },
      { d: `M116,24 C120,32 123,44 123.6,58 C124,44 121,32 114,26 Z`, fill: 'var(--av-hair)' },
      // sheen down the light-side lock
      { d: `M80,36 C77,50 76,66 77,82 C78,66 79,50 82,38 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.65 },
      { d: `M78,88 C78,100 79,112 81,122 C80,110 79.6,98 79.6,88 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.4 },
      // parting highlights on the crown
      { d: `M88,20 C93,14 101,12 107,15 C101,14.4 93,16.6 90,21 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.85 },
      { d: `M85,27 C87,22 90,19 94,17.6 C90,20 87,23.4 86,27.6 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.55 },
    ],
  },

  // ---- chin-length bob with an inward curl
  bob: {
    back: [
      { d: `M82,32 C80,16 88,7 100,7 C112,7 120,16 118,32 C119,44 118,54 115,62
            L85,62 C82,54 81,44 82,32 Z`, fill: 'var(--av-hair)' },
      { d: `M106,10 C114,13 120,20 118,32 C119,44 118,54 115,62 L106,62
            C111,50 111,30 106,10 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      { d: `M83,32 C81,16 89,8 100,8 C111,8 119,16 117,32 C116,25 113,20 107,18
            C101,14 91,16.6 87,22 C84.6,25 83.4,28 83,32 Z`, fill: 'var(--av-hair)' },
      { d: `M104,9 C111,11 118,18 117,32 C116,25 113,20 107,18 C107,14.6 105.6,11.4 104,9 Z`,
        fill: 'var(--av-hair-shadow)' },
      // sides falling to the jaw, curling inward at the tip
      { d: `M84,24 C79,32 77,44 78,55 C79,63 85,67 91,63 C86,61 83,56 83,49
            C83,40 84,31 88,26 Z`, fill: 'var(--av-hair)' },
      { d: `M116,24 C121,32 123,44 122,55 C121,63 115,67 109,63 C114,61 117,56 117,49
            C117,40 116,31 112,26 Z`, fill: 'var(--av-hair-shadow)' },
      { d: `M116,24 C119,31 120.6,40 120.6,50 C121,40 120,31 114,26 Z`, fill: 'var(--av-hair)' },
      // blunt fringe + sheen
      { d: `M87,21 C92,16 100,14.6 106,17 C100,17 92,18.6 88.6,22.6 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.8 },
      { d: `M81,34 C80,42 80.6,50 82,56 C82.6,50 82,42 82.6,35 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.5 },
    ],
  },

  // ---- thick braid draped over the left shoulder
  braid: {
    back: [
      { d: `M82,32 C80,16 88,7 100,7 C112,7 120,16 118,32 C119,44 118,54 115,62
            L85,62 C82,54 81,44 82,32 Z`, fill: 'var(--av-hair)' },
      { d: `M106,10 C114,13 120,20 118,32 C119,44 118,54 115,62 L106,62
            C111,50 111,30 106,10 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      // hair pulled back smoothly
      { d: `M83,31 C81,16 89,8 100,8 C111,8 119,16 117,31 C116,24 112,20 106,18.6
            C100,15 91,17 87,22 C85,25 83.4,27.6 83,31 Z`, fill: 'var(--av-hair)' },
      { d: `M104,9 C111,11 118,18 117,31 C116,24 112,20 106,18.6 C106,15 105,11.4 104,9 Z`,
        fill: 'var(--av-hair-shadow)' },
      { d: `M87,21 C92,15 101,13 107,16 C101,15.4 93,17.4 89,22 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.85 },
      // the rope: over the shoulder, down the chest
      { d: `M86,28 C80,38 77,52 78,66 C79,84 82,104 86,124 C90,122 92,118 91,112
            C88,96 85,78 85,64 C85,50 87,38 91,30 Z`, fill: 'var(--av-hair)' },
      // plait chevrons
      { d: `M78,62 C82,62 86,64 88,68 C85,66 81,65 78,65 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.9 },
      { d: `M79,74 C83,74 87,76 89,80 C86,78 82,77 79,77 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.9 },
      { d: `M80,86 C84,86 88,88 90,92 C87,90 83,89 80,89 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.9 },
      { d: `M81,98 C85,98 89,100 91,104 C88,102 84,101 81,101 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.9 },
      { d: `M82,110 C86,110 90,112 92,116 C89,114 85,113 82,113 Z`, fill: 'var(--av-hair-shadow)', opacity: 0.9 },
      // sheen along the rope
      { d: `M80,48 C78,62 79,80 82,98 C80,80 79.6,62 82,48 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.55 },
      // tie + tassel
      { d: `M84,124 C88,123 91,124 92,127 C89,129 85,128 83,126 Z`, fill: 'var(--av-hair-shadow)' },
      { d: `M86,128 C88,133 88,139 86,143 C84,139 83,133 84,128 Z`, fill: 'var(--av-hair)' },
      { d: `M89,128 C91,132 91,137 89,141 C88,137 88,132 88,128 Z`, fill: 'var(--av-hair-shadow)' },
      // right-side face framing wisp
      { d: `M116,26 C118,34 118,42 116.6,50 C115.6,42 115,34 114.6,27 Z`,
        fill: 'var(--av-hair-shadow)' },
    ],
  },

  // ---- high bun with face-framing strands
  bun: {
    back: [
      { d: `M100,9 m-11,0 a11,9.5 0 1,0 22,0 a11,9.5 0 1,0 -22,0`, fill: 'var(--av-hair)' },
      { d: `M104,1 C110,2 112,7 111,12 C110,16 106,18 102,17.6 C108,15 109,7 104,1 Z`,
        fill: 'var(--av-hair-shadow)' },
      { d: `M91,7 C95,3.6 104,3 109,6 C104,5 96,5.6 92,8.6 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.75 },
      { d: `M90,12 C94,16 106,16.6 110,13 C107,17.6 93,17.6 90,12 Z`,
        fill: 'var(--av-hair-shadow)', opacity: 0.8 },
      // nape
      { d: `M86,30 C85,40 85,48 87,54 L113,54 C115,48 115,40 114,30 Z`, fill: 'var(--av-hair)' },
    ],
    front: [
      { d: `M84,32 C83,20 89,13 100,13 C111,13 117,20 116,32 C115,26 112,22 107,21
            C101,19 92,19.6 88,23 C86,25.6 84.6,29 84,32 Z`, fill: 'var(--av-hair)' },
      { d: `M105,14 C111,16 116,22 116,32 C115,26 112,22 107,21 C107,18 106,15.6 105,14 Z`,
        fill: 'var(--av-hair-shadow)' },
      { d: `M90,17 C95,14.6 105,14.6 110,17 C105,16.4 95,16.4 90,17 Z`, fill: 'var(--av-hair-shadow)' },
      { d: `M87,24 C92,19 100,17.4 106,19.4 C100,19 92,20.6 88.6,25 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.9 },
      // loose strands in front of the ears, down past the jaw
      { d: `M85,28 C83,38 83,50 85,60 C87,50 87,38 87,29 Z`, fill: 'var(--av-hair)' },
      { d: `M115,28 C117,38 117,50 115,60 C113,50 113,38 113,29 Z`, fill: 'var(--av-hair-shadow)' },
    ],
  },

  // ---- long waves with S-curve locks
  wavy: {
    back: [
      { d: `M82,32 C79,16 88,6 100,6 C112,6 121,16 118,32 C119,48 118,62 114,76
            L86,76 C82,62 81,48 82,32 Z`, fill: 'var(--av-hair)' },
      { d: `M106,9 C114,12 121,20 118,32 C119,48 118,62 114,76 L104,76
            C110,60 111,35 106,9 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      { d: `M82,33 C80,16 89,7 100,7 C111,7 120,16 118,33 C117,25 113,20 107,18
            C100,14 91,16.6 87,22 C84.6,25 82.6,29 82,33 Z`, fill: 'var(--av-hair)' },
      { d: `M105,8.6 C112,11 119,18 118,33 C117,25 113,20 107,18 C107,14 106,11 105,8.6 Z`,
        fill: 'var(--av-hair-shadow)' },
      // left lock with S-curve outer edge
      { d: `M84,24 C77,33 76,46 79,56 C82,66 73,74 75,86 C77,98 79,112 83,126
            C87,112 84,98 82,86 C80,74 88,66 85,56 C82,46 84,34 88,27 Z`,
        fill: 'var(--av-hair)' },
      // right lock (shadow)
      { d: `M116,24 C123,33 124,46 121,56 C118,66 127,74 125,86 C123,98 121,112 117,126
            C113,112 116,98 118,86 C120,74 112,66 115,56 C118,46 116,34 112,27 Z`,
        fill: 'var(--av-hair-shadow)' },
      { d: `M116,24 C121,32 122.6,42 121,52 C123,42 121,32 114,26 Z`, fill: 'var(--av-hair)' },
      // wave sheen
      { d: `M81,36 C79,46 82,54 79,62 C76,72 79,84 80,96 C79,84 77,72 80,62
            C83,54 80,46 83,37 Z`, fill: 'var(--av-hair-light)', opacity: 0.6 },
      // crown highlights
      { d: `M87,21 C92,15 101,13 107,15.6 C101,15 93,17 88.6,22.6 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.85 },
      { d: `M90,12.6 C95,10.6 102,10.6 106,12.6 C101,12 95,12.4 91.6,13.8 Z`,
        fill: 'var(--av-hair-light)', opacity: 0.5 },
      // tips flick out
      { d: `M82,124 C80,130 81,136 84,139 C85,134 84,129 84,125 Z`, fill: 'var(--av-hair)' },
      { d: `M118,124 C120,130 119,136 116,139 C115,134 116,129 116,125 Z`,
        fill: 'var(--av-hair-shadow)' },
    ],
  },
};

// Hair styles as layered path sets over the skull (skull: x83-117, top y11,
// hairline ~y22, ears y35). v2 "lively" pass: every style gets volume, a
// shadow side, highlight strands (--av-hair-light) and a few flyaways so the
// hair reads as strand groups instead of a flat helmet.
// `back` renders behind the head, `front` on top of it.

export const HAIR_PATHS = {
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
};

// Hair styles as path sets over the skull (skull: cx100, top y13, ears y36).
// Fills use --av-hair / --av-hair-shadow so every style serves every color.
// `back` renders behind the head (ponytail tail), `front` on top of it.

export const HAIR_PATHS = {
  short: {
    front: [
      // swept athletic crop
      { d: `M83,34 C82,20 90,11 100,11 C110,11 118,19 117,32 C117,26 113,22 108,21
            C110,25 109,28 107,29 C104,23 96,20 89,23 C85,25 83,29 83,34 Z`,
        fill: 'var(--av-hair)' },
      { d: `M104,13 C111,15 117,21 117,31 C117,26 113,22 108,21 C110,25 109,28 107,29
            C106,24 105,17 104,13 Z`, fill: 'var(--av-hair-shadow)' },
    ],
  },
  fade: {
    front: [
      // tight buzz/fade hugging the skull
      { d: `M85,29 C86,18 92,13 100,13 C108,13 114,18 115,29 C115,24 112,20 107,19
            C101,17 93,18 88,22 C86,24 85,26 85,29 Z`, fill: 'var(--av-hair)' },
      { d: `M102,14 C108,15 114,20 115,28 C114,23 111,20 107,19 C105,17 103,15 102,14 Z`,
        fill: 'var(--av-hair-shadow)' },
    ],
  },
  ponytail: {
    back: [
      // tail behind the head/neck
      { d: `M112,22 C120,26 122,38 118,50 C116,58 116,66 118,72 C112,72 108,66 108,58
            C108,48 110,34 112,22 Z`, fill: 'var(--av-hair-shadow)' },
    ],
    front: [
      { d: `M83,33 C82,19 90,11 100,11 C110,11 118,19 117,33 C116,26 112,22 106,21
            C108,26 106,28 104,29 C100,22 92,21 87,25 C84,27 83,30 83,33 Z`,
        fill: 'var(--av-hair)' },
      { d: `M113,18 C117,22 118,28 117,33 C116,27 112,22 106,21 C109,19 111,18 113,18 Z`,
        fill: 'var(--av-hair-shadow)' },
    ],
  },
  curly: {
    front: [
      // rounded coils silhouette
      { d: `M82,32 C79,24 84,15 91,13 C93,9 102,8 106,11 C112,9 119,15 118,22 C122,26 120,33 116,34
            C117,28 113,24 108,24 C110,28 108,31 105,31 C102,26 94,25 90,28 C86,30 84,32 85,35
            C83,35 82,34 82,32 Z`, fill: 'var(--av-hair)' },
      { d: `M106,11 C112,9 119,15 118,22 C122,26 120,33 116,34 C117,28 113,24 108,24
            C109,19 108,14 106,11 Z`, fill: 'var(--av-hair-shadow)' },
    ],
  },
};

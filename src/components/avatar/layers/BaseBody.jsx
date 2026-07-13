import React from 'react';

// The shared athletic rig — v2 after first art review.
// Canvas: viewBox 0 0 200 280, ground ≈ y268, center x100.
// Review fixes: broader shoulders + real deltoid/bicep mass, thicker thighs
// and calves, tighter crew neckline, determined (not smiling) face, smooth
// single-pass shadows. Light source top-left.
// CSS vars from <Avatar/>: --av-skin, --av-skin-shadow.

const TANK = '#232838';
const TANK_SHADOW = '#191D29';
const SHORTS = '#2A3040';
const SHORTS_SHADOW = '#1F2430';
const SHOE = '#3A4156';
const SHOE_SOLE = '#C9CEDC';

export default function BaseBody() {
  return (
    <g id="av-base-body">
      {/* ============ LEGS ============ */}
      {/* left thigh + shin: strong taper, knee at ~204, calf bulge, ankle 250 */}
      <path
        d="M79,166 C77,182 78,196 80,206 C83,214 84,222 83,230 C82,238 82,245 83,250 L97,250
           C98,244 98,236 97,228 C96,218 97,208 98,198 C99,186 99,174 98,166 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M91,170 C93,184 94,198 93,210 C92,224 92,240 93,250 L97,250 C98,242 98,232 97,222
           C96,210 97,196 98,184 L98,166 L92,166 Z"
        fill="var(--av-skin-shadow)" opacity="0.5"
      />
      {/* right thigh + shin */}
      <path
        d="M102,166 C101,174 101,186 102,198 C103,208 104,218 103,228 C102,236 102,244 103,250 L117,250
           C118,245 118,238 117,230 C116,222 117,214 120,206 C122,196 123,182 121,166 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M112,168 C115,182 116,198 114,212 C113,226 113,240 114,250 L117,250 C118,244 118,236 117,228
           C116,220 117,212 120,204 C122,194 122,180 121,168 Z"
        fill="var(--av-skin-shadow)" opacity="0.5"
      />

      {/* ============ SHOES ============ */}
      <path d="M81,250 C80,256 78,260 74,263 C71,265 72,268 76,268 L96,268 C99,268 100,265 99,262
               C98,258 97,254 97,250 Z" fill={SHOE} />
      <path d="M73,263 L99,263 C100,265 99,268 96,268 L76,268 C72,268 71,265 73,263 Z" fill={SHOE_SOLE} />
      <path d="M103,250 C103,254 102,258 101,262 C100,265 101,268 104,268 L124,268 C128,268 129,265 126,263
               C122,260 120,256 119,250 Z" fill={SHOE} />
      <path d="M101,263 L127,263 C129,265 128,268 124,268 L104,268 C101,268 100,265 101,263 Z" fill={SHOE_SOLE} />

      {/* ============ SHORTS ============ */}
      <path
        d="M77,134 L123,134 L125,162 C125,168 120,171 114,170 L104,168 L100,175 L96,168 L86,170
           C80,171 75,168 75,162 Z"
        fill={SHORTS}
      />
      <path d="M108,134 C111,146 113,158 114,168 L114,170 C120,171 125,168 125,162 L123,134 Z"
        fill={SHORTS_SHADOW} />
      {/* drawstring */}
      <path d="M77,138 L123,138 L123,141 L77,141 Z" fill={TANK_SHADOW} />

      {/* ============ ARMS ============ */}
      {/* left arm: deltoid ball → bicep → forearm → fist, slight outward bend */}
      <path
        d="M50,86 C48,72 60,64 72,68 C80,71 84,78 83,86 L81,104 C80,114 76,124 71,132 L64,150
           C62,156 60,160 59,163 L45,159 C46,152 48,144 51,136 L57,114 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M72,72 C78,80 79,94 76,106 C72,122 65,142 60,160 L59,163 L52,161 C55,148 60,132 64,118
           C68,104 71,86 70,74 Z"
        fill="var(--av-skin-shadow)" opacity="0.42"
      />
      {/* left fist */}
      <path d="M43,160 C48,155 57,156 60,162 C63,168 60,175 53,176 C46,177 41,171 42,165 Z"
        fill="var(--av-skin)" />
      <path d="M55,157 C60,160 62,167 59,172 C57,175 53,176 50,175 C56,172 58,164 55,157 Z"
        fill="var(--av-skin-shadow)" opacity="0.45" />
      {/* right arm */}
      <path
        d="M150,86 C152,72 140,64 128,68 C120,71 116,78 117,86 L119,104 C120,114 124,124 129,132 L136,150
           C138,156 140,160 141,163 L155,159 C154,152 152,144 149,136 L143,114 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M138,70 C146,76 150,86 148,98 C147,112 150,134 154,156 L155,159 L146,161 C143,146 138,128 135,112
           C132,98 133,82 134,72 Z"
        fill="var(--av-skin-shadow)" opacity="0.48"
      />
      {/* right fist */}
      <path d="M157,160 C152,155 143,156 140,162 C137,168 140,175 147,176 C154,177 159,171 158,165 Z"
        fill="var(--av-skin)" />
      <path d="M152,158 C156,162 157,169 153,173 C158,171 160,164 157,160 Z"
        fill="var(--av-skin-shadow)" opacity="0.5" />

      {/* ============ TORSO (fitted crew tank, V-taper) ============ */}
      <path
        d="M64,84 C68,70 82,62 100,62 C118,62 132,70 136,84 L131,106 C128,122 125,130 123,136 L77,136
           C75,130 72,122 69,106 Z"
        fill={TANK}
      />
      {/* right-side shade + pec line */}
      <path d="M113,64 C125,68 133,75 136,84 L131,106 C128,122 125,130 123,136 L109,136
               C114,122 117,104 118,90 C118,80 116,70 113,64 Z" fill={TANK_SHADOW} />
      <path d="M82,94 C88,99 112,99 118,94 C112,103 88,103 82,94 Z" fill={TANK_SHADOW} opacity="0.9" />
      {/* crew neckline: narrow skin notch */}
      <path d="M91,62 C94,60 106,60 109,62 C107,68 103,71 100,71 C97,71 93,68 91,62 Z"
        fill="var(--av-skin)" />
      <path d="M100,62 L109,62 C107,68 103,71 100,71 Z" fill="var(--av-skin-shadow)" opacity="0.4" />
      {/* trapezius slopes into the neck */}
      <path d="M80,60 C86,55 94,52 100,52 L100,62 C93,62 86,63 80,66 Z" fill="var(--av-skin)" />
      <path d="M120,60 C114,55 106,52 100,52 L100,62 C107,62 114,63 120,66 Z"
        fill="var(--av-skin-shadow)" />

      {/* ============ NECK + HEAD ============ */}
      <path d="M92,46 L92,60 C96,64 104,64 108,60 L108,46 Z" fill="var(--av-skin)" />
      <path d="M100,46 L108,46 L108,60 C105,63 102,64 100,64 Z" fill="var(--av-skin-shadow)" opacity="0.5" />
      {/* skull with a strong jaw */}
      <path
        d="M83,32 C83,18 90,11 100,11 C110,11 117,18 117,32 C117,41 114,49 108,54 C104,57 96,57 92,54
           C86,49 83,41 83,32 Z"
        fill="var(--av-skin)"
      />
      <path d="M104,12 C112,14 117,22 117,32 C117,41 114,49 108,54 C106,55 104,56 102,56
               C108,48 111,38 110,28 C110,21 107,15 104,12 Z" fill="var(--av-skin-shadow)" opacity="0.45" />
      {/* ears */}
      <ellipse cx="83.5" cy="35" rx="3.2" ry="5" fill="var(--av-skin)" />
      <ellipse cx="116.5" cy="35" rx="3.2" ry="5" fill="var(--av-skin-shadow)" />

      {/* ============ FACE — set, determined ============ */}
      <path d="M87.5,31 C90.5,29 95.5,29 97.5,31 L97.5,33.4 C95,31.8 90.5,31.8 87.5,33.4 Z"
        fill="var(--av-skin-shadow)" />
      <path d="M102.5,31 C104.5,29 109.5,29 112.5,31 L112.5,33.4 C109.5,31.8 105,31.8 102.5,33.4 Z"
        fill="var(--av-skin-shadow)" />
      {/* eyes: focused almonds */}
      <path d="M89,36 C91,34.4 95,34.4 96.5,36 C95,37.6 91,37.6 89,36 Z" fill="#171A22" />
      <path d="M103.5,36 C105,34.4 109,34.4 111,36 C109,37.6 105,37.6 103.5,36 Z" fill="#171A22" />
      {/* nose */}
      <path d="M99.5,39 L101.5,44.5 C100.6,45.4 99.2,45.4 98.4,44.8 Z"
        fill="var(--av-skin-shadow)" opacity="0.65" />
      {/* mouth: flat, resolute */}
      <path d="M95.5,49.6 L104.5,49.6" stroke="#171A22" strokeWidth="1.5"
        strokeLinecap="round" fill="none" opacity="0.7" />
    </g>
  );
}

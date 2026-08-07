import React from 'react';

// The female athletic rig — a separate character, not a reskin of BaseBody.
// Canvas: viewBox 0 0 200 280, ground ≈ y268, center x100.
//
// Shared anchors with the male rig so all 25 class×tier gear sets still fit:
// deltoid centers (66,78)/(134,78), head box y11-57, belt line y128-140,
// hip line y134. Everything between those anchors is redrawn: narrower
// ribcage with a waist pinch, hip flare, slimmer limbs, longer leg line,
// sports-bra + leggings kit, and a softer face (rounder jaw, larger eyes,
// lashes, arched brows, fuller lips). Light source top-left.
// CSS vars from <Avatar/>: --av-skin, --av-skin-shadow, --av-hair.

const KIT = '#232838';
const KIT_SHADOW = '#191D29';
const LEGGING = '#2A3040';
const LEGGING_SHADOW = '#1F2430';
const SHOE = '#3A4156';
const SHOE_SOLE = '#C9CEDC';

export default function BaseBodyF() {
  return (
    <g id="av-base-body-f">
      {/* ============ LEGS (longer line, slight thigh gap) ============ */}
      <path
        d="M81,166 C79,182 80,196 82,207 C85,215 86,223 85,231 C84,239 84,245 85,250 L96,250
           C97,244 97,236 96,229 C95,219 96,208 97,198 C98,186 98,174 97,166 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M91,170 C93,184 94,198 92,211 C91,225 91,240 92,250 L96,250 C97,242 97,232 96,222
           C95,210 96,196 97,184 L97,166 L92,166 Z"
        fill="var(--av-skin-shadow)" opacity="0.5"
      />
      <path
        d="M103,166 C102,174 102,186 103,198 C104,208 105,219 104,229 C103,236 103,244 104,250 L115,250
           C116,245 116,239 115,231 C114,223 115,215 118,207 C120,196 121,182 119,166 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M111,168 C114,182 115,198 113,212 C112,226 112,240 113,250 L115,250 C116,244 116,236 115,229
           C114,221 115,213 118,205 C120,195 120,180 119,168 Z"
        fill="var(--av-skin-shadow)" opacity="0.5"
      />

      {/* ============ SHOES ============ */}
      <path d="M83,250 C82,256 80,260 76,263 C73,265 74,268 78,268 L95,268 C98,268 99,265 98,262
               C97,258 96,254 96,250 Z" fill={SHOE} />
      <path d="M75,263 L98,263 C99,265 98,268 95,268 L78,268 C74,268 73,265 75,263 Z" fill={SHOE_SOLE} />
      <path d="M104,250 C104,254 103,258 102,262 C101,265 102,268 105,268 L122,268 C126,268 127,265 124,263
               C120,260 118,256 117,250 Z" fill={SHOE} />
      <path d="M102,263 L125,263 C127,265 126,268 122,268 L105,268 C102,268 101,265 102,263 Z" fill={SHOE_SOLE} />

      {/* ============ LEGGINGS (hip flare, high waist) ============ */}
      <path
        d="M77,130 C74,140 73,151 74,161 C75,167 80,171 86,170 L96,168 L100,176 L104,168 L114,170
           C120,171 125,167 126,161 C127,151 126,140 123,130 Z"
        fill={LEGGING}
      />
      <path d="M110,130 C114,142 116,154 115,168 L114,170 C120,171 125,167 126,161
               C127,151 126,140 123,130 Z" fill={LEGGING_SHADOW} />
      {/* waistband */}
      <path d="M77,130 L123,130 L124,134 L76,134 Z" fill={KIT_SHADOW} />
      {/* hip highlight keeps the flare readable against dark gear */}
      <path d="M76,142 C75,150 75,157 76,163 C74,157 74,148 75,141 Z"
        fill="#3A4257" opacity="0.7" />

      {/* ============ ARMS (slimmer, same deltoid centers) ============ */}
      <path
        d="M53,86 C51,73 62,66 73,70 C80,73 83,79 82,86 L80,104 C79,113 76,123 71,131 L65,149
           C63,155 61,159 60,162 L47,158 C48,151 50,144 53,136 L58,114 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M73,74 C78,81 79,93 76,105 C72,120 66,141 61,159 L60,162 L54,160 C57,148 61,133 65,119
           C69,105 71,88 70,76 Z"
        fill="var(--av-skin-shadow)" opacity="0.42"
      />
      <path d="M45,159 C49,154 57,155 60,161 C62,167 59,173 53,174 C47,175 43,169 44,164 Z"
        fill="var(--av-skin)" />
      <path d="M56,156 C60,159 61,166 58,170 C56,173 53,174 50,173 C55,170 58,163 56,156 Z"
        fill="var(--av-skin-shadow)" opacity="0.45" />
      <path
        d="M147,86 C149,73 138,66 127,70 C120,73 117,79 118,86 L120,104 C121,113 124,123 129,131 L135,149
           C137,155 139,159 140,162 L153,158 C152,151 150,144 147,136 L142,114 Z"
        fill="var(--av-skin)"
      />
      <path
        d="M136,72 C143,78 147,87 145,99 C144,112 147,133 151,155 L153,158 L145,160 C142,146 137,129 134,113
           C131,99 132,84 133,74 Z"
        fill="var(--av-skin-shadow)" opacity="0.48"
      />
      <path d="M155,159 C151,154 143,155 140,161 C138,167 141,173 147,174 C153,175 157,169 156,164 Z"
        fill="var(--av-skin)" />
      <path d="M151,157 C155,161 156,167 152,171 C157,169 158,162 155,158 Z"
        fill="var(--av-skin-shadow)" opacity="0.5" />

      {/* ============ TORSO (ribcage → waist pinch → hip) ============ */}
      <path
        d="M68,84 C71,71 83,63 100,63 C117,63 129,71 132,84
           C130,94 127,102 122,110 C119,117 118,126 119,134 L81,134
           C82,126 81,117 78,110 C73,102 70,94 68,84 Z"
        fill="var(--av-skin)"
      />
      {/* right-side body shade */}
      <path d="M114,65 C124,68 130,74 132,84 C130,94 127,102 122,110 C119,117 118,126 119,134 L109,134
               C112,124 115,112 117,100 C119,88 117,73 114,65 Z"
        fill="var(--av-skin-shadow)" opacity="0.4" />
      {/* midriff: navel + soft oblique shading */}
      <path d="M100,116 C100.6,119 100.6,122 100,125" stroke="var(--av-skin-shadow)"
        strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M86,112 C88,118 89,125 88,131 C86,125 85,118 86,112 Z"
        fill="var(--av-skin-shadow)" opacity="0.3" />
      <path d="M114,112 C112,118 111,125 112,131 C114,125 115,118 114,112 Z"
        fill="var(--av-skin-shadow)" opacity="0.35" />

      {/* ============ SPORTS BRA ============ */}
      <path
        d="M69,80 C72,69 83,62 100,62 C117,62 128,69 131,80
           C131,90 129,98 126,106 C117,111 83,111 74,106 C71,98 69,90 69,80 Z"
        fill={KIT}
      />
      <path d="M113,64 C123,67 129,72 131,80 C131,90 129,98 126,106 C122,108 116,109 110,110
               C116,98 118,80 113,64 Z" fill={KIT_SHADOW} />
      {/* scoop neckline: skin notch */}
      <path d="M90,62.5 C94,60.5 106,60.5 110,62.5 C108,69 104,72.5 100,72.5
               C96,72.5 92,69 90,62.5 Z" fill="var(--av-skin)" />
      <path d="M100,61.5 L110,62.5 C108,69 104,72.5 100,72.5 Z"
        fill="var(--av-skin-shadow)" opacity="0.4" />
      {/* bust shaping: centre seam + underbust curves */}
      <path d="M100,74 C100.6,82 100.6,90 100,97" stroke={KIT_SHADOW} strokeWidth="1.2"
        strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M78,90 C82,98 90,102 98,99 C90,104 80,100 78,90 Z" fill={KIT_SHADOW} opacity="0.95" />
      <path d="M122,90 C118,98 110,102 102,99 C110,104 120,100 122,90 Z" fill={KIT_SHADOW} opacity="0.95" />
      {/* underband */}
      <path d="M74,104 C86,109 114,109 126,104 L126,107 C114,112 86,112 74,107 Z" fill={KIT_SHADOW} />
      {/* strap highlight */}
      <path d="M84,66 C82,72 81,79 81,86 C79,79 80,71 82,65 Z" fill="#333A4E" opacity="0.8" />

      {/* trapezius / collarbone */}
      <path d="M82,61 C87,56 94,53 100,53 L100,63 C94,63 88,64 82,66 Z" fill="var(--av-skin)" />
      <path d="M118,61 C113,56 106,53 100,53 L100,63 C106,63 112,64 118,66 Z"
        fill="var(--av-skin-shadow)" />
      <path d="M87,64.5 C92,62.5 96,62 99,62.2" stroke="var(--av-skin-shadow)" strokeWidth="0.8"
        strokeLinecap="round" fill="none" opacity="0.5" />

      {/* ============ NECK + HEAD ============ */}
      <path d="M94,46 L94,60 C97,63.5 103,63.5 106,60 L106,46 Z" fill="var(--av-skin)" />
      <path d="M100,46 L106,46 L106,60 C104,62.5 102,63.5 100,63.5 Z"
        fill="var(--av-skin-shadow)" opacity="0.5" />
      {/* rounder skull, tapered jaw, soft chin */}
      <path
        d="M84,32 C84,18 90.5,11 100,11 C109.5,11 116,18 116,32
           C116,42 112,50 106,55 C103,57.2 97,57.2 94,55 C88,50 84,42 84,32 Z"
        fill="var(--av-skin)"
      />
      <path d="M104,12.5 C111,15 116,22 116,32 C116,42 112,50 106,55 C104.6,56 103,56.6 101.4,56.8
               C107,48 110,38 109,28 C108.6,21 106.6,15.6 104,12.5 Z"
        fill="var(--av-skin-shadow)" opacity="0.42" />
      <ellipse cx="84.6" cy="35" rx="3" ry="4.6" fill="var(--av-skin)" />
      <ellipse cx="115.4" cy="35" rx="3" ry="4.6" fill="var(--av-skin-shadow)" />

      {/* ============ FACE ============ */}
      {/* lid sockets */}
      <path d="M88,33.2 C90.4,31.2 95.4,31 97.8,32.6 L97.8,34.2 C95.2,32.9 90.8,33.2 88,34.8 Z"
        fill="var(--av-skin-shadow)" opacity="0.4" />
      <path d="M102.2,32.6 C104.6,31 109.6,31.2 112,33.2 L112,34.8 C109.2,33.2 104.8,32.9 102.2,34.2 Z"
        fill="var(--av-skin-shadow)" opacity="0.4" />
      {/* thin arched brows, hair-coloured */}
      <path d="M88,30.2 C90.6,27.6 95.2,27.4 97.8,29.2 L97.6,30.6 C95,29.2 91,29.6 88.6,31.6 Z"
        fill="var(--av-hair)" />
      <path d="M102.2,29.2 C104.8,27.4 109.4,27.6 112,30.2 L111.4,31.6 C109,29.6 105,29.2 102.4,30.6 Z"
        fill="var(--av-hair)" />
      {/* larger eyes */}
      <path d="M88,36 C89.8,33.2 95.2,33 97.4,35.6 C95.8,38.8 90.2,39 88,36 Z" fill="#F1EDE6" />
      <path d="M102.6,35.6 C104.8,33 110.2,33.2 112,36 C109.8,39 104.2,38.8 102.6,35.6 Z" fill="#F1EDE6" />
      <circle cx="92.7" cy="36" r="2.3" fill="#4A3421" />
      <circle cx="107.3" cy="36" r="2.3" fill="#4A3421" />
      <circle cx="92.7" cy="36" r="1.05" fill="#171A22" />
      <circle cx="107.3" cy="36" r="1.05" fill="#171A22" />
      <circle cx="93.4" cy="35.2" r="0.6" fill="#FFFFFF" opacity="0.95" />
      <circle cx="108" cy="35.2" r="0.6" fill="#FFFFFF" opacity="0.95" />
      {/* lash lines + outer flicks */}
      <path d="M88,35.4 C89.8,33 95.2,32.8 97.4,35.2" stroke="#241C15" strokeWidth="1.3"
        strokeLinecap="round" fill="none" />
      <path d="M102.6,35.2 C104.8,32.8 110.2,33 112,35.4" stroke="#241C15" strokeWidth="1.3"
        strokeLinecap="round" fill="none" />
      <path d="M88.4,34.6 C87.2,33.4 86.4,32.8 85.6,32.4" stroke="#241C15" strokeWidth="1"
        strokeLinecap="round" fill="none" />
      <path d="M111.6,34.6 C112.8,33.4 113.6,32.8 114.4,32.4" stroke="#241C15" strokeWidth="1"
        strokeLinecap="round" fill="none" />
      {/* small nose */}
      <path d="M99.8,37 C99.7,39.2 99.5,41.4 99.1,43.4" stroke="var(--av-skin-shadow)"
        strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
      <ellipse cx="98.2" cy="45" rx="0.7" ry="0.45" fill="var(--av-skin-shadow)" opacity="0.75" />
      <ellipse cx="101.8" cy="45" rx="0.7" ry="0.45" fill="var(--av-skin-shadow)" opacity="0.75" />
      {/* blush */}
      <ellipse cx="89.5" cy="43" rx="4" ry="2.4" fill="#C9705E" opacity="0.2" />
      <ellipse cx="110.5" cy="43" rx="4" ry="2.4" fill="#C9705E" opacity="0.24" />
      {/* fuller lips */}
      <path d="M95.4,49.6 C97.2,48.2 98.8,48.8 100,49.5 C101.2,48.8 102.8,48.2 104.6,49.6
               C102.8,50.5 101.2,50.7 100,50.3 C98.8,50.7 97.2,50.5 95.4,49.6 Z"
        fill="#A85C4C" opacity="0.9" />
      <path d="M95.8,50.2 C98.4,52.8 101.6,52.8 104.2,50.2 C103.2,53.4 96.8,53.4 95.8,50.2 Z"
        fill="#C07665" opacity="0.85" />
      <path d="M98.2,51.5 C99.4,52.1 100.6,52.1 101.8,51.5 C100.8,52 99.2,52 98.2,51.5 Z"
        fill="#FFFFFF" opacity="0.35" />
      {/* chin */}
      <path d="M98.2,54.6 C99.4,55.3 100.6,55.3 101.8,54.6" stroke="var(--av-skin-shadow)"
        strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.45" />
    </g>
  );
}

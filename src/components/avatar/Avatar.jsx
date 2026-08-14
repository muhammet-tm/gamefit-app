import React, { useCallback, useEffect, useState } from 'react';
import BaseBody from './layers/BaseBody';
import BaseBodyF from './layers/BaseBodyF';
import { HAIR_PATHS } from './layers/hair';
import { ACCESSORY_LAYERS } from './layers/accessories';
import { classColors, avatarCssVars, hairPreset, DEFAULT_CONFIG } from './palettes';
import { useAvatarTheme } from './theme';
import { TIER_GLOW, cumulativeGear } from './tiers';
import warrior from './layers/classes/warrior';
import mage from './layers/classes/mage';
import archer from './layers/classes/archer';
import knight from './layers/classes/knight';
import ninja from './layers/classes/ninja';

const CLASS_DEFS = { warrior, mage, archer, knight, ninja };

// The two rigs share gear anchors (deltoid centres, head box, belt line) so
// every class×tier gear set fits both without duplicated art.
const BASE_BODIES = { male: BaseBody, female: BaseBodyF };

const ANIM_CLASS = { pulse: 'av-pulse', flicker: 'av-flicker' };

// Must match the av-react duration in index.css. Only used for the safety
// timer below, so drift costs a slightly early or late reset, never a stuck
// avatar.
const REACT_MS = 380;

function renderPiece(piece, key, reveal) {
  const { d, fill, opacity, stroke, strokeWidth, fillRule, aura, animated } = piece;
  const base = aura ? 'av-aura' : animated ? ANIM_CLASS[animated] : undefined;
  // `reveal` is the stagger index for gear earned in the rank-up being shown;
  // null for everything the player already had.
  const cls = reveal == null ? base : [base, 'av-reveal'].filter(Boolean).join(' ');
  return (
    <path
      key={key}
      d={d}
      fill={fill ?? 'none'}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fillRule={fillRule}
      className={cls}
      style={reveal == null ? undefined : { '--gf-i': reveal }}
    />
  );
}

/**
 * The GameFit avatar. One component for every surface.
 *
 * @param {string} avatarClass 'warrior'|'mage'|'archer'|'knight'|'ninja'
 * @param {number} tier        1..5 (visual evolution)
 * @param {string} body        'male'|'female' — separate drawn rigs
 * @param {string} skinTone    key of SKIN_TONES
 * @param {string} hair        preset id like 'short_black' (style_color)
 * @param {string[]} accessories equipped shop accessory ids
 * @param {number} size        rendered width in px (height = 1.4x)
 * @param {boolean} animate    idle breathing + aura motion
 * @param {string} theme       'dark'|'light' — pins the palette. Omit in the
 *                             app so it follows the live theme; render scripts
 *                             pass it because they have no DOM to read.
 * @param {boolean} interactive makes the avatar respond to tap/click/Enter.
 *                             Only worth it where the avatar is the subject of
 *                             the screen — not for 46px list rows, where a
 *                             tappable-looking figure inside an already
 *                             tappable row is a target people miss.
 * @param {Function} onActivate optional callback fired alongside the reaction
 */
export default function Avatar({
  avatarClass = DEFAULT_CONFIG.class,
  tier = 1,
  body = DEFAULT_CONFIG.body,
  skinTone = DEFAULT_CONFIG.skin_tone,
  hair = DEFAULT_CONFIG.hair,
  accessories = [],
  size = 120,
  animate = true,
  className = '',
  style,
  theme,
  interactive = false,
  onActivate,
  revealFromTier,
}) {
  const activeTheme = useAvatarTheme(theme);
  const [reacting, setReacting] = useState(false);

  // Retriggering needs the class to actually leave the DOM between taps, or a
  // second tap during the first animation does nothing. animationend clears it.
  const react = useCallback(() => {
    setReacting(true);
    onActivate?.();
  }, [onActivate]);

  // animationend is the normal path, but it does not always arrive: under
  // prefers-reduced-motion the rule is `animation: none`, so there is no
  // animation to end, and a background tab freezes the animation clock. Either
  // way `reacting` would latch on and the avatar would never respond again —
  // for reduced-motion users, permanently after the first tap. The timer is
  // the guarantee; animationend is just the tidier of the two.
  useEffect(() => {
    if (!reacting) return undefined;
    const id = setTimeout(() => setReacting(false), REACT_MS + 120);
    return () => clearTimeout(id);
  }, [reacting]);

  const interactiveProps = interactive
    ? {
      role: 'button',
      tabIndex: 0,
      onClick: react,
      onKeyDown: e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          react();
        }
      },
      onAnimationEnd: e => {
        if (e.animationName.startsWith('av-react')) setReacting(false);
      },
      style: { cursor: 'pointer' },
    }
    : {};
  const classDef = CLASS_DEFS[avatarClass] || CLASS_DEFS.warrior;
  const colors = classColors(avatarClass, activeTheme);
  const bodyType = BASE_BODIES[body] ? body : DEFAULT_CONFIG.body;
  const Body = BASE_BODIES[bodyType];
  const { style: hairStyle } = hairPreset(hair, bodyType);
  const hairDef = HAIR_PATHS[hairStyle] || HAIR_PATHS.short;

  const t = Math.min(Math.max(Number(tier) || 1, 1), 5);
  const pieces = cumulativeGear(classDef, t);
  const bySlot = { auraB: [], back: [], gear: [], head: [], auraF: [], badge: [] };
  let hideHair = false;
  for (const p of pieces) {
    if (p.hidesHair) hideHair = true;
    (bySlot[p.slot] || bySlot.gear).push(p);
  }

  // Rank-up: gear above `revealFromTier` is what was just earned, so it arrives
  // rather than being there already. One shared counter across slots keeps the
  // stagger in draw order instead of restarting per slot.
  let revealCount = 0;
  const revealIndex = piece =>
    (revealFromTier != null && piece.tier > revealFromTier ? revealCount++ : null);

  // equipped accessories stack on top of class gear in their slots
  for (const id of accessories || []) {
    const acc = ACCESSORY_LAYERS[id];
    if (!acc) continue;
    for (const p of acc.paths) {
      (bySlot[acc.slot] || bySlot.gear).push({ ...p, animated: acc.animated, slot: acc.slot });
    }
  }

  const glow = TIER_GLOW[t];
  const glowColor = glow ? (glow.color === 'class' ? colors.glow : glow.color) : null;

  const cssVars = {
    ...avatarCssVars({ avatarClass, skinTone, hair, body: bodyType, theme: activeTheme }),
    ...style,
  };

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 200 280"
      className={className}
      {...interactiveProps}
      style={{ ...cssVars, ...interactiveProps.style }}
      role={interactive ? 'button' : 'img'}
      aria-label={
        interactive
          ? `${bodyType} ${avatarClass} avatar, tier ${t}. Activate to react.`
          : `${bodyType} ${avatarClass} avatar, tier ${t}`
      }
    >
      {/* The tap reaction wraps everything, including the aura, so the whole
          figure answers as one. It has to be its own element: `animation` is a
          shorthand, so putting av-react on the same node as av-breathe would
          replace the breathing rather than compose with it, and the avatar
          would go still for the length of every tap. */}
      <g className={reacting ? 'av-react' : undefined}>
        {/* auras + effects behind everything */}
        <g className={animate ? 'av-aura-wrap' : undefined}>
          {bySlot.auraB.map((p, i) => renderPiece(p, `ab${i}`, revealIndex(p)))}
        </g>

        {/* the character: glow + idle breathing apply to this group */}
        <g
          className={animate ? 'av-breathe' : undefined}
          style={glowColor ? { filter: `drop-shadow(0 0 ${glow.size}px ${glowColor})` } : undefined}
        >
          {bySlot.back.map((p, i) => renderPiece(p, `bk${i}`, revealIndex(p)))}
          {!hideHair && (hairDef.back || []).map((p, i) => renderPiece(p, `hb${i}`))}
          <Body />
          {bySlot.gear.map((p, i) => renderPiece(p, `g${i}`, revealIndex(p)))}
          {!hideHair && (hairDef.front || []).map((p, i) => renderPiece(p, `hf${i}`))}
          {bySlot.head.map((p, i) => renderPiece(p, `hd${i}`, revealIndex(p)))}
        </g>

        {/* front energy overlays + badge emblem (not part of the body sway) */}
        <g className={animate ? 'av-aura-wrap' : undefined}>
          {bySlot.auraF.map((p, i) => renderPiece(p, `af${i}`, revealIndex(p)))}
        </g>
        {bySlot.badge.map((p, i) => renderPiece(p, `bd${i}`, revealIndex(p)))}
      </g>
    </svg>
  );
}

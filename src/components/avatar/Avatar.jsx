import React from 'react';
import BaseBody from './layers/BaseBody';
import { HAIR_PATHS } from './layers/hair';
import { ACCESSORY_LAYERS } from './layers/accessories';
import { SKIN_TONES, CLASS_COLORS, hairPreset, DEFAULT_CONFIG } from './palettes';
import { TIER_GLOW, cumulativeGear } from './tiers';
import warrior from './layers/classes/warrior';
import mage from './layers/classes/mage';
import archer from './layers/classes/archer';
import knight from './layers/classes/knight';
import ninja from './layers/classes/ninja';

const CLASS_DEFS = { warrior, mage, archer, knight, ninja };

const ANIM_CLASS = { pulse: 'av-pulse', flicker: 'av-flicker' };

function renderPiece(piece, key) {
  const { d, fill, opacity, stroke, strokeWidth, fillRule, aura, animated } = piece;
  const cls = aura ? 'av-aura' : animated ? ANIM_CLASS[animated] : undefined;
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
    />
  );
}

/**
 * The GameFit avatar. One component for every surface.
 *
 * @param {string} avatarClass 'warrior'|'mage'|'archer'|'knight'|'ninja'
 * @param {number} tier        1..5 (visual evolution)
 * @param {string} skinTone    key of SKIN_TONES
 * @param {string} hair        preset id like 'short_black' (style_color)
 * @param {string[]} accessories equipped shop accessory ids
 * @param {number} size        rendered width in px (height = 1.4x)
 * @param {boolean} animate    idle breathing + aura motion
 */
export default function Avatar({
  avatarClass = DEFAULT_CONFIG.class,
  tier = 1,
  skinTone = DEFAULT_CONFIG.skin_tone,
  hair = DEFAULT_CONFIG.hair,
  accessories = [],
  size = 120,
  animate = true,
  className = '',
  style,
}) {
  const classDef = CLASS_DEFS[avatarClass] || CLASS_DEFS.warrior;
  const colors = CLASS_COLORS[avatarClass] || CLASS_COLORS.warrior;
  const skin = SKIN_TONES[skinTone] || SKIN_TONES[DEFAULT_CONFIG.skin_tone];
  const { style: hairStyle, color: hairColor } = hairPreset(hair);
  const hairDef = HAIR_PATHS[hairStyle] || HAIR_PATHS.short;

  const t = Math.min(Math.max(Number(tier) || 1, 1), 5);
  const pieces = cumulativeGear(classDef, t);
  const bySlot = { auraB: [], back: [], gear: [], head: [], auraF: [], badge: [] };
  let hideHair = false;
  for (const p of pieces) {
    if (p.hidesHair) hideHair = true;
    (bySlot[p.slot] || bySlot.gear).push(p);
  }

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
    '--av-skin': skin.base,
    '--av-skin-shadow': skin.shadow,
    '--av-hair': hairColor.base,
    '--av-hair-shadow': hairColor.shadow,
    '--av-hair-light': hairColor.light,
    '--av-c1': colors.c1,
    '--av-c2': colors.c2,
    '--av-metal': colors.metal,
    '--av-glow': colors.glow,
    ...style,
  };

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 200 280"
      className={className}
      style={cssVars}
      role="img"
      aria-label={`${avatarClass} avatar, tier ${t}`}
    >
      {/* auras + effects behind everything */}
      <g className={animate ? 'av-aura-wrap' : undefined}>
        {bySlot.auraB.map((p, i) => renderPiece(p, `ab${i}`))}
      </g>

      {/* the character: glow + idle breathing apply to this group */}
      <g
        className={animate ? 'av-breathe' : undefined}
        style={glowColor ? { filter: `drop-shadow(0 0 ${glow.size}px ${glowColor})` } : undefined}
      >
        {bySlot.back.map((p, i) => renderPiece(p, `bk${i}`))}
        {!hideHair && (hairDef.back || []).map((p, i) => renderPiece(p, `hb${i}`))}
        <BaseBody />
        {bySlot.gear.map((p, i) => renderPiece(p, `g${i}`))}
        {!hideHair && (hairDef.front || []).map((p, i) => renderPiece(p, `hf${i}`))}
        {bySlot.head.map((p, i) => renderPiece(p, `hd${i}`))}
      </g>

      {/* front energy overlays + badge emblem (not part of the body sway) */}
      <g className={animate ? 'av-aura-wrap' : undefined}>
        {bySlot.auraF.map((p, i) => renderPiece(p, `af${i}`))}
      </g>
      {bySlot.badge.map((p, i) => renderPiece(p, `bd${i}`))}
    </svg>
  );
}

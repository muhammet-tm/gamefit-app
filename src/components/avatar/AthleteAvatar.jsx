import React, { useEffect, useRef, useState } from 'react';
import { TIER_CONFIG } from './tiers';
import {
  getAthlete, ATHLETES, athleteImage, athleteFace, athletePose, disciplineOf,
  ATHLETE_IMAGE_WIDTHS, ATHLETE_SOURCE,
} from './athletes';

// How long a tap shows the celebrating picture. It clears on a timer rather
// than on a transition event: under prefers-reduced-motion there is no
// transition, so an event-based reset would never fire and the picture would
// stay on celebrate after one tap.
const REACTION_MS = 1600;

// Below this width a full-body figure is too small to recognise, so 'auto'
// switches to the round face crop.
const FACE_BELOW = 64;

// The bust view shows a square of this many source pixels, starting this far
// above the face centre: head to waist, with room for raised hands.
const BUST_SIDE = 1050;
const BUST_ABOVE_FACE = 300;

const srcSetFor = (id, pose) =>
  ATHLETE_IMAGE_WIDTHS.map(w => `${athleteImage(id, pose, w)} ${w}w`).join(', ');

/**
 * One athlete, in one of three framings:
 *  - portrait: the full figure on its own dark stage, as a 2:3 card. The
 *    images carry their own charcoal ground and spotlight, so they are framed
 *    rather than cut out, and the card reads correctly on any surface.
 *  - bust: a circle showing head to waist, for round frames such as the XP
 *    ring on Home.
 *  - face: a small round face crop, for lists and headers.
 *
 * @param {string} athleteId   one of ATHLETE_IDS
 * @param {number} tier        1-5; colours the frame and selects the elite kit at 5
 * @param {string} [pose]      force a picture ('idle' | 'celebrate' | 'elite' | 'rest')
 * @param {string} [moment]    'celebrate' for a finished workout or a level-up
 * @param {boolean} [resting]  rest-day clothes (ignored at the elite tier)
 * @param {number} size        width in px (portrait height is 1.5x; bust and face are square)
 * @param {string} variant     'auto' | 'portrait' | 'bust' | 'face'
 * @param {boolean} interactive tap, click, Enter, or Space shows the celebrating picture
 * @param {boolean} priority   load eagerly (the above-the-fold hero)
 */
export default function AthleteAvatar({
  athleteId, tier = 1, pose, moment = null, resting = false,
  size = 120, variant = 'auto', interactive = false, onActivate,
  priority = false, frame = true, className = '', style,
}) {
  const athlete = getAthlete(athleteId) || ATHLETES[0];
  const t = Math.min(Math.max(Number(tier) || 1, 1), 5);
  const tierCfg = TIER_CONFIG[t];
  const basePose = pose || athletePose({ tier: t, moment, resting });
  const kind = variant === 'auto' ? (size < FACE_BELOW ? 'face' : 'portrait') : variant;

  const [reacting, setReacting] = useState(false);
  // The celebrating picture is only requested once someone interacts, so a
  // screen of avatars does not download a second image for each one.
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const activate = () => {
    if (!interactive) return;
    setArmed(true);
    setReacting(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReacting(false), REACTION_MS);
    onActivate?.();
  };

  const altText = `${athlete.name}, ${disciplineOf(athlete)}, ${tierCfg.label} rank`;
  const interactiveProps = interactive ? {
    role: 'button',
    tabIndex: 0,
    'aria-label': `${altText}. Tap to celebrate`,
    onClick: activate,
    onPointerEnter: () => setArmed(true),
    onFocus: () => setArmed(true),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    },
  } : {};
  const loading = priority ? 'eager' : 'lazy';

  if (kind === 'face') {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={{
          width: size, height: size, backgroundColor: '#141416',
          boxShadow: frame ? `0 0 0 ${size >= 40 ? 2 : 1.5}px ${t >= 2 ? tierCfg.color : 'var(--gf-border)'}` : undefined,
          ...style,
        }}
        {...interactiveProps}
      >
        <img
          src={athleteFace(athlete.id)} alt={interactive ? '' : altText}
          width={size} height={size} loading={loading} decoding="async" draggable={false}
          className="block h-full w-full object-cover select-none"
        />
      </span>
    );
  }

  // Portrait and bust share the same pose images and differ only in the box
  // and where the image sits inside it.
  let box;
  let imgBox;
  if (kind === 'bust') {
    const s = size / BUST_SIDE;
    const top = Math.max(0, athlete.faceY - BUST_ABOVE_FACE);
    box = { width: size, height: size, borderRadius: '50%' };
    imgBox = {
      position: 'absolute',
      width: ATHLETE_SOURCE.width * s,
      height: ATHLETE_SOURCE.height * s,
      left: -((ATHLETE_SOURCE.width - BUST_SIDE) / 2) * s,
      top: -top * s,
      maxWidth: 'none',
    };
  } else {
    const radius = Math.max(8, Math.round(size * 0.07));
    box = { width: size, height: Math.round(size * 1.5), borderRadius: radius };
    imgBox = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
  }
  const renderedWidth = Math.round(typeof imgBox.width === 'number' ? imgBox.width : size);
  const glow = t >= 3 ? `, 0 0 ${t * 4}px ${tierCfg.color}55` : '';

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        ...box,
        backgroundColor: '#141416',
        boxShadow: frame ? `0 0 0 1.5px ${tierCfg.border}${glow}` : undefined,
        ...style,
      }}
      {...interactiveProps}
    >
      <img
        src={athleteImage(athlete.id, basePose)} srcSet={srcSetFor(athlete.id, basePose)}
        sizes={`${renderedWidth}px`} alt={interactive ? '' : altText}
        loading={loading} decoding="async" draggable={false}
        className="block object-cover select-none" style={imgBox}
      />
      {interactive && armed && basePose !== 'celebrate' && (
        <img
          src={athleteImage(athlete.id, 'celebrate')} srcSet={srcSetFor(athlete.id, 'celebrate')}
          sizes={`${renderedWidth}px`} alt="" aria-hidden="true"
          decoding="async" draggable={false}
          className="block object-cover select-none transition-opacity duration-200 motion-reduce:transition-none"
          style={{ ...imgBox, opacity: reacting ? 1 : 0 }}
        />
      )}
    </span>
  );
}

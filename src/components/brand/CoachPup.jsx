import React, { useEffect, useRef, useState } from 'react';
import { PUP, POSES } from './pupRig';
import { COACH_NAME } from '@/lib/coach';

// The coach pup, drawn as SVG parts and moved by a small animation loop that
// writes transforms straight to the parts (no React re-render per frame).
// It is always a little alive: breathing, blinking, tail and ear movement.
// A pose eases in over about 300 ms. Under prefers-reduced-motion it holds
// the pose still and does not blink.
//
// variant 'full' is the whole body (200x240 grid); 'face' is the head only,
// square, for chat avatars and small headers.

const OUTLINE = { stroke: PUP.line, strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' };
const REACTION_MS = 1400;

function Emote({ kind }) {
  const L = PUP.line;
  switch (kind) {
    case 'sparkle':
      return (<>
        <path d="M158,30 l4,11 11,4 -11,4 -4,11 -4,-11 -11,-4 11,-4 Z" fill="#F4B044" stroke={L} strokeWidth="1.5" />
        <path d="M40,44 l2.5,7 7,2.5 -7,2.5 -2.5,7 -2.5,-7 -7,-2.5 7,-2.5 Z" fill="#F4B044" />
      </>);
    case 'question':
      return (<>
        <path d="M156,22 q0,-12 12,-12 q12,0 12,11 q0,8 -9,11 v6" stroke="#F4B044" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="171" cy="48" r="3.4" fill="#F4B044" />
      </>);
    case 'sweat':
      return <path d="M150,44 q7,10 7,15 a7 7 0 0 1 -14 0 q0,-5 7,-15 Z" fill={PUP.sweat} stroke={L} strokeWidth="1.5" />;
    case 'zzz':
      return (
        <g fill="none" stroke="#C8D0DA" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M150,40 h10 l-10,11 h10" /><path d="M164,24 h8 l-8,9 h8" /><path d="M176,10 h6 l-6,7 h6" />
        </g>
      );
    case 'heart':
      return <path d="M164,46 C152,36 150,24 158,20 C163,18 166,22 166,25 C166,22 169,18 174,20 C182,24 180,36 168,46 L166,48 Z" fill="#F07C86" stroke={L} strokeWidth="1.5" />;
    case 'bulb':
      return (<>
        <g stroke="#F4B044" strokeWidth="3" strokeLinecap="round"><path d="M100,-6 v-6" /><path d="M82,0 l-5,-4" /><path d="M118,0 l5,-4" /></g>
        <circle cx="100" cy="12" r="10" fill="#FFE08A" stroke={L} strokeWidth="2" />
        <rect x="95" y="20" width="10" height="6" rx="2" fill="#C8D0DA" stroke={L} strokeWidth="1.5" />
      </>);
    default:
      return null;
  }
}

function Head({ r, eyes, mouth }) {
  const L = PUP.line;
  const open = !['closed', 'happy'].includes(eyes);
  return (
    <g ref={r.head}>
      <g ref={r.earL}>
        <path d="M56,66 L61,16 Q66,13 72,17 L94,44 Z" fill={PUP.fur} {...OUTLINE} />
        <path d="M64,56 L66,28 L84,44 Z" fill={PUP.ear} />
      </g>
      <g ref={r.earR}>
        <path d="M144,66 L139,16 Q134,13 128,17 L106,44 Z" fill={PUP.fur} {...OUTLINE} />
        <path d="M136,56 L134,28 L116,44 Z" fill={PUP.ear} />
      </g>
      <ellipse cx="100" cy="80" rx="53" ry="47" fill={PUP.fur} {...OUTLINE} />
      <path d="M50,86 C50,72 63,63 74,66 C83,69 88,76 92,68 L100,38 L108,68 C112,76 117,69 126,66 C137,63 150,72 150,86 C150,111 129,127 100,127 C71,127 50,111 50,86 Z" fill={PUP.face} />
      <ellipse cx="78" cy="62" rx="5" ry="3.4" fill={PUP.face} />
      <ellipse cx="122" cy="62" rx="5" ry="3.4" fill={PUP.face} />
      {open && (
        <g>
          <g ref={r.eyeL}>
            <circle cx="79" cy="83" r="12" fill={PUP.furDark} />
            <circle cx="79" cy="83" r="10" fill={PUP.eye} {...OUTLINE} strokeWidth="3" />
            <circle ref={r.pupilL} cx="79" cy="84" r="5.5" fill={L} />
            <circle ref={r.glintL} cx="82.5" cy="79.5" r="3" fill="#FFFFFF" />
          </g>
          <g ref={r.eyeR}>
            <circle cx="121" cy="83" r="12" fill={PUP.furDark} />
            <circle cx="121" cy="83" r="10" fill={PUP.eye} {...OUTLINE} strokeWidth="3" />
            <circle ref={r.pupilR} cx="121" cy="84" r="5.5" fill={L} />
            <circle ref={r.glintR} cx="124.5" cy="79.5" r="3" fill="#FFFFFF" />
          </g>
        </g>
      )}
      {eyes === 'closed' && <path d="M69,84 Q79,90 89,84 M111,84 Q121,90 131,84" stroke={L} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {eyes === 'happy' && <path d="M69,86 Q79,74 89,86 M111,86 Q121,74 131,86" stroke={L} strokeWidth="3.6" fill="none" strokeLinecap="round" />}
      {eyes === 'worried' && <path d="M70,68 L86,73 M130,68 L114,73" stroke={L} strokeWidth="3" strokeLinecap="round" />}
      {eyes === 'down' && <path d="M69,74 Q79,70 89,75 M111,75 Q121,70 131,74" stroke={L} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      <ellipse cx="68" cy="102" rx="7" ry="4" fill={PUP.blush} opacity=".35" />
      <ellipse cx="132" cy="102" rx="7" ry="4" fill={PUP.blush} opacity=".35" />
      <path d="M91,97 Q100,93 109,97 Q105,105 100,106 Q95,105 91,97 Z" fill={L} />
      {mouth === 'smile' && <path d="M100,106 V110 M91,110 Q96,116 100,110 Q104,116 109,110" stroke={L} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {mouth === 'grin' && (<><path d="M89,108 Q100,124 111,108 Z" fill={L} /><path d="M95,115 Q100,121 105,115 Z" fill={PUP.tongue} /></>)}
      {mouth === 'talk' && (<><ellipse ref={r.jaw} cx="100" cy="112" rx="7" ry="5" fill={L} /><ellipse cx="100" cy="115" rx="4" ry="2" fill={PUP.tongue} /></>)}
      {mouth === 'o' && <ellipse cx="100" cy="112" rx="3.4" ry="3.8" fill={L} />}
      {mouth === 'flat' && <path d="M93,112 Q100,110 107,112" stroke={L} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {mouth === 'wobble' && <path d="M90,113 Q94,109 98,113 Q102,117 106,113 Q108,111 110,112" stroke={L} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {mouth === 'frown' && <path d="M92,115 Q100,108 108,115" stroke={L} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
    </g>
  );
}

/**
 * @param {string} pose       a key of POSES
 * @param {number} size       width in px (full: height 1.2x; face: square)
 * @param {string} variant    'full' | 'face'
 * @param {boolean} talking   mouth moves as if speaking, over any pose
 * @param {boolean} interactive tap, click, Enter or Space makes it cheer
 * @param {boolean} decorative hidden from screen readers, for places where
 *                             text beside the pup already says everything
 * @param {number} settle      ms after which the pose relaxes to idle (a wave
 *                             that keeps waving forever reads as a glitch)
 */
export default function CoachPup({
  pose = 'idle', size = 120, variant = 'full', talking = false,
  interactive = false, decorative = false, settle = 0, onActivate, title, className = '', style,
}) {
  const [reacting, setReacting] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setSettled(false);
    if (!settle) return undefined;
    const t = setTimeout(() => setSettled(true), settle);
    return () => clearTimeout(t);
  }, [pose, settle]);
  const base = settled ? 'idle' : pose;
  const P = reacting ? POSES.cheer : (POSES[base] || POSES.idle);
  const eyes = P.eyes;
  const mouth = talking && !reacting ? 'talk' : P.mouth;
  const emote = talking && !reacting ? null : P.emote;

  const r = {
    svg: useRef(null), all: useRef(null), body: useRef(null), head: useRef(null), legs: useRef(null),
    armL: useRef(null), armR: useRef(null), sleeveL: useRef(null), sleeveR: useRef(null),
    pawL: useRef(null), pawR: useRef(null), tail: useRef(null), earL: useRef(null), earR: useRef(null),
    eyeL: useRef(null), eyeR: useRef(null), pupilL: useRef(null), pupilR: useRef(null),
    glintL: useRef(null), glintR: useRef(null), jaw: useRef(null), emote: useRef(null),
  };
  const poseRef = useRef(P);
  poseRef.current = P;
  const talkRef = useRef(talking);
  talkRef.current = talking;
  const timer = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const cur = { ...poseRef.current };
    const t0 = performance.now();
    let nextBlink = 1500 + Math.random() * 2500;
    let blinkAt = -1;
    let visible = true;
    let raf = 0;
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
      : null;
    if (io && r.svg.current) io.observe(r.svg.current);
    const set = (ref, v) => { if (ref.current) ref.current.setAttribute('transform', v); };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const Q = poseRef.current;
      const t = (now - t0) / 1000;
      for (const k of ['armL', 'armR', 'head', 'ears', 'tail', 'hop', 'lean', 'armLen']) {
        const target = Q[k] ?? (k === 'armLen' ? 1 : 0);
        cur[k] = (cur[k] ?? target) + (target - (cur[k] ?? target)) * (reduce ? 1 : 0.16);
      }
      const len = cur.armLen;
      for (const [sl, pw] of [[r.sleeveL, r.pawL], [r.sleeveR, r.pawR]]) {
        if (sl.current) sl.current.setAttribute('height', (42 * len).toFixed(1));
        if (pw.current) pw.current.setAttribute('cy', (40 * len).toFixed(1));
      }
      const live = reduce ? 0 : 1;
      const breath = live * Math.sin(t * 2.2) * (Q.slump ? 0.035 : 0.018);
      let hop = 0;
      let sq = 1;
      if (live && cur.hop > 0.05) {
        const ph = (t * 2.4) % 1;
        hop = -Math.sin(ph * Math.PI) * 22 * cur.hop;
        sq = ph < 0.12 || ph > 0.9 ? 1 - 0.08 * cur.hop : 1 + 0.04 * cur.hop;
      }
      if (live && Q.run) hop = -Math.abs(Math.sin(t * 8)) * 8;
      if (live && Q.pump) hop = -Math.abs(Math.sin(t * 5)) * 5;
      if (Q.stretch) sq = 1.06 + live * Math.sin(t * 1.4) * 0.04;
      const slump = Q.slump ? 4 : 0;
      const headY = breath * -60 + slump;
      set(r.all, `translate(0 ${hop.toFixed(2)})`);
      set(r.body, `translate(100 209) scale(${(1 / sq).toFixed(3)} ${(sq + breath).toFixed(3)}) translate(-100 -209)`);
      set(r.head, `translate(0 ${headY.toFixed(2)}) rotate(${(cur.head + cur.lean).toFixed(2)} 100 118)`);
      let aL = cur.armL;
      let aR = cur.armR;
      if (live) {
        if (Q.waveArm) aR += Math.sin(t * 9) * 16;
        if (Q.talkArms || talkRef.current) { aR += Math.sin(t * 3.1) * 12; aL += Math.sin(t * 2.3 + 1) * 5; }
        if (Q.clap) { const c = Math.max(0, Math.sin(t * 9)); aL -= -8 + c * 10; aR += -8 + c * 10; }
        if (Q.pump) aR += Math.pow(Math.sin(t * 5), 2) * 22;
        if (Q.run) { aL = 30 + Math.sin(t * 8) * 40; aR = -30 + Math.sin(t * 8) * 40; }
        if (Q.shrug) { const s = Math.sin(t * 2.6) * 6; aL += s; aR -= s; }
        if (cur.hop > 0.05) { aL += Math.sin(t * 15) * 6; aR -= Math.sin(t * 15) * 6; }
      }
      const shoulderY = (132 + headY * 0.3).toFixed(2);
      set(r.armL, `translate(70 ${shoulderY}) rotate(${aL.toFixed(2)})`);
      set(r.armR, `translate(130 ${shoulderY}) rotate(${aR.toFixed(2)})`);
      const wag = live * Math.sin(t * (4 + cur.tail * 4)) * (6 + cur.tail * 6);
      set(r.tail, `rotate(${wag.toFixed(2)} 132 176)`);
      const twitch = live && Math.sin(t * 0.7) > 0.96 ? Math.sin(t * 40) * 6 : 0;
      set(r.earL, `rotate(${(-cur.ears - twitch).toFixed(2)} 76 52)`);
      set(r.earR, `rotate(${cur.ears.toFixed(2)} 124 52)`);
      let lx = 0;
      let ly = 0;
      if (Q.eyes === 'up') { lx = 2; ly = -4; } else if (Q.eyes === 'right') lx = 4;
      else if (Q.eyes === 'down') ly = 3.5; else if (Q.eyes === 'worried') ly = 1;
      set(r.pupilL, `translate(${lx} ${ly})`); set(r.pupilR, `translate(${lx} ${ly})`);
      set(r.glintL, `translate(${lx / 2} ${ly / 2})`); set(r.glintR, `translate(${lx / 2} ${ly / 2})`);
      const ms = now - t0;
      if (live && ms > nextBlink) { blinkAt = ms; nextBlink = ms + 2200 + Math.random() * 3000; }
      const b = blinkAt >= 0 && ms - blinkAt < 140 ? 0.12 : 1;
      set(r.eyeL, `translate(79 83) scale(1 ${b}) translate(-79 -83)`);
      set(r.eyeR, `translate(121 83) scale(1 ${b}) translate(-121 -83)`);
      if (r.jaw.current) {
        const open = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * 11) * Math.sin(t * 3.7));
        r.jaw.current.setAttribute('ry', (1.5 + open * 6).toFixed(2));
      }
      if (r.emote.current && live) set(r.emote, `translate(0 ${(Math.sin(t * 3) * 3).toFixed(2)})`);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io?.disconnect(); clearTimeout(timer.current); };
    // The loop reads everything it needs from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activate = () => {
    if (!interactive) return;
    setReacting(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReacting(false), REACTION_MS);
    onActivate?.();
  };
  const label = title ?? COACH_NAME;
  const a11y = interactive
    ? { role: 'button', tabIndex: 0, 'aria-label': `${label}. Tap to cheer`, onClick: activate,
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } } }
    : decorative ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': label };

  const face = variant === 'face';
  return (
    <svg
      ref={r.svg}
      viewBox={face ? '36 2 128 128' : '-6 -16 212 256'}
      width={size}
      height={face ? size : Math.round(size * 256 / 212)}
      className={`${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ overflow: 'visible', ...style }}
      focusable="false"
      {...a11y}
    >
      <g ref={r.all}>
        {!face && (<>
          <ellipse cx="100" cy="230" rx="46" ry="7" fill="#000000" opacity=".25" />
          <g ref={r.tail}>
            <path d="M134,182 C166,182 186,156 176,130 C170,116 154,116 155,129 C157,147 149,163 130,166 Z" fill={PUP.fur} {...OUTLINE} />
            <path d="M176,130 C170,116 154,116 155,129 C158,128 166,126 172,136 Z" fill={PUP.face} {...OUTLINE} />
          </g>
          <g ref={r.legs}>
            <rect x="77" y="190" width="21" height="30" rx="10" fill={PUP.fur} {...OUTLINE} />
            <rect x="102" y="190" width="21" height="30" rx="10" fill={PUP.fur} {...OUTLINE} />
            <path d="M68,214 h22 a6.5 6.5 0 0 1 0 13 h-22 a6.5 6.5 0 0 1 0 -13 Z" fill={PUP.shoe} {...OUTLINE} />
            <path d="M110,214 h22 a6.5 6.5 0 0 1 0 13 h-22 a6.5 6.5 0 0 1 0 -13 Z" fill={PUP.shoe} {...OUTLINE} />
            <path d="M70,221 h20 M110,221 h20" stroke={PUP.top} strokeWidth="3" />
          </g>
          <g ref={r.body}>
            <path d="M63,152 C63,129 79,118 100,118 C121,118 137,129 137,152 L137,184 C137,201 122,209 100,209 C78,209 63,201 63,184 Z" fill={PUP.top} {...OUTLINE} />
            <path d="M86,120 L100,140 L114,120 Z" fill={PUP.face} {...OUTLINE} />
            <path d="M63,181 L137,181 L137,184 C137,201 122,209 100,209 C78,209 63,201 63,184 Z" fill={PUP.shorts} {...OUTLINE} />
            <path d="M66,148 C82,153 118,153 134,148" stroke={PUP.stripe} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M88,124 C90,140 96,150 104,158" stroke={PUP.line} strokeWidth="2" fill="none" opacity=".7" />
            <circle cx="106" cy="160" r="5" fill={PUP.stripe} {...OUTLINE} />
          </g>
        </>)}
        <Head r={r} eyes={eyes} mouth={mouth} />
        {!face && (<>
          <g ref={r.armL}>
            <rect ref={r.sleeveL} x="-9" y="-4" width="18" height="42" rx="9" fill={PUP.top} {...OUTLINE} />
            <circle ref={r.pawL} cx="0" cy="40" r="10" fill={PUP.face} {...OUTLINE} />
          </g>
          <g ref={r.armR}>
            <rect ref={r.sleeveR} x="-9" y="-4" width="18" height="42" rx="9" fill={PUP.top} {...OUTLINE} />
            <circle ref={r.pawR} cx="0" cy="40" r="10" fill={PUP.face} {...OUTLINE} />
            {P.thumb && <ellipse cx="7.5" cy="45" rx="7" ry="4" transform="rotate(35 7.5 45)" fill={PUP.face} {...OUTLINE} strokeWidth="3" />}
          </g>
        </>)}
        {/* Emotes are placed on the full-body grid and would poke out of
            the square face crop, so the face variant leaves them out. */}
        <g ref={r.emote}>{!face && <Emote kind={emote} />}</g>
      </g>
    </svg>
  );
}

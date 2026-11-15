import React, { useEffect, useRef } from 'react';
import { TIER_CONFIG } from '@/components/avatar/tiers';

// Kit Bag "finish" items: a short effect drawn over the athlete when a
// workout ends. One canvas, absolutely placed over its parent (which must be
// positioned), never taking pointer events. Each play lasts DURATION ms and
// then clears, so nothing keeps animating afterwards.
//
// Under prefers-reduced-motion the effect is one still frame shown for the
// same time instead of an animation.
const DURATION = 950;
const BLEED = 28; // px the canvas extends past the parent, so bursts are not clipped

function makeParticles(kind, w, h, tier) {
  const parts = [];
  if (kind === 'rank_confetti') {
    const rank = TIER_CONFIG[tier]?.color || '#F4B044';
    const colors = [rank, '#F4B044', '#FF6B00', '#F4F4F5'];
    for (let i = 0; i < 80; i++) {
      parts.push({
        x: w / 2, y: h * 0.42,
        vx: (Math.random() - 0.5) * 8.5, vy: -Math.random() * 8.5 - 2,
        r: Math.random() * 6.28, c: colors[i % colors.length], s: 4 + Math.random() * 4,
      });
    }
  } else if (kind === 'chalk_cloud') {
    for (let i = 0; i < 56; i++) {
      parts.push({
        x: w / 2 + (Math.random() - 0.5) * 26, y: h * 0.36,
        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
        c: '#F4F4F5', s: 6 + Math.random() * 14, chalk: true,
      });
    }
  }
  return parts;
}

function drawFrame(ctx, kind, parts, w, h, p) {
  ctx.clearRect(0, 0, w, h);
  if (kind === 'finish_tape') {
    const y = h * 0.6;
    const snap = Math.min(p * 2, 1);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#F4F4F5';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(w * 0.3, y + 30 * snap, w / 2 - 6 - snap * 0.28 * w, y + 44 * snap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, y);
    ctx.quadraticCurveTo(w * 0.7, y + 30 * snap, w / 2 + 6 + snap * 0.28 * w, y + 44 * snap);
    ctx.stroke();
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = '#FF6B00';
    ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText('FINISH', 8, y - 6);
    ctx.globalAlpha = 1;
    return;
  }
  const t = p * 60;
  for (const q of parts) {
    const x = q.x + q.vx * t;
    const y = q.y + q.vy * t + (q.chalk ? -0.1 : 0.12) * t * t;
    ctx.globalAlpha = q.chalk ? Math.max(0, 0.55 - p * 0.5) : Math.max(0, 1 - p * 0.6);
    ctx.fillStyle = q.c;
    if (q.chalk) {
      ctx.beginPath();
      ctx.arc(x, y, q.s * (0.6 + p), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(q.r + t * 0.2);
      ctx.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * @param {string} kind     'chalk_cloud' | 'finish_tape' | 'rank_confetti'
 * @param {number} play     plays each time this number changes (0 = not yet)
 * @param {boolean} autoPlay plays once on mount
 * @param {number} tier     1-5, colours rank confetti
 */
export default function FinishEffect({ kind, play = 0, autoPlay = false, tier = 1, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!kind || (!play && !autoPlay)) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const parts = makeParticles(kind, w, h, tier);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let start = 0;
    const timers = [];
    const begin = () => {
      if (reduce) {
        drawFrame(ctx, kind, parts, w, h, 0.35);
        timers.push(setTimeout(() => ctx.clearRect(0, 0, w, h), DURATION));
        return;
      }
      const step = (now) => {
        if (!start) start = now;
        const p = Math.min((now - start) / DURATION, 1);
        drawFrame(ctx, kind, parts, w, h, p);
        if (p < 1) raf = requestAnimationFrame(step);
        else ctx.clearRect(0, 0, w, h);
      };
      raf = requestAnimationFrame(step);
    };
    timers.push(setTimeout(begin, delay));
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };
  }, [kind, play, autoPlay, tier, delay]);

  if (!kind) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-finish={kind}
      className="pointer-events-none absolute"
      style={{ inset: -BLEED, width: `calc(100% + ${BLEED * 2}px)`, height: `calc(100% + ${BLEED * 2}px)` }}
    />
  );
}

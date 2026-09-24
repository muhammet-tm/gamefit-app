import React, { useId } from 'react';

/**
 * The Ignition progress ring: XP into the current level, drawn as a
 * red-to-orange arc around whatever sits inside it (the avatar on Home).
 *
 * The final arc length is the element's resting state and the draw is a CSS
 * animation FROM an empty ring, so under reduced motion, in a background tab
 * or in a headless render the ring simply shows its value. It never depends
 * on an animation finishing to be correct.
 *
 * `from` lets a caller start the draw part-way round, which is how the
 * workout-complete screen shows only the XP just earned travelling.
 */
export default function XPRing({
  value,          // XP into the current level
  max,            // XP needed to clear the current level
  from,           // optional: XP value the draw starts from
  size = 236,
  stroke = 12,
  label,          // accessible description, e.g. "780 XP to Gold II"
  children,
}) {
  const gradId = useId().replace(/:/g, '');
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const startPct = from != null && max > 0 ? Math.min(Math.max(from / max, 0), 1) : 0;
  const offset = c * (1 - pct);
  const startOffset = c * (1 - startPct);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E53E3E" />
            <stop offset="1" stopColor="#FF6B00" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="var(--gf-bg-surface)"
          stroke="var(--gf-bg-elevated)" strokeWidth={stroke} />
        <circle
          className="gf-ring-draw"
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ strokeDashoffset: offset, '--gf-ring-from': startOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

import React from 'react';

/**
 * The XP meter.
 *
 * Replaces a 3px rounded bar with a segmented one. The reason is not
 * decoration: a continuous bar at 40% and at 45% look identical, so the bar
 * could not answer the only question a player asks it ("how much more?").
 * Twelve segments make progress countable at a glance, which is what a
 * progression game needs its core readout to do.
 *
 * The fill animates segment by segment, left to right. That cadence is the
 * app's signature motion — effort becomes a quantity, the quantity fills a
 * meter — and it is reused by the streak dots and the XP history.
 */

const SEGMENTS = 12;

export default function XPMeter({
  value,            // XP into the current level
  max,              // XP needed to clear the current level
  label,            // e.g. "4,280 XP"
  caption,          // e.g. "1,220 to Gold I"
  animate = true,
  segments = SEGMENTS,
  className = '',
}) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const exact = pct * segments;
  const full = Math.floor(exact);
  const partial = exact - full;

  return (
    <div className={className}>
      <div
        className="flex gap-[3px]"
        style={{ height: 12 }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(value)}
        aria-label={caption ? `${label}. ${caption}` : label}
      >
        {Array.from({ length: segments }, (_, i) => {
          const fill = i < full ? 1 : i === full ? partial : 0;
          return (
            <span
              key={i}
              className="relative flex-1 overflow-hidden rounded-[2px]"
              style={{ backgroundColor: 'var(--gf-bg-primary)' }}
            >
              {fill > 0 && (
                <span
                  className="gf-xp-seg absolute inset-y-0 left-0 block"
                  style={{
                    width: `${fill * 100}%`,
                    backgroundColor: 'var(--gf-gold)',
                    animationDelay: animate ? `${i * 55 + 120}ms` : undefined,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>

      {(label || caption) && (
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className="font-mono text-[11.5px] font-bold tabular-nums"
            style={{ color: 'var(--gf-text-primary)' }}
          >
            {label}
          </span>
          <span
            className="font-mono text-[11.5px] tabular-nums"
            style={{ color: 'var(--gf-text-secondary)' }}
          >
            {caption}
          </span>
        </div>
      )}
    </div>
  );
}

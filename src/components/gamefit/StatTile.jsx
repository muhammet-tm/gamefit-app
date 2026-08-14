import React from 'react';

/**
 * A single figure with its label.
 *
 * The hierarchy here used to be inverted: "Total XP" was set larger and
 * heavier than 540. In a progression game the number is the product, so the
 * figure dominates and the label recedes to a small tracked caption.
 *
 * Figures are mono and tabular so they do not shift width while counting up,
 * and so a column of tiles aligns on the digits.
 */
export default function StatTile({ value, unit, label, tone = 'default' }) {
  const color =
    tone === 'gold' ? 'var(--gf-gold-text)'
      : tone === 'ember' ? 'var(--gf-ember-text)'
        : 'var(--gf-text-primary)';

  return (
    <div className="px-3 py-3.5" style={{ backgroundColor: 'var(--gf-bg-surface)' }}>
      <p
        className="font-mono text-[25px] font-bold leading-none tabular-nums tracking-[-0.03em]"
        style={{ color }}
      >
        {value}
        {unit && (
          <span className="text-[13px]" style={{ color: 'var(--gf-text-secondary)' }}>
            {unit}
          </span>
        )}
      </p>
      <p
        className="mt-[7px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.13em]"
        style={{ color: 'var(--gf-text-secondary)' }}
      >
        {label}
      </p>
    </div>
  );
}

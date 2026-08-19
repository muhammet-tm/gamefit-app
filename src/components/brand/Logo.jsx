import React from 'react';
import {
  MASCOT_DETAILED,
  MASCOT_SIMPLE,
  WORDMARK_GLYPHS,
  WORDMARK_HEIGHT,
  WORDMARK_TONES,
  WORDMARK_WIDTH,
} from '@/lib/brand';

// Inline SVG rather than an <img>. The mark is on the first paint of the
// splash and login routes, and a separate file there is a second round trip
// before anything appears. It also means the mark inherits the page's colour
// handling instead of shipping two PNGs for two themes.

function Shape({ spec, stroke }) {
  const { t: Tag, ...rest } = spec;
  return <Tag {...rest} stroke={rest.stroke ?? stroke} />;
}

/**
 * The husky on its own, no ground behind it.
 *
 * `size` picks the drawing, not just the scale: at or below 48px the detailed
 * rig loses its catchlights and smile to anti-aliasing and reads as smudges,
 * so the simplified rig with a heavier outline takes over. Pass `detail`
 * explicitly to override.
 */
export function Mascot({ size = 64, detail, title, className = '', ...rest }) {
  const rig = (detail ?? (size <= 48 ? 'simple' : 'detailed')) === 'simple'
    ? MASCOT_SIMPLE
    : MASCOT_DETAILED;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      {...rest}
    >
      <g
        stroke={rig.stroke}
        strokeWidth={rig.strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {rig.shapes.map((spec, i) => (
          <Shape key={i} spec={spec} stroke={rig.stroke} />
        ))}
      </g>
    </svg>
  );
}

/**
 * GAMEFIT as outlines. No font dependency, so it cannot reflow or fall back
 * to a system stack mid-load, and it is identical on every platform.
 *
 * `tone` defaults to `auto`, which paints from the palette rather than from
 * literal hex: GAME takes `currentColor` and FIT takes `--gf-gold-text`. That
 * matters because the app toggles `.dark` on <html> and both tokens flip.
 * Pinning tone="dark" here would put #F2F5F7 lettering on the #EDF2F5 light
 * background at 1.02:1 — the mark would simply disappear. Pass an explicit
 * tone only when the mark sits on a ground that does *not* follow the theme,
 * such as inside a fixed-navy card.
 */
export function Wordmark({ height = 28, tone = 'auto', title, className = '', ...rest }) {
  const colours = tone === 'auto'
    ? { text: 'currentColor', gold: 'var(--gf-gold-text)' }
    : (WORDMARK_TONES[tone] ?? WORDMARK_TONES.dark);
  const width = Math.round((height * WORDMARK_WIDTH) / WORDMARK_HEIGHT);

  return (
    <svg
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      width={width}
      height={height}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      {...rest}
    >
      {WORDMARK_GLYPHS.map((glyph, gi) => {
        const colour = colours[glyph.tone];
        return (
          <g key={gi} transform={`translate(${glyph.x},0)`}>
            {glyph.shapes.map(({ t: Tag, stroke, fill, ...rest2 }, si) => (
              <Tag
                key={si}
                {...rest2}
                fill={fill === 'none' ? 'none' : colour}
                stroke={stroke ? colour : undefined}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Mascot plus lettering. The gap is proportional to the height so the lockup
 * holds its proportions at any size rather than drifting apart when small.
 */
export function Logo({ height = 40, tone = 'auto', title = 'GameFit', className = '', ...rest }) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: `${height * 0.24}px` }}
      role="img"
      aria-label={title}
      {...rest}
    >
      <Mascot size={height * 1.15} />
      <Wordmark height={height * 0.58} tone={tone} />
    </span>
  );
}

export default Logo;

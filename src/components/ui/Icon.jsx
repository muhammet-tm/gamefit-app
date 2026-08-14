/**
 * GameFit discipline pictograms.
 *
 * Scope note: the app already uses lucide-react across 25 files for generic UI
 * chrome (Bell, Lock, Trophy, Crown, Flame, Coins, Zap, ...). This file is
 * deliberately NOT a second general icon set. It holds only the glyphs lucide
 * has no good equivalent for: the eleven exercise disciplines, which are the
 * product's own vocabulary and were previously rendered as emoji.
 *
 * For anything else, import from lucide-react.
 *
 * House rules for every glyph here:
 *   - 24x24 viewBox on a consistent optical grid
 *   - stroke-based, 1.8 stroke width, round caps and joins, matching lucide
 *   - `currentColor` only, so an icon inherits its context and themes for free
 *
 * Usage:  <Icon name="run" size={22} className="text-gf-gold" />
 * Decorative by default (aria-hidden). Pass `title` when the icon is the only
 * label for a control, which also switches it to role="img".
 */

const P = {
  run: <><circle cx="14.5" cy="4.2" r="1.9" /><path d="M9 21l2.6-5.1 3-2.2-1.2-4.6-3.6 2-1.6 3" /><path d="M13.4 9.1l3.3 1.6 2.6-.6" /><path d="M14.6 13.7l1.9 3.2 2.8 1.4" /></>,
  bike: <><circle cx="5.5" cy="17" r="3.5" /><circle cx="18.5" cy="17" r="3.5" /><path d="M8 17l4-8h4" /><path d="M12 9L9.5 5.5H7" /><path d="M18.5 17l-3-6.5" /></>,
  lift: <><path d="M3 9v6M6 7v10M18 7v10M21 9v6" /><path d="M6 12h12" /></>,
  swim: <><path d="M3 17.5c1.6-1.2 2.6-1.2 4.2 0s2.6 1.2 4.2 0 2.6-1.2 4.2 0 2.6 1.2 4.2 0" /><path d="M6 13.5l4.5-3.5 3.5 2.5" /><circle cx="17" cy="7.5" r="1.8" /></>,
  yoga: <><circle cx="12" cy="4.8" r="1.9" /><path d="M12 8v5" /><path d="M12 13l-4 7M12 13l4 7" /><path d="M5 10.5l7 1.5 7-1.5" /></>,
  hiit: <><path d="M13.5 2.5 5 13.5h6l-1.5 8L18 10.5h-6z" /></>,
  // glove head-on. The knuckle grooves are what stop it reading as a mug.
  box: <><path d="M5.6 10.2a6.4 6.4 0 0 1 12.8 0v3.5a2.6 2.6 0 0 1-2.6 2.6H8.2a2.6 2.6 0 0 1-2.6-2.6z" /><path d="M18.4 11.2h.7a1.9 1.9 0 0 1 0 3.8h-.7" /><path d="M9 9.9v3.1M12 9.6v3.4M15 9.9v3.1" /><path d="M8.4 16.3v1.4A2.5 2.5 0 0 0 10.9 20.2h2.2a2.5 2.5 0 0 0 2.5-2.5v-1.4" /></>,
  basketball: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /><path d="M5.5 5.5c3.5 3 3.5 10 0 13M18.5 5.5c-3.5 3-3.5 10 0 13" /></>,
  football: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" /><path d="M12 3v4.5M4.2 9.6l3.5 1M19.8 9.6l-3.5 1M7.7 20.2l1.6-4.6M16.3 20.2l-1.6-4.6" /></>,
  walk: <><circle cx="13" cy="4.2" r="1.8" /><path d="M11 21l1.5-6-2-2.5.8-4.3 3.2 1.8 1 2.8" /><path d="M12.5 15l3 6" /><path d="M10.3 8.2 7.5 10" /></>,
  // "Other": a pulse reads as generic activity without naming a sport.
  activity: <><path d="M2.5 12.5h4l2.6-7.4 4.4 14 2.6-6.6h5.4" /></>,
};

export const ICON_NAMES = Object.keys(P);

export default function Icon({ name, size = 24, className = '', title, strokeWidth = 1.8, ...rest }) {
  const glyph = P[name];
  if (!glyph) {
    if (import.meta.env.DEV) console.warn(`<Icon name="${name}"> is not a discipline glyph; use lucide-react`);
    return null;
  }
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  );
}

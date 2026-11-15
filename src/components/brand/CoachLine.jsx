import React, { useEffect, useMemo, useState } from 'react';
import CoachPup from './CoachPup';

// The coach saying one line: the pup, and a speech bubble beside its head that
// types the line out while the pup's mouth moves. Used wherever the coach
// speaks outside the chat: onboarding, workout complete.
//
// Layout does not jump while typing: the full line is laid out invisibly in
// the same grid cell as the typed part, so the bubble has its final size from
// the first frame. Screen readers get the whole line at once from a hidden
// copy, not the typing.

const REDUCED = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const MS_PER_CHAR = 22;

// 'auto' follows the theme. 'dark' is for screens that paint the Ignition
// charcoal in both themes (onboarding, workout complete), where a themed
// bubble would turn white on a dark page.
const TONES = {
  auto: { bg: 'var(--gf-bg-surface)', border: 'var(--gf-border)', text: 'var(--gf-text-primary)' },
  dark: { bg: '#28282C', border: '#2E2E33', text: '#F5F5F4' },
};

export default function CoachLine({ text, pose = 'idle', size = 64, tone = 'auto', className = '' }) {
  const [shown, setShown] = useState(REDUCED ? (text?.length ?? 0) : 0);

  useEffect(() => {
    const total = text?.length ?? 0;
    if (REDUCED || !total) { setShown(total); return undefined; }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= total) clearInterval(id);
    }, MS_PER_CHAR);
    return () => clearInterval(id);
  }, [text]);

  const typing = shown < (text?.length ?? 0);
  // The pup only re-renders when it starts or stops talking, not on every
  // typed character.
  const pup = useMemo(
    () => <CoachPup pose={pose} talking={typing} size={size} decorative className="flex-shrink-0" />,
    [pose, typing, size],
  );
  const c = TONES[tone] || TONES.auto;

  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      {pup}
      {text && (
        <div
          className="mt-2 min-w-0 flex-1 px-4 py-3 font-body text-[15px] leading-snug"
          style={{
            backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text,
            borderRadius: '4px 18px 18px 18px',
          }}
        >
          <span className="sr-only" aria-live="polite">{text}</span>
          <span aria-hidden="true" style={{ display: 'grid' }}>
            <span style={{ gridArea: '1 / 1', visibility: 'hidden' }}>{text}</span>
            <span style={{ gridArea: '1 / 1' }}>{text.slice(0, shown)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

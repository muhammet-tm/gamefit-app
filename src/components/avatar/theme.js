import { useEffect, useState } from 'react';

// The app switches themes by toggling `.dark` on <html> (GameFitContext's
// toggleTheme). The avatar reads that class directly rather than taking the
// theme from context, for one reason: scripts/render-avatars.mjs renders
// <Avatar/> through react-dom/server with no providers around it. Coupling the
// component to GameFitContext would break every render script.

/** Current theme, or 'dark' when there is no DOM (Node render scripts, SSR). */
export function detectTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Track the app theme. Pass `override` to pin it (render scripts, previews).
 *
 * Watches the class attribute instead of polling, so a theme toggle repaints
 * every avatar on screen in the same frame as the rest of the UI.
 */
export function useAvatarTheme(override) {
  const [theme, setTheme] = useState(() => override || detectTheme());

  useEffect(() => {
    if (override) {
      setTheme(override);
      return undefined;
    }
    const el = document.documentElement;
    const sync = () => setTheme(el.classList.contains('dark') ? 'dark' : 'light');
    sync(); // the class may have changed between first render and mount
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [override]);

  return theme;
}

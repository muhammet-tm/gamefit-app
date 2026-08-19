import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameFit } from '@/lib/GameFitContext';
import { Mascot, Wordmark } from '@/components/brand/Logo';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated } = useGameFit();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0B1A24' }}>
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring' }}
      >
        {/* The logo sits inside the <h1> so the landing route has a real top
            level heading. It had none, which left screen readers with no page
            title to announce and crawlers with no heading at all.

            Inline SVG rather than the app icon PNG, for two reasons. The icon
            bakes its own navy rounded square, and this screen is already navy,
            so it drew a faintly visible box around the mascot. And it is a
            second network round trip on the very first paint of the app.

            The wordmark carries the accessible name; the mascot beside it is
            decorative, or a screen reader announces "GameFit" twice. */}
        <motion.h1
          className="mb-5 flex flex-col items-center gap-5"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
        >
          <Mascot size={148} />
          {/* tone is pinned rather than left on `auto` because this screen
              paints a literal #0B1A24 in both themes, to match the native
              splash. `auto` follows the palette, which would hand the light
              theme navy lettering on navy. */}
          <Wordmark height={38} tone="dark" title="GameFit" />
        </motion.h1>

         <motion.p
           className="font-body text-base"
           style={{ color: '#88A5B7' }}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.6 }}
         >
           Fitness Progress Through Play
         </motion.p>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          role="status"
          aria-label="Loading GameFit"
        >
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 0.2, 0.4].map((d, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#F4B044' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: d }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
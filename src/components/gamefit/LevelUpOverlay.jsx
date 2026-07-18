import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameFit } from '@/lib/GameFitContext';
import { getRank } from '@/lib/ranks';
import UserAvatar from '@/components/avatar/UserAvatar';

// Burst particle explosion from center
function BurstParticles() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 120 + Math.random() * 100;
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      color: ['#C8FF00', '#FFB800', '#7C3AED', '#22C55E', '#FFFFFF'][i % 5],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.3,
    };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.8 + Math.random() * 0.4, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// Falling confetti
function Confetti() {
  const colors = ['#C8FF00', '#FFB800', '#7C3AED', '#22C55E', '#EF4444', '#FFFFFF'];
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    width: 4 + Math.random() * 8,
    height: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: '-20px', width: p.width, height: p.height, backgroundColor: p.color }}
          initial={{ y: 0, rotate: p.rotation, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotation + 720, opacity: [1, 1, 0] }}
          transition={{ duration: 2 + Math.random() * 1.5, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// Pulsing ring effect
function GlowRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: '#C8FF00', width: 160 + i * 60, height: 160 + i * 60 }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: [0.5, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// Notification banner shown after overlay is dismissed
function LevelBanner({ newLevel, title, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="fixed top-4 left-4 right-4 z-[200] mx-auto max-w-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 18 }}
    >
      <div className="rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #4F1DB5)', border: '1px solid rgba(200,255,0,0.4)' }}>
        {/* Animated icon */}
        <motion.div
          className="text-3xl flex-shrink-0"
          animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          🎮
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-black text-lg leading-none" style={{ color: '#C8FF00' }}>
            LEVEL {newLevel} REACHED!
          </div>
          <div className="font-body text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            New rank: <span className="font-semibold text-white">{title}</span>
          </div>
        </div>
        {/* Progress pulse dot */}
        <motion.div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#C8FF00' }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    </motion.div>
  );
}

export default function LevelUpOverlay() {
  const { levelUpData, claimLevelUp, user } = useGameFit();
  const [claimed, setClaimed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'burst' | 'reveal'

  useEffect(() => {
    if (levelUpData) {
      setClaimed(false);
      setShowBanner(false);
      // Short burst phase before revealing content
      setPhase('burst');
      setTimeout(() => setPhase('reveal'), 400);
    }
  }, [levelUpData]);

  const handleClaim = () => {
    setClaimed(true);
    setTimeout(() => {
      claimLevelUp();
      setShowBanner(true);
    }, 500);
  };

  const title = levelUpData ? getRank(levelUpData.newLevel).display : '';

  return (
    <>
      <AnimatePresence>
        {levelUpData && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            {/* Dark backdrop with subtle radial glow */}
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, rgba(0,0,0,0.95) 70%)' }} />

            <Confetti />

            {phase === 'burst' && <BurstParticles />}

            {phase === 'reveal' && (
              <>
                <GlowRings />

                <motion.div
                  className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full"
                  initial={{ scale: 0.3, y: 80, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                >
                  {/* Level badge flash */}
                  <motion.div
                    className="font-heading font-black text-6xl mb-4"
                    style={{ color: '#C8FF00', textShadow: '0 0 40px rgba(200,255,0,0.8)' }}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                  >
                    LEVEL UP!
                  </motion.div>

                  {/* Avatar with tier glow */}
                  <motion.div
                    className="relative mb-5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full blur-3xl"
                      style={{ backgroundColor: '#C8FF00', opacity: 0.5 }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                    />
                    <UserAvatar user={user} tier={levelUpData.newTier} size={130} />
                  </motion.div>

                  {/* Level number */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="font-heading text-3xl font-black text-white">
                      You are now Level <span style={{ color: '#C8FF00' }}>{levelUpData.newLevel}</span>
                    </p>
                    <motion.div
                      className="mt-2 px-5 py-2 rounded-xl inline-block font-heading text-xl font-black"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5CF7)', color: '#FFFFFF' }}
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      🏆 {title}
                    </motion.div>
                  </motion.div>

                  {/* Tier evolved badge */}
                  {levelUpData.newTier > 1 && (
                    <motion.div
                      className="mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ borderColor: '#C8FF00', color: '#C8FF00', border: '1px solid rgba(200,255,0,0.5)', backgroundColor: 'rgba(200,255,0,0.08)' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      ✨ Avatar evolved to Tier {levelUpData.newTier}!
                    </motion.div>
                  )}

                  {/* Coins reward */}
                  <motion.div
                    className="flex items-center gap-3 mt-4 px-6 py-3 rounded-2xl w-full justify-center"
                    style={{ backgroundColor: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.35)' }}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.span
                      className="text-3xl"
                      animate={{ rotate: [0, 20, -20, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                    >🪙</motion.span>
                    <span className="font-heading text-2xl font-black" style={{ color: '#FFB800' }}>
                      +{levelUpData.bonusCoins} Bonus Coins!
                    </span>
                  </motion.div>

                  {/* XP bar showing new level progress */}
                  <motion.div
                    className="w-full mt-4 rounded-xl overflow-hidden h-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div
                      className="h-full rounded-xl"
                      style={{ backgroundColor: '#C8FF00' }}
                      initial={{ width: '0%' }}
                      animate={{ width: '5%' }}
                      transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                    />
                  </motion.div>
                  <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Progress towards Level {levelUpData.newLevel + 1}
                  </p>

                  {/* CTA button */}
                  <motion.button
                    className="w-full py-4 rounded-2xl font-heading font-black text-xl mt-5"
                    style={{ backgroundColor: claimed ? 'rgba(200,255,0,0.3)' : '#C8FF00', color: '#0D0F14' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleClaim}
                    disabled={claimed}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    {claimed ? '✓ Reward Claimed!' : '🎁 Claim Reward'}
                  </motion.button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification banner after overlay closes */}
      <AnimatePresence>
        {showBanner && (
          <LevelBanner
            newLevel={levelUpData?.newLevel || 1}
            title={title}
            onClose={() => setShowBanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
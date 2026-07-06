import React from 'react';
import { motion } from 'framer-motion';
import { BADGES, getEarnedBadgeIds } from '@/lib/badges';

export default function BadgeGrid({ workouts, user }) {
  const earnedIds = getEarnedBadgeIds(workouts, user);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gf-border)' }}>
        <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>🏅 Badges</h3>
        <span className="font-body text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(200,255,0,0.15)', color: 'var(--gf-green)' }}>
          {earnedIds.size}/{BADGES.length} earned
        </span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3">
        {BADGES.map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center"
              style={{
                backgroundColor: earned ? 'rgba(200,255,0,0.08)' : 'var(--gf-bg-elevated)',
                border: `1.5px solid ${earned ? 'rgba(200,255,0,0.35)' : 'var(--gf-border)'}`,
                opacity: earned ? 1 : 0.45,
              }}
            >
              <span className="text-2xl" style={{ filter: earned ? 'none' : 'grayscale(100%)' }}>
                {badge.emoji}
              </span>
              <p className="font-heading font-black text-[11px] leading-tight" style={{ color: earned ? 'var(--gf-text-primary)' : 'var(--gf-text-secondary)' }}>
                {badge.label}
              </p>
              <p className="font-body text-[10px] leading-tight" style={{ color: 'var(--gf-text-secondary)' }}>
                {badge.desc}
              </p>
              {earned && (
                <span className="text-[9px] font-body font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
                  ✓ Earned
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakWidget({ streak, bestStreak, lastWorkoutDate }) {
  // Build last 7 days activity markers
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  // Mark days active based on streak (assume streak days are consecutive ending today/yesterday)
  const lastWorkout = lastWorkoutDate ? new Date(lastWorkoutDate) : null;
  const activeDays = days.map(d => {
    if (!lastWorkout) return false;
    const diffFromLast = Math.floor((lastWorkout - d) / 86400000);
    return diffFromLast >= 0 && diffFromLast < streak;
  });

  const milestones = [3, 7, 14, 30];
  const nextMilestone = milestones.find(m => m > streak) || 30;
  const milestoneProgress = (streak / nextMilestone) * 100;

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,184,0,0.15)' }}>
            <Flame size={16} color="#FFB800" />
          </div>
          <span className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>
            Daily Streak
          </span>
        </div>
        <div className="flex items-center gap-1">
          <motion.span
            key={streak}
            initial={{ scale: 1.4, color: '#FFB800' }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="font-heading font-black text-2xl"
            style={{ color: '#FFB800' }}
          >
            {streak}
          </motion.span>
          <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>days</span>
        </div>
      </div>

      {/* Day dots */}
      <div className="flex justify-between mb-3">
        {days.map((d, i) => {
          const isToday = i === 6;
          const active = activeDays[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={active ? { scale: 0.5 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: active ? '#FFB800' : isToday ? 'rgba(255,184,0,0.15)' : 'var(--gf-bg-elevated)',
                  border: isToday ? '1.5px solid #FFB800' : '1.5px solid transparent',
                }}>
                {active ? <Flame size={14} color="#0D0F14" /> : null}
              </motion.div>
              <span className="font-body text-[10px]" style={{ color: isToday ? '#FFB800' : 'var(--gf-text-secondary)' }}>
                {DAYS[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Milestone progress */}
      <div className="space-y-1">
        <div className="flex justify-between font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
          <span>Next milestone: {nextMilestone} days</span>
          <span>{nextMilestone - streak} to go</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: '#FFB800' }}
            initial={{ width: 0 }} animate={{ width: `${Math.min(milestoneProgress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
        {bestStreak > 0 && (
          <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
            🏆 Best streak: <span style={{ color: '#FFB800' }}>{bestStreak} days</span>
          </p>
        )}
      </div>

      {/* Bonus info */}
      <div className="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
        style={{ backgroundColor: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
        <span className="text-sm">🪙</span>
        <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
          {streak >= 7
            ? <span>7-day bonus active! <span style={{ color: '#FFB800' }}>+50% coins per workout</span></span>
            : streak >= 3
            ? <span>3-day bonus active! <span style={{ color: '#FFB800' }}>+25% coins per workout</span></span>
            : <span>Reach 3 days for a <span style={{ color: '#FFB800' }}>coin bonus!</span></span>
          }
        </p>
      </div>
    </div>
  );
}
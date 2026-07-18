import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '@/api/supabase';
import { useGameFit } from '@/lib/GameFitContext';

// Monthly streak calendar — flames mark active days, with the current streak
// as the hero number and honest milestone rewards beneath (the 3- and 7-day
// coin boosts really exist server-side; 30 days awards the Unstoppable badge).

const MILESTONES = [
  { days: 3, icon: '🔥', label: '+25% coins' },
  { days: 7, icon: '⚡', label: '+50% coins' },
  { days: 30, icon: '🌟', label: 'Unstoppable badge' },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function monthWindow(year, month) {
  // [start, end) as local dates
  return [new Date(year, month, 1), new Date(year, month + 1, 1)];
}

export default function StreakCalendar() {
  const { user } = useGameFit();
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [activeDays, setActiveDays] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [start, end] = monthWindow(view.year, view.month);
      const { data } = await supabase
        .from('workouts')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .limit(200);
      if (!alive) return;
      const days = new Set(
        (data || []).map(w => new Date(w.created_at).getDate()),
      );
      setActiveDays(days);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [view.year, view.month, user.last_workout_date]);

  const [start] = monthWindow(view.year, view.month);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstWeekday = (start.getDay() + 6) % 7; // Monday-first
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();
  const today = now.getDate();
  const monthLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const streak = user.current_streak || 0;
  const nextMilestone = MILESTONES.find(m => m.days > streak);

  const canGoForward = !isCurrentMonth;
  const nav = (dir) => setView(v => {
    const d = new Date(v.year, v.month + dir, 1);
    if (d > now) return v;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      {/* Hero streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.35)' }}>
            <Flame size={22} color="#FFB800" fill={streak > 0 ? '#FFB800' : 'none'} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <motion.span key={streak} className="font-heading font-black text-3xl leading-none"
                style={{ color: 'var(--gf-text-primary)' }}
                initial={{ scale: 1.3, color: '#FFB800' }} animate={{ scale: 1 }}>
                {streak}
              </motion.span>
              <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
                day streak
              </span>
            </div>
            {user.best_streak > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Trophy size={11} color="var(--gf-text-secondary)" />
                <span className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                  Best: {user.best_streak} days
                </span>
              </div>
            )}
          </div>
        </div>
        {/* month nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => nav(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            <ChevronLeft size={15} color="var(--gf-text-secondary)" />
          </button>
          <span className="font-body text-xs font-medium w-24 text-center"
            style={{ color: 'var(--gf-text-secondary)' }}>
            {monthLabel}
          </span>
          <button onClick={() => nav(1)} disabled={!canGoForward}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--gf-bg-elevated)', opacity: canGoForward ? 1 : 0.35 }}>
            <ChevronRight size={15} color="var(--gf-text-secondary)" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center font-body text-[10px] font-semibold py-1"
            style={{ color: 'var(--gf-text-secondary)' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const active = activeDays.has(day);
          const isToday = isCurrentMonth && day === today;
          const isFuture = isCurrentMonth && day > today;
          return (
            <motion.div key={day}
              className="aspect-square rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: active ? 'rgba(255,184,0,0.15)' : 'var(--gf-bg-elevated)',
                border: isToday ? '1.5px solid #FFB800' : `1px solid ${active ? 'rgba(255,184,0,0.4)' : 'transparent'}`,
                opacity: loading ? 0.4 : isFuture ? 0.35 : 1,
              }}
              initial={false}
              animate={active ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.3, delay: Math.min(day * 0.012, 0.4) }}>
              {active ? (
                <Flame size={13} color="#FFB800" fill="#FFB800" />
              ) : (
                <span className="font-body text-[10px]"
                  style={{ color: isFuture ? 'var(--gf-border)' : 'var(--gf-text-secondary)' }}>
                  {day}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Milestone track */}
      <div className="flex items-center gap-2">
        {MILESTONES.map((m) => {
          const reached = streak >= m.days;
          const isNext = nextMilestone && nextMilestone.days === m.days;
          return (
            <div key={m.days} className="flex-1 rounded-xl px-2 py-2 text-center"
              style={{
                backgroundColor: reached ? 'rgba(255,184,0,0.12)' : 'var(--gf-bg-elevated)',
                border: `1px solid ${reached ? 'rgba(255,184,0,0.45)' : isNext ? 'var(--gf-amber)' : 'var(--gf-border)'}`,
                opacity: reached || isNext ? 1 : 0.6,
              }}>
              <div className="text-base leading-none mb-1">{reached ? m.icon : '🎁'}</div>
              <p className="font-heading font-black text-xs" style={{ color: reached ? 'var(--gf-amber)' : 'var(--gf-text-primary)' }}>
                {m.days} days
              </p>
              <p className="font-body text-[9px] leading-tight" style={{ color: 'var(--gf-text-secondary)' }}>
                {m.label}
              </p>
            </div>
          );
        })}
      </div>
      {nextMilestone && (
        <p className="font-body text-xs text-center mt-3" style={{ color: 'var(--gf-text-secondary)' }}>
          {nextMilestone.days - streak} more {nextMilestone.days - streak === 1 ? 'day' : 'days'} to unlock {nextMilestone.icon} {nextMilestone.label}
        </p>
      )}
    </div>
  );
}

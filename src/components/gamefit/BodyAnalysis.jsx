import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Maps each exercise type to the primary body parts it targets
const EXERCISE_MUSCLE_MAP = {
  'Running':        ['Legs', 'Core', 'Cardio'],
  'Cycling':        ['Legs', 'Cardio'],
  'Weight Training':['Chest', 'Arms', 'Back', 'Legs'],
  'Swimming':       ['Back', 'Arms', 'Cardio', 'Core'],
  'Yoga':           ['Core', 'Back', 'Legs'],
  'HIIT':           ['Core', 'Cardio', 'Legs', 'Arms'],
  'Boxing':         ['Arms', 'Core', 'Cardio'],
  'Basketball':     ['Legs', 'Cardio', 'Arms'],
  'Football':       ['Legs', 'Cardio', 'Core'],
  'Walking':        ['Legs', 'Cardio'],
  'Other':          ['Full Body'],
};

const MUSCLE_META = {
  'Chest':     { emoji: '💪', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Back':      { emoji: '🏋️', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'Arms':      { emoji: '🦾', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  'Legs':      { emoji: '🦵', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  'Core':      { emoji: '🎯', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  'Cardio':    { emoji: '❤️', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  'Full Body': { emoji: '⚡', color: '#C8FF00', bg: 'rgba(200,255,0,0.12)' },
};

const ALL_MUSCLE_GROUPS = ['Legs', 'Core', 'Cardio', 'Back', 'Arms', 'Chest', 'Full Body'];

export default function BodyAnalysis({ workouts }) {
  const muscleScores = useMemo(() => {
    const counts = {};
    ALL_MUSCLE_GROUPS.forEach(m => { counts[m] = 0; });

    workouts.forEach(w => {
      const muscles = EXERCISE_MUSCLE_MAP[w.exercise_type] || ['Full Body'];
      muscles.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });

    const max = Math.max(...Object.values(counts), 1);
    return ALL_MUSCLE_GROUPS
      .map(m => ({ name: m, count: counts[m] || 0, pct: Math.round(((counts[m] || 0) / max) * 100) }))
      .sort((a, b) => b.count - a.count)
      .filter(m => m.count > 0);
  }, [workouts]);

  const totalSessions = workouts.length;
  const topMuscle = muscleScores[0];
  const leastTrained = ALL_MUSCLE_GROUPS
    .filter(m => m !== 'Full Body')
    .map(m => ({ name: m, count: muscleScores.find(s => s.name === m)?.count || 0 }))
    .sort((a, b) => a.count - b.count)[0];

  if (totalSessions === 0) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
        <div className="text-4xl mb-2">🫀</div>
        <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Log workouts to see your body analysis</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      {/* Header insight */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ backgroundColor: topMuscle ? MUSCLE_META[topMuscle.name]?.bg : 'transparent', borderBottom: '1px solid var(--gf-border)' }}>
        <span className="text-3xl">{topMuscle ? MUSCLE_META[topMuscle.name]?.emoji : '📊'}</span>
        <div>
          <p className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>
            You train {topMuscle?.name} the most
          </p>
          <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
            Based on {totalSessions} workout{totalSessions > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Muscle bars */}
      <div className="px-4 py-4 space-y-3">
        {muscleScores.map((m, i) => {
          const meta = MUSCLE_META[m.name] || MUSCLE_META['Full Body'];
          return (
            <div key={m.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="font-body text-sm font-medium" style={{ color: 'var(--gf-text-primary)' }}>{m.name}</span>
                </div>
                <span className="font-body text-xs font-semibold" style={{ color: meta.color }}>
                  {m.count} session{m.count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: meta.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion */}
      {leastTrained && leastTrained.count === 0 && (
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
          style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <span className="text-lg">{MUSCLE_META[leastTrained.name]?.emoji}</span>
          <p className="font-body text-xs" style={{ color: '#A78BFA' }}>
            You haven't trained <strong>{leastTrained.name}</strong> yet — try mixing it in!
          </p>
        </div>
      )}
    </div>
  );
}
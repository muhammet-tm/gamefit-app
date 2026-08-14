import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

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

// Body regions are identified by colour plus the text label rendered beside
// them, not by an icon. Anatomical pictograms at this size were not legible,
// and front-vs-back is not expressible on a 24px silhouette.
//
// The palette is a single ramp through the brand hues rather than the six
// unrelated colours this used to carry (blue, orange, green, pink), which
// were decoration — nothing distinguished the categories they marked.
const MUSCLE_META = {
  'Chest':     { color: '#F4B044', bg: 'rgba(244,176,68,0.14)' },
  'Back':      { color: '#E8A63F', bg: 'rgba(232,166,63,0.14)' },
  'Arms':      { color: '#E0680E', bg: 'rgba(224,104,14,0.14)' },
  'Legs':      { color: '#7FBBD4', bg: 'rgba(127,187,212,0.14)' },
  'Core':      { color: '#B9C4CC', bg: 'rgba(185,196,204,0.14)' },
  'Cardio':    { color: '#E5614A', bg: 'rgba(229,97,74,0.14)' },
  'Full Body': { color: '#5FBF7C', bg: 'rgba(95,191,124,0.14)' },
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
        <Activity size={34} strokeWidth={1.6} aria-hidden="true" className="mx-auto mb-2" style={{ color: 'var(--gf-text-secondary)' }} />
        <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Log workouts to see your body analysis</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      {/* Header insight */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ backgroundColor: topMuscle ? MUSCLE_META[topMuscle.name]?.bg : 'transparent', borderBottom: '1px solid var(--gf-border)' }}>
        <span className="h-9 w-1.5 shrink-0 rounded-full" aria-hidden="true"
          style={{ backgroundColor: topMuscle ? MUSCLE_META[topMuscle.name]?.color : 'var(--gf-text-secondary)' }} />
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
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" aria-hidden="true"
                    style={{ backgroundColor: meta.color }} />
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
          style={{ backgroundColor: 'rgba(127, 187, 212,0.1)', border: '1px solid rgba(127, 187, 212,0.3)' }}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" aria-hidden="true"
            style={{ backgroundColor: MUSCLE_META[leastTrained.name]?.color }} />
          <p className="font-body text-xs" style={{ color: '#7FBBD4' }}>
            You haven't trained <strong>{leastTrained.name}</strong> yet — try mixing it in!
          </p>
        </div>
      )}
    </div>
  );
}
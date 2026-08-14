/**
 * The exercise disciplines, in one place.
 *
 * This map previously existed as four separate copies — two in Train.jsx and
 * one each in Dashboard.jsx and QuickStartTemplates.jsx — which meant adding a
 * discipline required four edits and any one of them could drift.
 *
 * `id` is the value stored in the database (workouts.exercise_type) and must
 * not change without a migration. `icon` names a glyph in components/ui/Icon.
 */

export const DISCIPLINES = [
  { id: 'Running',         label: 'Run',    icon: 'run' },
  { id: 'Cycling',         label: 'Cycle',  icon: 'bike' },
  { id: 'Weight Training', label: 'Lift',   icon: 'lift' },
  { id: 'Swimming',        label: 'Swim',   icon: 'swim' },
  { id: 'Yoga',            label: 'Yoga',   icon: 'yoga' },
  { id: 'HIIT',            label: 'HIIT',   icon: 'hiit' },
  { id: 'Boxing',          label: 'Box',    icon: 'box' },
  { id: 'Basketball',      label: 'Ball',   icon: 'basketball' },
  { id: 'Football',        label: 'Football', icon: 'football' },
  { id: 'Walking',         label: 'Walk',   icon: 'walk' },
  { id: 'Other',           label: 'Other',  icon: 'activity' },
];

export const DISCIPLINE_IDS = DISCIPLINES.map(d => d.id);

const BY_ID = Object.fromEntries(DISCIPLINES.map(d => [d.id, d]));

/** Icon name for a stored exercise_type. Falls back to the generic pulse. */
export function disciplineIcon(id) {
  return BY_ID[id]?.icon ?? 'activity';
}

/** Full record for a stored exercise_type, or the Other record. */
export function discipline(id) {
  return BY_ID[id] ?? BY_ID.Other;
}

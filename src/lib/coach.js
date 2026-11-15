// The AI coach's identity, in one place. The coach is the pup: the same name
// is used in the chat, onboarding, notifications, legal pages and the
// server prompt (supabase/functions/coach-g/index.ts keeps its own copy,
// because Edge Functions cannot import from src/).
export const COACH_NAME = 'Coach G';

/**
 * What the coach says on Home, from the player's state. Pure, so it can be
 * tested. Order matters: rest beats everything, then today's workout, then a
 * streak about to break.
 *
 * @returns {{ pose: string, line: string, action: 'train' | 'coach' | null }}
 */
export function coachMoment(user, now = new Date()) {
  const goal = Number(user?.weekly_goal) || 3;
  const week = Number(user?.weekly_workout_count) || 0;
  const streak = Number(user?.current_streak) || 0;
  const last = user?.last_workout_date ? new Date(user.last_workout_date) : null;
  const today = last
    && last.getFullYear() === now.getFullYear()
    && last.getMonth() === now.getMonth()
    && last.getDate() === now.getDate();

  if (!last) {
    return { pose: 'wave', line: 'Log your first workout and your streak starts today.', action: 'train' };
  }
  if (today && week >= goal) {
    return { pose: 'cheer', line: `Weekly target hit: ${week} of ${goal}. Enjoy the rest days.`, action: null };
  }
  if (today) {
    return { pose: 'thumbsUp', line: 'Workout logged. Recovery starts now, so drink some water.', action: null };
  }
  if (week >= goal) {
    return { pose: 'sleep', line: 'Rest day. You already hit this week’s target.', action: null };
  }
  if (streak > 0 && now.getHours() >= 18) {
    return { pose: 'worried', line: `Your ${streak}-day streak ends at midnight. Ten minutes keeps it alive.`, action: 'train' };
  }
  const left = goal - week;
  return {
    pose: 'point',
    line: left === 1 ? 'One more workout hits this week’s target.' : `${left} workouts to this week’s target. Ready when you are.`,
    action: 'train',
  };
}

/**
 * What the coach says on the workout-complete screen. Pure, like coachMoment.
 * A badge outranks a near rank-up, which outranks the streak, because the
 * rarer event is the one worth naming.
 *
 * @param {{ saveError?: string, streak?: number, badge?: string,
 *           nextRank?: string, toGo?: number, near?: boolean }} s
 * @returns {{ pose: string, line: string }}
 */
export function completionLine({ saveError, streak = 0, badge, nextRank, toGo = 0, near = false } = {}) {
  if (saveError) {
    return { pose: 'sad', line: 'That one did not save. Try again in a moment.' };
  }
  if (badge) {
    return { pose: 'cheer', line: `New badge: ${badge}. That one took real work.` };
  }
  if (near && nextRank && toGo > 0) {
    return { pose: 'point', line: `${toGo.toLocaleString()} XP to ${nextRank}. You are close.` };
  }
  if (streak >= 2) {
    return { pose: 'fistPump', line: `${streak} days in a row. Same time tomorrow?` };
  }
  return { pose: 'thumbsUp', line: 'Day one of your streak. Come back tomorrow to make it two.' };
}

// The Dubai calendar, as every usage bucket counts it.
//
// Streaks, the premium daily limits, logged_date and the retention active
// days all cut at Dubai midnight, so the free monthly allowance does too.
// Asia/Dubai is UTC+4 all year with no daylight saving, so a fixed offset is
// exact. Never use the local-time getters (getMonth, getFullYear) here: on
// the server they read the runtime's own time zone, which is a setting, not
// a decision.
//
// The browser computes the same keys in src/lib/activityDay.js;
// tests/unit/calendar.test.ts checks the two agree at every month boundary.
// Free of imports so that test can load it in plain Node.

const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' in Asia/Dubai for the given instant. */
export function dubaiDate(now: Date): string {
  return new Date(now.getTime() + DUBAI_OFFSET_MS).toISOString().slice(0, 10);
}

/** 'YYYY-MM' in Asia/Dubai: the free tier's month_key in ai_request_logs. */
export function dubaiMonth(now: Date): string {
  return dubaiDate(now).slice(0, 7);
}

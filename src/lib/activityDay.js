// The Dubai calendar day, as the server counts it, and the rule for when the
// browser reports an app open.
//
// Kept free of imports so the unit tests can load it in plain Node
// (tests/unit/activity-day.test.mjs). The wiring to Supabase, localStorage and
// the page lives in appOpen.js.

const DUBAI_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Dubai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * 'YYYY-MM-DD' in Asia/Dubai for the given instant.
 *
 * Built from formatToParts rather than a locale's date string, because the
 * order and separators of a formatted date are the locale's to change. The
 * result depends only on the instant, never on the device's own time zone.
 */
export function dubaiDay(date = new Date()) {
  const parts = Object.fromEntries(
    DUBAI_PARTS.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Whether an app open still needs reporting.
 *
 * `lastRecordedDay` is the Dubai day the server confirmed last time (or
 * null). This is only an optimisation that saves a network call: the server
 * ignores a repeat for the same day, so a wrong answer here costs one request
 * and can never create a second row.
 */
export function shouldRecordOpen(lastRecordedDay, now = new Date()) {
  return lastRecordedDay !== dubaiDay(now);
}

/**
 * Build the function that reports an app open.
 *
 * Everything it touches is passed in, so the rule can be tested without a
 * browser or a network:
 *
 *   getUserId()        the signed-in user's id, or null
 *   recordOnServer()   calls record_app_open(); resolves { day, missing }
 *                      where `day` is the server's Dubai date on success and
 *                      `missing` is true when the function does not exist yet
 *   readLastDay(id)    the day last confirmed for that user, or null
 *   writeLastDay(id, day)
 *   isVisible()        whether the app is in the foreground
 *   now()              the current instant
 *
 * The returned function never throws and never rejects: measurement must not
 * be able to break the app or show the user an error.
 */
export function createAppOpenRecorder({
  getUserId,
  recordOnServer,
  readLastDay,
  writeLastDay,
  isVisible,
  now = () => new Date(),
}) {
  let inFlight = false;
  // Set when the database has no record_app_open yet (frontend deployed before
  // the migration). Stops this page from asking again and again.
  let unavailable = false;

  return async function recordAppOpen() {
    if (inFlight || unavailable) return 'skipped';
    inFlight = true;
    try {
      // A tab left in the background, or restored by the browser but never
      // looked at, is not an open.
      if (!isVisible()) return 'hidden';

      const userId = await getUserId();
      if (!userId) return 'signed-out';
      if (!shouldRecordOpen(readLastDay(userId), now())) return 'already-recorded';

      const { day, missing } = await recordOnServer();
      if (missing) {
        unavailable = true;
        return 'unavailable';
      }
      if (typeof day !== 'string') return 'failed';

      writeLastDay(userId, day);
      return 'recorded';
    } catch {
      return 'failed';
    } finally {
      inFlight = false;
    }
  };
}

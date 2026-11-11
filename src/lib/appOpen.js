// Tells the server "this signed-in user opened the app today", at most once
// per Dubai day. This is the only thing retention measurement asks of the
// browser; see supabase/migrations/20261111130001_retention_measurement.sql
// and docs/RETENTION_MEASUREMENT.md.
//
// What is sent: nothing. record_app_open() takes no arguments. The server
// reads the user from the session and the date from its own clock, so the
// browser cannot report an open for someone else or for another day.
//
// What counts as an open: the app is visible AND a user is signed in, checked
// when the session is first available and whenever the tab or the installed
// app returns to the foreground. The rule itself is in activityDay.js, where
// it is unit-tested; this file only connects it to the real browser.
import { supabase } from '@/api/supabase';
import { createAppOpenRecorder } from './activityDay';

const storageKey = (userId) => `gf.app-open.${userId}`;

const recordAppOpen = createAppOpenRecorder({
  async getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  },

  async recordOnServer() {
    const { data, error } = await supabase.rpc('record_app_open');
    // PGRST202: PostgREST could not find the function.
    if (error) return { day: null, missing: error.code === 'PGRST202' };
    return { day: data, missing: false };
  },

  readLastDay(userId) {
    try {
      return window.localStorage.getItem(storageKey(userId));
    } catch {
      return null; // private mode or blocked storage: just ask the server
    }
  },

  writeLastDay(userId, day) {
    try {
      window.localStorage.setItem(storageKey(userId), day);
    } catch { /* the next open asks the server again; nothing is lost */ }
  },

  isVisible: () => document.visibilityState === 'visible',
});

let started = false;

/** Call once at startup. Safe to call when nobody is signed in. */
export function initAppOpenTracking() {
  if (started || typeof document === 'undefined') return;
  started = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) return;
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      // Deferred on purpose: Supabase holds a lock while it runs auth
      // callbacks, and calling back into the client from inside one can
      // deadlock.
      setTimeout(recordAppOpen, 0);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recordAppOpen();
  });
}

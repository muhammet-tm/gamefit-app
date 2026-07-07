// GameFit's single gateway to the backend (Supabase).
// Everything the app knows about the server goes through this file.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(url, anonKey);

/**
 * Current user's auth record merged with their profile row, or null when
 * logged out. Shape stays close to the old `base44.auth.me()` so existing
 * screens keep working: { id, email, full_name, ...profile fields }.
 */
export async function getMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    ...(profile ?? {}),
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      '',
  };
}

/** Update the caller's own profile row (only user-editable columns succeed). */
export async function updateProfile(fields) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);
  if (error) throw new Error(error.message);
}

/**
 * Call an Edge Function and normalize errors: failed responses throw an Error
 * carrying the server's JSON body (message, premium_required, ...) so screens
 * can show friendly messages.
 */
export async function invokeFunction(name, body = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let details = {};
    try {
      if (error.context && typeof error.context.json === 'function') {
        details = await error.context.json();
      }
    } catch { /* body not JSON */ }
    const err = new Error(details.message || details.error || error.message || 'Request failed');
    Object.assign(err, details);
    throw err;
  }
  return data;
}

/** Call a database function (RPC); throws on error. */
export async function callRpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    // Postgres exception messages read fine for users ("not enough coins");
    // strip the noisy prefix if present.
    throw new Error(error.message?.replace(/^.*?: /, '') || 'Request failed');
  }
  return data;
}

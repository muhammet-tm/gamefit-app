// Prompt sanitisation, kept in its own file with no Deno or network imports.
//
// helpers.ts pulls in `npm:@supabase/supabase-js`, which only resolves inside
// the Deno runtime. Anything that must also run under Node (the pure
// adaptation module and its unit test) imports the sanitizer from here.
// helpers.ts re-exports it, so Edge Functions keep importing it from there.

/** Strip a user-supplied string down to prompt-safe characters. */
export function sanitizeForPrompt(value: unknown, maxLen = 200): string {
  return String(value ?? '')
    .replace(/[^\w\s,.'()/-]/g, '')
    .slice(0, maxLen)
    .trim();
}

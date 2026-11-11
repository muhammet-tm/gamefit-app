// Client-side validation with human-readable messages. The database has
// matching CHECK constraints — this layer exists so users see a friendly
// sentence instead of a rejected request.
import { z } from 'zod';

// The app's Content-Security-Policy has no 'unsafe-eval'. Zod 4 speeds up
// object schemas with `new Function` where it can, and finds out by trying; the
// browser reports that attempt as a CSP violation even though zod catches it.
// jitless skips the attempt. Results and messages are the same either way.
z.config({ jitless: true });

// Whole-number checks use Number.isInteger, not zod's .int(). Since zod 4,
// .int() also rejects integers beyond 2^53 and reports them with its own
// message, so a 20-digit age would be told it is not a whole number instead of
// reaching the range message below it.

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Please enter your first name').max(50, 'First name is too long'),
  last_name: z.string().trim().max(50, 'Last name is too long'),
  age: z.coerce.number({ error: 'Age must be a number' })
    .refine(Number.isInteger, 'Age must be a whole number')
    .min(16, 'You must be at least 16 to use GameFit')
    .max(100, 'Please enter a valid age'),
  height_cm: z.coerce.number({ error: 'Height must be a number' })
    .min(100, 'Height should be between 100 and 250 cm')
    .max(250, 'Height should be between 100 and 250 cm'),
  weight_kg: z.coerce.number({ error: 'Weight must be a number' })
    .min(30, 'Weight should be between 30 and 300 kg')
    .max(300, 'Weight should be between 30 and 300 kg'),
});

export const prSchema = z.object({
  exercise: z.string().trim()
    .min(2, 'Exercise name must be at least 2 characters')
    .max(60, 'Exercise name is too long'),
  weight_kg: z.coerce.number({ error: 'Weight must be a number' })
    .positive('Weight must be above 0')
    .max(600, 'Weight is capped at 600 kg'),
  reps: z.coerce.number({ error: 'Reps must be a number' })
    .refine(Number.isInteger, 'Reps must be a whole number')
    .min(1, 'At least 1 rep')
    .max(100, 'Reps are capped at 100'),
});

export const workoutDurationSchema = z.coerce
  .number({ error: 'Duration must be a number' })
  .refine(Number.isInteger, 'Duration must be whole minutes')
  .min(1, 'Workouts must be at least 1 minute')
  .max(600, 'Workouts are capped at 600 minutes (10 hours) per session');

export const CHAT_MAX_LENGTH = 500;

/** Returns { ok, data } or { ok:false, message } with the first human message. */
export function validate(schema, value) {
  const res = schema.safeParse(value);
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, message: res.error.issues[0]?.message || 'Please check your input' };
}

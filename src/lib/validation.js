// Client-side validation with human-readable messages. The database has
// matching CHECK constraints — this layer exists so users see a friendly
// sentence instead of a rejected request.
import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Please enter your first name').max(50, 'First name is too long'),
  last_name: z.string().trim().max(50, 'Last name is too long'),
  age: z.coerce.number({ invalid_type_error: 'Age must be a number' })
    .int('Age must be a whole number')
    .min(16, 'You must be at least 16 to use GameFit')
    .max(100, 'Please enter a valid age'),
  height_cm: z.coerce.number({ invalid_type_error: 'Height must be a number' })
    .min(100, 'Height should be between 100 and 250 cm')
    .max(250, 'Height should be between 100 and 250 cm'),
  weight_kg: z.coerce.number({ invalid_type_error: 'Weight must be a number' })
    .min(30, 'Weight should be between 30 and 300 kg')
    .max(300, 'Weight should be between 30 and 300 kg'),
});

export const workoutDurationSchema = z.coerce
  .number({ invalid_type_error: 'Duration must be a number' })
  .int('Duration must be whole minutes')
  .min(1, 'Workouts must be at least 1 minute')
  .max(600, 'Workouts are capped at 600 minutes (10 hours) per session');

export const CHAT_MAX_LENGTH = 500;

/** Returns { ok, data } or { ok:false, message } with the first human message. */
export function validate(schema, value) {
  const res = schema.safeParse(value);
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, message: res.error.issues[0]?.message || 'Please check your input' };
}

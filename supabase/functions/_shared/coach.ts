// The AI coach's name on the server. Edge Functions cannot import from src/,
// so this mirrors COACH_NAME in src/lib/coach.js, and tests/unit/coach.test.ts
// fails if the two ever differ. Renaming the coach is these two lines plus a
// deploy of coach-g and stripe-webhook.
export const COACH_NAME = 'Coach G';

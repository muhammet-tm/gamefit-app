// Fails if src/lib/validation.js starts accepting, rejecting, coercing or
// wording anything differently.
//
// Usage: node scripts/check-validation.mjs [--list]
//
// validation.js is the layer that turns a bad form value into a sentence a
// person can act on. Three screens depend on it (Profile, Train, Personal
// Records) and all three read only what validate() returns: { ok, data } or
// { ok, message }. Nothing else in the app tests that contract, and it rests
// on a library whose defaults can move underneath it:
//
//   1. The messages are the product. "Age must be a number" is written here;
//      "Invalid input: expected string, received null" is whatever the library
//      says when no message was written. A library upgrade can change the
//      second kind without a single line of this repo changing.
//   2. Coercion is quiet. An empty input is '' and Number('') is 0, so an
//      empty age is reported as too young, not as missing. That is today's
//      behaviour and the table pins it, so a change is a decision and not an
//      accident.
//   3. The parsed value is what gets saved. Unknown keys must keep being
//      stripped, or a crafted object could carry extra fields into
//      updateUser().
//
// Every row is input -> the exact result of validate(). The expected values
// were captured from the running code, not written from the docs. To add a
// case, add the row, run with --list, and read what comes back before
// accepting it.
//
// The table was first captured on zod 3.25.76, then the app moved to zod 4.
// A fourth column, where a row has one, is the message zod 3 gave for it. Those
// 18 rows are still rejected, for the same input; only the sentence moved, and
// in both kinds it was never a sentence written in validation.js:
//
//   - A text field given something that is not text, or a schema given
//     something that is not an object, gets the library's own wording.
//     "Required" became "Invalid input: expected string, received undefined".
//   - Infinity stopped being a number to zod 4, so it now gets the "must be a
//     number" message instead of failing a later whole-number or range check.
//
// No screen can send either today. Names are strings by the time they reach
// validate(), and every numeric field is an <input type="number">, which
// hands back '' for anything that is not a finite number. Everything else,
// including the 20-digit numbers a person can type, is unchanged.
//
// Plain node is enough: validation.js imports nothing but zod, so no alias
// resolution or JSX transform is involved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inspect } from 'node:util';
import {
  profileSchema, prSchema, workoutDurationSchema, CHAT_MAX_LENGTH, validate,
} from '../src/lib/validation.js';

const LIST = process.argv.includes('--list');

const pass = (data) => ({ ok: true, data });
const fail = (message) => ({ ok: false, message });
const without = (obj, key) => {
  const copy = { ...obj };
  delete copy[key];
  return copy;
};

// ── Profile ────────────────────────────────────────────────────────────────
const PROFILE = { first_name: 'Aisha', last_name: 'Khan', age: 21, height_cm: 180, weight_kg: 75 };
const profile = (over = {}) => ({ ...PROFILE, ...over });
const NAME_50 = 'a'.repeat(50);
const NAME_51 = 'a'.repeat(51);

const FIRST_NAME_EMPTY = 'Please enter your first name';
const FIRST_NAME_LONG = 'First name is too long';
const LAST_NAME_LONG = 'Last name is too long';
const AGE_NAN = 'Age must be a number';
const AGE_INT = 'Age must be a whole number';
const AGE_MIN = 'You must be at least 16 to use GameFit';
const AGE_MAX = 'Please enter a valid age';
const HEIGHT_NAN = 'Height must be a number';
const HEIGHT_RANGE = 'Height should be between 100 and 250 cm';
const WEIGHT_NAN = 'Weight must be a number';
const WEIGHT_RANGE = 'Weight should be between 30 and 300 kg';

const profileCases = [
  // Valid
  ['numbers, as stored on the profile', profile(), pass(PROFILE)],
  ['strings, as typed into the form', profile({ age: '21', height_cm: '180.5', weight_kg: '75.25' }),
    pass(profile({ height_cm: 180.5, weight_kg: 75.25 }))],
  ['unknown keys are stripped', profile({ role: 'admin', coins: 999999, id: 'someone-else' }), pass(PROFILE)],

  // first_name
  ['first_name is trimmed', profile({ first_name: '  Aisha  ' }), pass(PROFILE)],
  ['first_name empty', profile({ first_name: '' }), fail(FIRST_NAME_EMPTY)],
  ['first_name only spaces', profile({ first_name: '   ' }), fail(FIRST_NAME_EMPTY)],
  ['first_name 50 chars', profile({ first_name: NAME_50 }), pass(profile({ first_name: NAME_50 }))],
  ['first_name 51 chars', profile({ first_name: NAME_51 }), fail(FIRST_NAME_LONG)],
  ['first_name 50 chars inside spaces', profile({ first_name: ` ${NAME_50} ` }), pass(profile({ first_name: NAME_50 }))],
  ['first_name null', profile({ first_name: null }), fail('Invalid input: expected string, received null'), 'Expected string, received null'],
  ['first_name undefined', profile({ first_name: undefined }), fail('Invalid input: expected string, received undefined'), 'Required'],
  ['first_name key missing', without(PROFILE, 'first_name'), fail('Invalid input: expected string, received undefined'), 'Required'],
  ['first_name a number', profile({ first_name: 42 }), fail('Invalid input: expected string, received number'), 'Expected string, received number'],

  // last_name
  ['last_name empty is allowed', profile({ last_name: '' }), pass(profile({ last_name: '' }))],
  ['last_name is trimmed', profile({ last_name: '  Khan ' }), pass(PROFILE)],
  ['last_name 50 chars', profile({ last_name: NAME_50 }), pass(profile({ last_name: NAME_50 }))],
  ['last_name 51 chars', profile({ last_name: NAME_51 }), fail(LAST_NAME_LONG)],
  ['last_name null', profile({ last_name: null }), fail('Invalid input: expected string, received null'), 'Expected string, received null'],
  ['last_name undefined', profile({ last_name: undefined }), fail('Invalid input: expected string, received undefined'), 'Required'],

  // age
  ['age 16 (minimum)', profile({ age: 16 }), pass(profile({ age: 16 }))],
  ['age 15', profile({ age: 15 }), fail(AGE_MIN)],
  ['age 100 (maximum)', profile({ age: 100 }), pass(profile({ age: 100 }))],
  ['age 101', profile({ age: 101 }), fail(AGE_MAX)],
  ['age "16"', profile({ age: '16' }), pass(profile({ age: 16 }))],
  ['age "100"', profile({ age: '100' }), pass(profile({ age: 100 }))],
  ['age " 21 " with spaces', profile({ age: ' 21 ' }), pass(PROFILE)],
  ['age "1e2" (exponent form)', profile({ age: '1e2' }), pass(profile({ age: 100 }))],
  ['age "0x15" (hex form)', profile({ age: '0x15' }), pass(PROFILE)],
  ['age 21.5', profile({ age: 21.5 }), fail(AGE_INT)],
  ['age "21.5"', profile({ age: '21.5' }), fail(AGE_INT)],
  ['age 15.5 (fraction and too low)', profile({ age: 15.5 }), fail(AGE_INT)],
  ['age 150.5 (fraction and too high)', profile({ age: 150.5 }), fail(AGE_INT)],
  ['age empty string', profile({ age: '' }), fail(AGE_MIN)],
  ['age only spaces', profile({ age: '   ' }), fail(AGE_MIN)],
  ['age null', profile({ age: null }), fail(AGE_MIN)],
  ['age 0', profile({ age: 0 }), fail(AGE_MIN)],
  ['age -21', profile({ age: -21 }), fail(AGE_MIN)],
  ['age "-21"', profile({ age: '-21' }), fail(AGE_MIN)],
  ['age true', profile({ age: true }), fail(AGE_MIN)],
  ['age false', profile({ age: false }), fail(AGE_MIN)],
  ['age undefined', profile({ age: undefined }), fail(AGE_NAN)],
  ['age key missing', without(PROFILE, 'age'), fail(AGE_NAN)],
  ['age "abc"', profile({ age: 'abc' }), fail(AGE_NAN)],
  ['age "21 years"', profile({ age: '21 years' }), fail(AGE_NAN)],
  ['age NaN', profile({ age: NaN }), fail(AGE_NAN)],
  ['age Infinity', profile({ age: Infinity }), fail(AGE_NAN), AGE_INT],
  ['age -Infinity', profile({ age: -Infinity }), fail(AGE_NAN), AGE_INT],
  ['age 1e20 (beyond safe integers)', profile({ age: 1e20 }), fail(AGE_MAX)],

  // height_cm
  ['height 100 (minimum)', profile({ height_cm: 100 }), pass(profile({ height_cm: 100 }))],
  ['height 99.9', profile({ height_cm: 99.9 }), fail(HEIGHT_RANGE)],
  ['height 250 (maximum)', profile({ height_cm: 250 }), pass(profile({ height_cm: 250 }))],
  ['height 250.1', profile({ height_cm: 250.1 }), fail(HEIGHT_RANGE)],
  ['height "172.5"', profile({ height_cm: '172.5' }), pass(profile({ height_cm: 172.5 }))],
  ['height empty string', profile({ height_cm: '' }), fail(HEIGHT_RANGE)],
  ['height null', profile({ height_cm: null }), fail(HEIGHT_RANGE)],
  ['height -180', profile({ height_cm: -180 }), fail(HEIGHT_RANGE)],
  ['height undefined', profile({ height_cm: undefined }), fail(HEIGHT_NAN)],
  ['height "tall"', profile({ height_cm: 'tall' }), fail(HEIGHT_NAN)],
  ['height Infinity', profile({ height_cm: Infinity }), fail(HEIGHT_NAN), HEIGHT_RANGE],

  // weight_kg
  ['weight 30 (minimum)', profile({ weight_kg: 30 }), pass(profile({ weight_kg: 30 }))],
  ['weight 29.9', profile({ weight_kg: 29.9 }), fail(WEIGHT_RANGE)],
  ['weight 300 (maximum)', profile({ weight_kg: 300 }), pass(profile({ weight_kg: 300 }))],
  ['weight 300.1', profile({ weight_kg: 300.1 }), fail(WEIGHT_RANGE)],
  ['weight empty string', profile({ weight_kg: '' }), fail(WEIGHT_RANGE)],
  ['weight null', profile({ weight_kg: null }), fail(WEIGHT_RANGE)],
  ['weight -75', profile({ weight_kg: -75 }), fail(WEIGHT_RANGE)],
  ['weight undefined', profile({ weight_kg: undefined }), fail(WEIGHT_NAN)],
  ['weight "heavy"', profile({ weight_kg: 'heavy' }), fail(WEIGHT_NAN)],

  // Which message wins when several fields are wrong: schema order, not the
  // order the keys arrive in.
  ['every field wrong', profile({ first_name: '', age: 10, height_cm: 50, weight_kg: 10 }), fail(FIRST_NAME_EMPTY)],
  ['age, height and weight wrong', profile({ age: 10, height_cm: 50, weight_kg: 10 }), fail(AGE_MIN)],
  ['height and weight wrong, keys reversed',
    { weight_kg: 10, height_cm: 50, age: 21, last_name: 'Khan', first_name: 'Aisha' }, fail(HEIGHT_RANGE)],

  // Not an object at all
  ['value null', null, fail('Invalid input: expected object, received null'), 'Expected object, received null'],
  ['value undefined', undefined, fail('Invalid input: expected object, received undefined'), 'Required'],
  ['value a string', 'Aisha', fail('Invalid input: expected object, received string'), 'Expected object, received string'],
  ['value an array', [], fail('Invalid input: expected object, received array'), 'Expected object, received array'],
  ['value an empty object', {}, fail('Invalid input: expected string, received undefined'), 'Required'],
];

// ── Personal records ───────────────────────────────────────────────────────
const PR = { exercise: 'Bench Press', weight_kg: 100, reps: 5 };
const pr = (over = {}) => ({ ...PR, ...over });
const EXERCISE_60 = 'b'.repeat(60);
const EXERCISE_61 = 'b'.repeat(61);

const EXERCISE_SHORT = 'Exercise name must be at least 2 characters';
const EXERCISE_LONG = 'Exercise name is too long';
const PR_WEIGHT_NAN = 'Weight must be a number';
const PR_WEIGHT_POSITIVE = 'Weight must be above 0';
const PR_WEIGHT_MAX = 'Weight is capped at 600 kg';
const REPS_NAN = 'Reps must be a number';
const REPS_INT = 'Reps must be a whole number';
const REPS_MIN = 'At least 1 rep';
const REPS_MAX = 'Reps are capped at 100';

const prCases = [
  // Valid
  ['numbers', pr(), pass(PR)],
  ['strings, as typed into the form', pr({ weight_kg: '82.5', reps: '8' }), pass(pr({ weight_kg: 82.5, reps: 8 }))],
  ['unknown keys are stripped', pr({ user_id: 'someone-else', xp: 5000 }), pass(PR)],
  ['the untouched form', { exercise: '', weight_kg: '', reps: '' }, fail(EXERCISE_SHORT)],

  // exercise
  ['exercise is trimmed', pr({ exercise: '  Bench Press  ' }), pass(PR)],
  ['exercise empty', pr({ exercise: '' }), fail(EXERCISE_SHORT)],
  ['exercise 1 char', pr({ exercise: 'A' }), fail(EXERCISE_SHORT)],
  ['exercise 1 char inside spaces', pr({ exercise: ' A ' }), fail(EXERCISE_SHORT)],
  ['exercise 2 chars (minimum)', pr({ exercise: 'Ab' }), pass(pr({ exercise: 'Ab' }))],
  ['exercise 60 chars (maximum)', pr({ exercise: EXERCISE_60 }), pass(pr({ exercise: EXERCISE_60 }))],
  ['exercise 61 chars', pr({ exercise: EXERCISE_61 }), fail(EXERCISE_LONG)],
  ['exercise null', pr({ exercise: null }), fail('Invalid input: expected string, received null'), 'Expected string, received null'],
  ['exercise undefined', pr({ exercise: undefined }), fail('Invalid input: expected string, received undefined'), 'Required'],

  // weight_kg
  ['weight 0.5', pr({ weight_kg: 0.5 }), pass(pr({ weight_kg: 0.5 }))],
  ['weight 600 (maximum)', pr({ weight_kg: 600 }), pass(pr({ weight_kg: 600 }))],
  ['weight 600.5', pr({ weight_kg: 600.5 }), fail(PR_WEIGHT_MAX)],
  ['weight 0', pr({ weight_kg: 0 }), fail(PR_WEIGHT_POSITIVE)],
  ['weight empty string', pr({ weight_kg: '' }), fail(PR_WEIGHT_POSITIVE)],
  ['weight null', pr({ weight_kg: null }), fail(PR_WEIGHT_POSITIVE)],
  ['weight -10', pr({ weight_kg: -10 }), fail(PR_WEIGHT_POSITIVE)],
  ['weight undefined', pr({ weight_kg: undefined }), fail(PR_WEIGHT_NAN)],
  ['weight "abc"', pr({ weight_kg: 'abc' }), fail(PR_WEIGHT_NAN)],
  ['weight Infinity', pr({ weight_kg: Infinity }), fail(PR_WEIGHT_NAN), PR_WEIGHT_MAX],

  // reps
  ['reps 1 (minimum)', pr({ reps: 1 }), pass(pr({ reps: 1 }))],
  ['reps 100 (maximum)', pr({ reps: 100 }), pass(pr({ reps: 100 }))],
  ['reps "12"', pr({ reps: '12' }), pass(pr({ reps: 12 }))],
  ['reps 0', pr({ reps: 0 }), fail(REPS_MIN)],
  ['reps empty string', pr({ reps: '' }), fail(REPS_MIN)],
  ['reps null', pr({ reps: null }), fail(REPS_MIN)],
  ['reps -3', pr({ reps: -3 }), fail(REPS_MIN)],
  ['reps 101', pr({ reps: 101 }), fail(REPS_MAX)],
  ['reps 2.5', pr({ reps: 2.5 }), fail(REPS_INT)],
  ['reps undefined', pr({ reps: undefined }), fail(REPS_NAN)],
  ['reps "ten"', pr({ reps: 'ten' }), fail(REPS_NAN)],
  ['reps 1e20 (beyond safe integers)', pr({ reps: 1e20 }), fail(REPS_MAX)],

  // First message wins, in schema order
  ['every field wrong', { exercise: 'A', weight_kg: 0, reps: 0 }, fail(EXERCISE_SHORT)],
  ['weight and reps wrong', pr({ weight_kg: 0, reps: 0 }), fail(PR_WEIGHT_POSITIVE)],
];

// ── Workout duration ───────────────────────────────────────────────────────
const DURATION_NAN = 'Duration must be a number';
const DURATION_INT = 'Duration must be whole minutes';
const DURATION_MIN = 'Workouts must be at least 1 minute';
const DURATION_MAX = 'Workouts are capped at 600 minutes (10 hours) per session';

const durationCases = [
  ['30', 30, pass(30)],
  ['"45"', '45', pass(45)],
  ['" 20 " with spaces', ' 20 ', pass(20)],
  ['1 (minimum)', 1, pass(1)],
  ['600 (maximum)', 600, pass(600)],
  ['true', true, pass(1)],
  // Train.jsx sends `activeDuration || 0`, so an empty custom field arrives as 0.
  ['0', 0, fail(DURATION_MIN)],
  ['empty string', '', fail(DURATION_MIN)],
  ['only spaces', '  ', fail(DURATION_MIN)],
  ['null', null, fail(DURATION_MIN)],
  ['false', false, fail(DURATION_MIN)],
  ['an empty array', [], fail(DURATION_MIN)],
  ['-15', -15, fail(DURATION_MIN)],
  ['"-15"', '-15', fail(DURATION_MIN)],
  ['601', 601, fail(DURATION_MAX)],
  ['30.5', 30.5, fail(DURATION_INT)],
  ['"30.5"', '30.5', fail(DURATION_INT)],
  ['undefined', undefined, fail(DURATION_NAN)],
  ['"abc"', 'abc', fail(DURATION_NAN)],
  ['NaN', NaN, fail(DURATION_NAN)],
  ['an object', {}, fail(DURATION_NAN)],
  ['Infinity', Infinity, fail(DURATION_NAN), DURATION_INT],
  ['1e20 (beyond safe integers)', 1e20, fail(DURATION_MAX)],
];

// ── Run ────────────────────────────────────────────────────────────────────
const groups = [
  ['profileSchema', profileSchema, profileCases],
  ['prSchema', prSchema, prCases],
  ['workoutDurationSchema', workoutDurationSchema, durationCases],
];

// Long enough to print every message in full; only the padded 50 and 60
// character names get cut.
const show = (value) => inspect(value, { breakLength: Infinity, maxStringLength: 72, depth: 3 });

let total = 0;
const mismatches = [];

for (const [name, schema, cases] of groups) {
  if (LIST) console.log(`\n${name}`);
  for (const [label, input, expected, zod3Message] of cases) {
    total += 1;
    let actual;
    try {
      actual = validate(schema, input);
    } catch (err) {
      actual = { threw: String(err?.message ?? err) };
    }
    let ok = true;
    try {
      assert.deepStrictEqual(actual, expected);
    } catch {
      ok = false;
      mismatches.push({ name, label, input, expected, actual });
    }
    if (LIST) {
      const was = zod3Message === undefined ? '' : `   (zod 3: ${show(zod3Message)})`;
      console.log(`  ${ok ? 'ok  ' : 'DIFF'} ${label}  ->  ${show(actual)}${was}`);
    }
  }
}

total += 1;
if (CHAT_MAX_LENGTH !== 500) {
  mismatches.push({ name: 'CHAT_MAX_LENGTH', label: 'value', input: undefined, expected: 500, actual: CHAT_MAX_LENGTH });
}

const zodVersion = JSON.parse(
  fs.readFileSync(new URL('../node_modules/zod/package.json', import.meta.url), 'utf-8'),
).version;

if (!mismatches.length) {
  console.log(`Validation OK: ${total} cases return the expected result and message (zod ${zodVersion}).`);
  process.exit(0);
}

console.error(`${mismatches.length} of ${total} validation cases changed (zod ${zodVersion}):`);
for (const m of mismatches) {
  console.error(`\n  ${m.name}: ${m.label}`);
  console.error(`      input     ${show(m.input)}`);
  console.error(`      expected  ${show(m.expected)}`);
  console.error(`      actual    ${show(m.actual)}`);
}
console.error('\nIf the change is intended, update the row in scripts/check-validation.mjs and say why in');
console.error('the commit. A changed message or parsed value reaches Profile, Train and Personal Records.');
process.exit(1);

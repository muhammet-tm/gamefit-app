// The athlete cast: ten preset people who replace the drawn SVG rig as the
// player's avatar. Each person has four illustrated images (relaxed, celebrating,
// elite kit, rest day) generated from one approved concept image, so the cast
// shares a single look.
//
// This file is the only definition of the cast. The app reads it, and so does
// scripts/build-athlete-assets.mjs, which turns the full-size source PNGs into
// the web images under public/athletes/. Keep it free of Vite aliases and JSX
// so Node can import it.
//
// Stored data does not change shape. A profile keeps its avatar_config v3
// fields (class, body, skin_tone, hair) and gains one optional key, `athlete`.
// `class` is kept in step with the athlete's discipline, so anything that
// still reads the class (the SVG rig, older clients) stays consistent.

export const ATHLETE_POSES = ['idle', 'celebrate', 'elite', 'rest'];

// Discipline labels for the five stored class keys. The keys stay as they are
// in the database; only the words people see changed.
export const DISCIPLINE_BY_CLASS = {
  warrior: 'Lifter',
  archer: 'Runner',
  ninja: 'Fighter',
  knight: 'Gymnast',
  mage: 'Yogi',
};

// faceY: the vertical centre, in source pixels (1664x2496), of the square
// face crop used for small round avatars. Every head sits on the image's
// centre line, so only the height varies.
export const ATHLETES = [
  { id: 'omar',   name: 'Omar',   classKey: 'warrior', body: 'male',   age: 34, skin: 'bronze',    hair: 'fade_black',     faceY: 420, line: 'Calm and patient. Trains at six, before work.' },
  { id: 'aisha',  name: 'Aisha',  classKey: 'warrior', body: 'female', age: 27, skin: 'olive',     hair: 'long_black',     faceY: 390, line: 'Competitive. Counts every kilo and writes it down.' },
  { id: 'nadia',  name: 'Nadia',  classKey: 'archer',  body: 'female', age: 29, skin: 'ebony',     hair: 'braid_black',    faceY: 390, line: 'Upbeat. Runs before sunrise to beat the heat.' },
  { id: 'daniel', name: 'Daniel', classKey: 'archer',  body: 'male',   age: 52, skin: 'porcelain', hair: 'short_silver',   faceY: 346, line: 'Fifty-two and training for his first half marathon.' },
  { id: 'kofi',   name: 'Kofi',   classKey: 'ninja',   body: 'male',   age: 24, skin: 'umber',     hair: 'curly_black',    faceY: 334, line: 'Quick and playful. Talks to the heavy bag.' },
  { id: 'yara',   name: 'Yara',   classKey: 'ninja',   body: 'female', age: 31, skin: 'tan',       hair: 'bun_brown',      faceY: 358, line: 'Quiet, focused, and very hard to hit.' },
  { id: 'mei',    name: 'Mei',    classKey: 'knight',  body: 'female', age: 22, skin: 'porcelain', hair: 'bob_black',      faceY: 346, line: 'Precise. Repeats a landing until it is silent.' },
  { id: 'rami',   name: 'Rami',   classKey: 'knight',  body: 'male',   age: 26, skin: 'olive',     hair: 'short_brown',    faceY: 390, line: 'Strong and compact. Happiest on the rings.' },
  { id: 'sara',   name: 'Sara',   classKey: 'mage',    body: 'female', age: 38, skin: 'bronze',    hair: 'wavy_brown',     faceY: 314, line: 'Warm and unhurried. Teaches a class on Fridays.' },
  { id: 'arjun',  name: 'Arjun',  classKey: 'mage',    body: 'male',   age: 41, skin: 'tan',       hair: 'ponytail_black', faceY: 416, line: 'Thoughtful. Uses yoga to recover from his runs.' },
];

export const ATHLETE_IDS = ATHLETES.map(a => a.id);

const BY_ID = Object.fromEntries(ATHLETES.map(a => [a.id, a]));

export function getAthlete(id) {
  return BY_ID[id] || null;
}

export function disciplineOf(athlete) {
  return DISCIPLINE_BY_CLASS[athlete?.classKey] || 'Athlete';
}

/**
 * The athlete a profile shows. A saved choice wins; a profile from before the
 * cast existed gets the person who matches its class and body, so nobody's
 * avatar changes discipline when this ships.
 */
export function athleteForConfig(cfg) {
  if (cfg && BY_ID[cfg.athlete]) return BY_ID[cfg.athlete];
  const body = cfg?.body === 'female' ? 'female' : 'male';
  const cls = DISCIPLINE_BY_CLASS[cfg?.class] ? cfg.class : 'warrior';
  return ATHLETES.find(a => a.classKey === cls && a.body === body) || ATHLETES[0];
}

/**
 * The avatar_config to save when someone picks an athlete. The rig fields are
 * filled from the athlete so the stored config stays valid for every reader.
 */
export function configForAthlete(id) {
  const a = BY_ID[id] || ATHLETES[0];
  return { version: 3, class: a.classKey, body: a.body, skin_tone: a.skin, hair: a.hair, athlete: a.id };
}

/**
 * Which picture to show. A moment (a finished workout, a level-up) wins;
 * otherwise the top rank wears the elite kit and a rest day shows rest clothes.
 */
export function athletePose({ tier = 1, moment = null, resting = false } = {}) {
  if (moment === 'celebrate') return 'celebrate';
  if (tier >= 5) return 'elite';
  if (resting) return 'rest';
  return 'idle';
}

/**
 * A rest day, for the picture only: the week's target is already met and
 * nothing has been logged today. Before the target is met, the athlete stays
 * in training kit, because the picture should invite the next session.
 */
export function isRestDay(user, now = new Date()) {
  if (!user) return false;
  const target = Number(user.weekly_goal) || 3;
  if ((Number(user.weekly_workout_count) || 0) < target) return false;
  if (!user.last_workout_date) return true;
  const last = new Date(user.last_workout_date);
  return !(last.getFullYear() === now.getFullYear()
    && last.getMonth() === now.getMonth()
    && last.getDate() === now.getDate());
}

// Published image paths. The builder writes exactly these names.
export const ATHLETE_IMAGE_WIDTHS = [240, 480, 720];
// Source image size, which the round "bust" view crops against.
export const ATHLETE_SOURCE = { width: 1664, height: 2496 };
export const ATHLETE_FACE_SIZE = 192;

export function athleteImage(id, pose, width = 480) {
  return `/athletes/${id}-${pose}-${width}.webp`;
}

export function athleteFace(id) {
  return `/athletes/${id}-face.webp`;
}

// The coach pup: a Siberian husky in a training tee, drawn on a 200x240 grid
// and animated in parts. This file holds only data (colours and poses) so the
// app, the brand-asset script and the tests can all read it.
//
// The pup is the coach's face everywhere it appears: splash, sign-in,
// onboarding, the coach chat, the dashboard tip, and workout complete.

// Real husky colouring (slate and white fur, ice-blue eyes) with the Ignition
// orange moved onto the tee, so the brand colour stays while the character
// stops reading as a fox.
export const PUP = {
  fur: '#5E6672',
  furDark: '#434A55',
  face: '#F4F4F2',
  eye: '#7FC8F0',
  ear: '#E9B8B0',
  top: '#FF6B00',
  stripe: '#F4B044',
  shorts: '#28282C',
  shoe: '#F4F4F2',
  line: '#18181B',
  blush: '#F28C8C',
  tongue: '#F07C86',
  sweat: '#8FD0F2',
};

// Arm angles: 0 hangs straight down from the shoulder; positive swings the
// left paw outward, negative the right. Shoulders sit at (70,132) and
// (130,132); an arm is 40 units to the paw centre.
//   eyes:  open | up | right | down | closed | happy | worried
//   mouth: smile | grin | talk | o | flat | wobble | frown
//   emote: sparkle | question | sweat | zzz | heart | bulb | null
// Flags add motion on top: waveArm, talkArms, clap, pump, run, stretch,
// slump, thumb, shrug. armLen stretches both arms (cartoon reach).
export const POSES = {
  idle:     { armL: 16, armR: -16, head: 0, eyes: 'open', mouth: 'smile', ears: 0, tail: 1, emote: null },
  wave:     { armL: 14, armR: -158, head: -4, eyes: 'open', mouth: 'grin', ears: -4, tail: 1.6, emote: null, lean: -2, waveArm: true },
  cheer:    { armL: 152, armR: -152, head: 0, eyes: 'happy', mouth: 'grin', ears: -8, tail: 2.2, emote: 'sparkle', hop: 1 },
  clap:     { armL: -36, armR: 36, head: 0, eyes: 'happy', mouth: 'grin', ears: -6, tail: 2, emote: null, clap: true },
  thumbsUp: { armL: 14, armR: -125, head: -5, eyes: 'open', mouth: 'grin', ears: -4, tail: 1.6, emote: null, lean: -2, thumb: true },
  fistPump: { armL: 20, armR: -172, head: -3, eyes: 'happy', mouth: 'grin', ears: -6, tail: 2, emote: 'sparkle', pump: true },
  present:  { armL: 58, armR: -58, head: 4, eyes: 'open', mouth: 'grin', ears: -4, tail: 1.3, emote: null },
  point:    { armL: 14, armR: -98, head: -6, eyes: 'right', mouth: 'smile', ears: -2, tail: 1.2, emote: null, lean: -3 },
  listen:   { armL: -34, armR: 34, head: 8, eyes: 'open', mouth: 'smile', ears: -7, tail: 0.9, emote: null },
  think:    { armL: 12, armR: -146, head: 9, eyes: 'up', mouth: 'flat', ears: 4, tail: 0.5, emote: 'question', lean: 3 },
  idea:     { armL: 14, armR: -172, head: -4, eyes: 'up', mouth: 'grin', ears: -8, tail: 1.8, emote: 'bulb' },
  talk:     { armL: 24, armR: -40, head: 0, eyes: 'open', mouth: 'talk', ears: 0, tail: 1.2, emote: null, talkArms: true },
  worried:  { armL: 4, armR: -4, head: -6, eyes: 'worried', mouth: 'wobble', ears: 24, tail: 0.25, emote: 'sweat' },
  sad:      { armL: 2, armR: -2, head: 10, eyes: 'down', mouth: 'frown', ears: 30, tail: 0.1, emote: null, slump: true },
  sleep:    { armL: 6, armR: -6, head: 12, eyes: 'closed', mouth: 'o', ears: 14, tail: 0.15, emote: 'zzz', lean: 2, slump: true },
  stretch:  { armL: 96, armR: -96, head: 0, eyes: 'closed', mouth: 'grin', ears: -6, tail: 0.6, emote: null, stretch: true },
  reach:    { armL: 145, armR: -145, head: -2, eyes: 'up', mouth: 'grin', ears: -10, tail: 1.4, emote: null, stretch: true, armLen: 1.75 },
  run:      { armL: 50, armR: -60, head: -3, eyes: 'right', mouth: 'grin', ears: 10, tail: 1.8, emote: null, lean: -6, run: true },
  shrug:    { armL: 74, armR: -74, head: 8, eyes: 'up', mouth: 'flat', ears: 6, tail: 0.6, emote: null, shrug: true },
  love:     { armL: -36, armR: 36, head: 6, eyes: 'happy', mouth: 'smile', ears: -6, tail: 2, emote: 'heart' },
};

export const POSE_NAMES = Object.keys(POSES);

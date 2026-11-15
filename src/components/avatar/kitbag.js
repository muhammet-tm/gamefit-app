// The Kit Bag: real sports gear in three slots, one item equipped per slot.
//   floor   a prop standing beside the athlete
//   wear    an item fitted on the athlete (head, eyes, or chest)
//   finish  an effect that plays when a workout ends (drawn in code)
//
// This file only describes and places items. Prices here are for display;
// the server charges from public.accessories (migration
// 20261115120001_kit_bag.sql), and a unit test fails if the two disagree.
// Ownership and the equipped kit live in profiles and change only through
// the kit_bag() RPC. No Vite aliases or JSX, so Node can import it.
import ANCHORS from './anchors.json';

// Every cast picture shares this frame, so items are placed in source
// pixels and drawn as percentages of the frame.
export const FRAME = { w: 1664, h: 2496 };

export const KIT_SLOTS = ['floor', 'wear', 'finish'];

export const SLOT_LABELS = { floor: 'Floor', wear: 'Wear', finish: 'Finish' };

// aspect: the item image's height / width (from the cut-outs).
// Floor items: `w` is the width as a share of the frame, `side` which side of
// the feet it stands on. Wear items: `part` is where it is fitted.
export const KIT_ITEMS = [
  { id: 'kettlebell',     slot: 'floor',  label: 'Kettlebell',     cost: 150, aspect: 1.206, side: 'left',  w: 0.21 },
  { id: 'boxing_gloves',  slot: 'floor',  label: 'Boxing gloves',  cost: 130, aspect: 0.569, side: 'left',  w: 0.27 },
  { id: 'water_bottle',   slot: 'floor',  label: 'Water bottle',   cost: 60,  aspect: 3.051, side: 'right', w: 0.075 },
  { id: 'gym_bag',        slot: 'floor',  label: 'Gym bag',        cost: 120, aspect: 0.706, side: 'right', w: 0.30 },
  { id: 'yoga_block',     slot: 'floor',  label: 'Yoga block',     cost: 60,  aspect: 0.759, side: 'right', w: 0.17 },
  { id: 'sweatband',      slot: 'wear',   label: 'Sweatband',      cost: 80,  aspect: 0.290, part: 'head' },
  { id: 'training_cap',   slot: 'wear',   label: 'Training cap',   cost: 100, aspect: 0.708, part: 'head' },
  { id: 'sport_glasses',  slot: 'wear',   label: 'Sport glasses',  cost: 120, aspect: 0.331, part: 'eyes' },
  { id: 'finisher_medal', slot: 'wear',   label: 'Finisher medal', cost: 250, aspect: 1.871, part: 'chest' },
  { id: 'chalk_cloud',    slot: 'finish', label: 'Chalk cloud',    cost: 80 },
  { id: 'finish_tape',    slot: 'finish', label: 'Finish tape',    cost: 120 },
  { id: 'rank_confetti',  slot: 'finish', label: 'Rank confetti',  cost: 150 },
];

const BY_ID = Object.fromEntries(KIT_ITEMS.map(i => [i.id, i]));

export function kitItem(id) {
  return BY_ID[id] || null;
}

export function itemsForSlot(slot) {
  return KIT_ITEMS.filter(i => i.slot === slot);
}

export function kitImage(id) {
  return `/kitbag/${id}.webp`;
}

/**
 * The equipped kit as the app may trust it: known items in their own slot
 * that the player owns. Anything else is dropped, so a stale or tampered
 * value can never draw an item.
 */
export function normalizeKit(kit, owned) {
  const out = {};
  if (!kit || typeof kit !== 'object') return out;
  const have = Array.isArray(owned) ? new Set(owned) : null;
  for (const slot of KIT_SLOTS) {
    const item = BY_ID[kit[slot]];
    if (item && item.slot === slot && (!have || have.has(item.id))) out[slot] = item.id;
  }
  return out;
}

export function anchorsFor(athleteId, pose) {
  return ANCHORS[athleteId]?.[pose] || null;
}

/**
 * Whether a wear item can be drawn on this picture. Head items never sit on
 * existing headwear (hijab, visor, cap, beanie, headphones) or where hands
 * cover the head; the medal skips pictures that already have one or where
 * hands meet at the chest. Measured per picture in anchors.json.
 */
export function wearShows(athleteId, pose, itemId) {
  const item = BY_ID[itemId];
  const a = anchorsFor(athleteId, pose);
  if (!item || item.slot !== 'wear' || !a) return false;
  // `hide` lists body areas ('head', 'chest') and single item ids.
  const hide = a.hide || [];
  return !hide.includes(item.part) && !hide.includes(item.id);
}

/** Whether a head item is hidden in the athlete's everyday (relaxed) picture. */
export function headBusy(athleteId) {
  return (anchorsFor(athleteId, 'idle')?.hide || []).includes('head');
}

/**
 * Where an item sits, as a box in source pixels: { x, y, w, h }.
 * Returns null when the item is not drawn on this picture.
 */
export function placeItem(itemId, athleteId, pose) {
  const item = BY_ID[itemId];
  if (!item) return null;
  if (item.slot === 'floor') {
    const w = item.w * FRAME.w;
    const h = w * item.aspect;
    const base = 0.955 * FRAME.h; // the front edge of the floor ring
    const x = item.side === 'left' ? 0.04 * FRAME.w : 0.96 * FRAME.w - w;
    return { x, y: base - h, w, h };
  }
  if (item.slot !== 'wear' || !wearShows(athleteId, pose, itemId)) return null;
  const a = anchorsFor(athleteId, pose);
  const d = a.chin - a.eyes;
  let w;
  let y;
  if (item.id === 'sweatband') {
    w = a.faceW * 1.3;
    y = a.top + 0.5 * (a.eyes - a.top) - (w * item.aspect) / 2;
  } else if (item.id === 'training_cap') {
    // the brim's lower edge sits just above the eyes
    const bottom = a.eyes - 0.08 * d;
    const top = a.top - 0.06 * (a.chin - a.top);
    w = Math.max(a.faceW * 1.2, (bottom - top) / item.aspect);
    y = bottom - w * item.aspect;
  } else if (item.id === 'sport_glasses') {
    w = a.faceW * 1.12;
    y = a.eyes + 0.02 * d - (w * item.aspect) / 2;
  } else {
    // a finisher medal hangs mid-chest, ribbon running up to the collar
    w = a.faceW * 0.74;
    y = a.chin + 0.62 * d;
  }
  return { x: a.cx - w / 2, y, w, h: w * item.aspect };
}

/** A box in source pixels as CSS percentages of the frame. */
export function toPercent(box) {
  return {
    left: `${(box.x / FRAME.w) * 100}%`,
    top: `${(box.y / FRAME.h) * 100}%`,
    width: `${(box.w / FRAME.w) * 100}%`,
  };
}

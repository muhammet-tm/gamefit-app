import React, { useMemo, useState } from 'react';
import { Coins, Cloud, Flag, PartyPopper, Check } from 'lucide-react';
import AthleteAvatar from '@/components/avatar/AthleteAvatar';
import FinishEffect from '@/components/gamefit/FinishEffect';
import { ATHLETE_POSES } from '@/components/avatar/athletes';
import {
  KIT_SLOTS, SLOT_LABELS, itemsForSlot, kitItem, kitImage, wearShows,
} from '@/components/avatar/kitbag';

const FINISH_ICONS = { chalk_cloud: Cloud, finish_tape: Flag, rank_confetti: PartyPopper };

const SLOT_HINTS = {
  floor: 'Stands beside your athlete on every card.',
  wear: 'Fitted on your athlete where the picture allows it.',
  finish: 'Plays over your athlete when a workout ends.',
};

/**
 * The Kit Bag shop. Tapping an item tries it on the athlete in the preview;
 * the action button then buys, equips, or takes it off. Every change goes
 * through onAction (the kit_bag RPC), which the server validates.
 *
 * @param {object} athlete   the player's athlete (from athleteForConfig)
 * @param {number} tier      the player's tier, for the frame and elite kit
 * @param {number} coins
 * @param {string[]} owned   owned item ids
 * @param {object} equipped  { floor, wear, finish } item ids
 * @param {(action, itemId, slot) => Promise<{ok, error}>} onAction
 */
export default function KitBagShop({ athlete, tier = 1, coins = 0, owned = [], equipped = {}, onAction }) {
  const [slot, setSlot] = useState('floor');
  const [selected, setSelected] = useState(null);
  // Items being tried on, one per slot, so a whole look can be previewed.
  const [tryOn, setTryOn] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [play, setPlay] = useState(0);

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const item = selected ? kitItem(selected) : null;
  // What the preview shows: the equipped kit, with tried-on items over it.
  const preview = { ...equipped, ...tryOn };
  const finishKind = preview.finish || null;

  const select = (id) => {
    setError('');
    setSelected(id);
    const it = kitItem(id);
    if (it) setTryOn(t => ({ ...t, [it.slot]: id }));
    if (it?.slot === 'finish') setPlay(n => n + 1);
  };

  const act = async (action) => {
    if (!item || busy) return;
    setBusy(true);
    setError('');
    const res = await onAction(action, action === 'unequip' ? null : item.id, item.slot);
    setBusy(false);
    // Once bought, equipped, or taken off, the slot shows the real kit again.
    if (res?.ok) setTryOn(t => { const n = { ...t }; delete n[item.slot]; return n; });
    if (!res?.ok) setError(res?.error || 'That did not go through. Please try again.');
  };

  const shows = item?.slot === 'wear'
    ? ATHLETE_POSES.filter(p => wearShows(athlete.id, p, item.id)).length
    : null;

  let actionButton = null;
  if (item) {
    const isOwned = ownedSet.has(item.id);
    const isOn = equipped[item.slot] === item.id;
    if (!isOwned) {
      const short = item.cost - coins;
      actionButton = (
        <button type="button" onClick={() => act('purchase')} disabled={busy || short > 0}
          className="w-full rounded-xl py-3 font-heading text-sm font-bold disabled:opacity-60"
          style={{ background: short > 0 ? 'var(--gf-bg-elevated)' : 'linear-gradient(135deg, #D92B2B, #C8470E)', color: short > 0 ? 'var(--gf-text-secondary)' : '#FFFFFF' }}>
          {short > 0 ? `${short.toLocaleString()} more coins needed` : `Buy ${item.label} for ${item.cost} coins`}
        </button>
      );
    } else if (isOn) {
      actionButton = (
        <button type="button" onClick={() => act('unequip')} disabled={busy}
          className="w-full rounded-xl py-3 font-heading text-sm font-bold"
          style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }}>
          Take off {item.label}
        </button>
      );
    } else {
      actionButton = (
        <button type="button" onClick={() => act('equip')} disabled={busy}
          className="w-full rounded-xl py-3 font-heading text-sm font-bold"
          style={{ backgroundColor: 'var(--gf-gold)', color: '#141416' }}>
          Equip {item.label}
        </button>
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>Kit Bag</h3>
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-body text-sm font-semibold"
          style={{ backgroundColor: 'rgba(255, 107, 0, 0.15)', color: 'var(--gf-ember-text)', border: '1px solid rgba(255, 107, 0, 0.3)' }}>
          <Coins size={14} aria-hidden="true" /> {coins.toLocaleString()} <span className="sr-only">coins</span>
        </div>
      </div>

      {/* Preview: the athlete wearing the kit, with the selected item tried on */}
      <div className="flex items-center gap-4 rounded-3xl p-4"
        style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
        <span className="relative inline-block" data-testid="kitbag-preview">
          <AthleteAvatar athleteId={athlete.id} tier={tier} size={132} kit={preview} priority />
          {finishKind && <FinishEffect kind={finishKind} play={play} tier={tier} />}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          {KIT_SLOTS.map(s => {
            const on = kitItem(preview[s]);
            const trying = tryOn[s] && tryOn[s] !== equipped[s];
            return (
              <div key={s} className="font-body text-xs">
                <span className="uppercase tracking-widest" style={{ color: 'var(--gf-text-secondary)' }}>{SLOT_LABELS[s]}</span>
                <p className="text-sm font-semibold" style={{ color: on ? 'var(--gf-text-primary)' : 'var(--gf-text-secondary)' }}>
                  {on ? on.label : 'Empty'}{trying ? <span style={{ color: 'var(--gf-gold-text)' }}> · trying on</span> : null}
                </p>
              </div>
            );
          })}
          {finishKind && (
            <button type="button" onClick={() => setPlay(n => n + 1)}
              className="rounded-lg px-3 py-1.5 font-body text-xs font-semibold"
              style={{ backgroundColor: 'var(--gf-bg-surface)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }}>
              Play finish
            </button>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="flex rounded-xl p-1" role="tablist" aria-label="Kit Bag slots" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
        {KIT_SLOTS.map(s => (
          <button key={s} type="button" role="tab" aria-selected={slot === s} onClick={() => setSlot(s)}
            className="flex-1 rounded-lg py-2 font-body text-sm font-medium transition-all"
            style={{ backgroundColor: slot === s ? 'var(--gf-gold)' : 'transparent', color: slot === s ? '#141416' : 'var(--gf-text-secondary)' }}>
            {SLOT_LABELS[s]}
          </button>
        ))}
      </div>
      <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{SLOT_HINTS[slot]}</p>

      <div className="grid grid-cols-3 gap-2" role="tabpanel">
        {itemsForSlot(slot).map(i => {
          const isOwned = ownedSet.has(i.id);
          const isOn = equipped[i.slot] === i.id;
          const Icon = FINISH_ICONS[i.id];
          return (
            <button key={i.id} type="button" onClick={() => select(i.id)} aria-pressed={selected === i.id}
              data-kit-item-tile={i.id}
              className="flex flex-col items-center gap-1.5 rounded-2xl px-2 pb-2.5 pt-3 transition-all"
              style={{
                backgroundColor: selected === i.id ? 'rgba(244, 176, 68, 0.10)' : 'var(--gf-bg-surface)',
                border: `1.5px solid ${selected === i.id ? 'var(--gf-gold)' : 'var(--gf-border)'}`,
              }}>
              <span className="flex h-12 w-full items-center justify-center">
                {Icon
                  ? <Icon size={30} strokeWidth={1.8} aria-hidden="true" style={{ color: 'var(--gf-gold-text)' }} />
                  : <img src={kitImage(i.id)} alt="" className="max-h-12 max-w-[80%] object-contain" loading="lazy" />}
              </span>
              <span className="text-center font-body text-xs font-semibold leading-tight" style={{ color: 'var(--gf-text-primary)' }}>{i.label}</span>
              <span className="font-mono text-[11px]" style={{ color: isOn ? 'var(--gf-gold-text)' : isOwned ? 'var(--gf-text-secondary)' : 'var(--gf-ember-text)' }}>
                {isOn ? (<><Check size={11} strokeWidth={3} className="inline-block align-[-1px]" aria-hidden="true" /> On</>) : isOwned ? 'Owned' : `${i.cost} coins`}
              </span>
            </button>
          );
        })}
      </div>

      {item && (
        <div className="space-y-2">
          {shows !== null && shows < ATHLETE_POSES.length && (
            <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
              {shows === 0
                ? `${item.label} does not show on ${athlete.name}: it would sit over what ${athlete.name} already wears there.`
                : `${item.label} shows in ${shows} of ${athlete.name}'s ${ATHLETE_POSES.length} pictures. It stays off the others, where it would clash with headwear or hands.`}
            </p>
          )}
          {actionButton}
          {error && <p role="alert" className="font-body text-xs" style={{ color: '#E5614A' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

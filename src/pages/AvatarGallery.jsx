// DEV-ONLY quality-gate gallery: every class × tier, plus skin/hair/accessory
// matrices. Not routed in production builds.
import React, { useState } from 'react';
import Avatar from '@/components/avatar/Avatar';
import {
  AVATAR_CLASSES, CLASS_LABELS, SKIN_TONES, HAIR_COLORS,
  BODY_TYPES, BODY_LABELS, hairStylesFor,
} from '@/components/avatar/palettes';
import { ACCESSORY_LAYERS } from '@/components/avatar/layers/accessories';
import AthleteAvatar from '@/components/avatar/AthleteAvatar';
import { ATHLETES, ATHLETE_POSES, disciplineOf } from '@/components/avatar/athletes';
import { itemsForSlot } from '@/components/avatar/kitbag';
import FinishEffect from '@/components/gamefit/FinishEffect';
import CoachPup from '@/components/brand/CoachPup';
import { POSE_NAMES } from '@/components/brand/pupRig';
import CoachLine from '@/components/brand/CoachLine';
import { completionLine } from '@/lib/coach';

const ACCESSORY_IDS = Object.keys(ACCESSORY_LAYERS);

export default function AvatarGallery() {
  const [kitWear, setKitWear] = useState('training_cap');
  const [kitFloor, setKitFloor] = useState('kettlebell');
  const [finishKind, setFinishKind] = useState('rank_confetti');
  const [finishPlay, setFinishPlay] = useState(0);
  const [skin, setSkin] = useState('tan');
  const [body, setBody] = useState('male');
  const [hairStyle, setHairStyle] = useState('short');
  const [hairColor, setHairColor] = useState('black');
  const [accessory, setAccessory] = useState('');
  const [replay, setReplay] = useState(0);
  const [revealTier, setRevealTier] = useState(3);
  const styles = hairStylesFor(body);
  // keep the style valid when the body (and so the style list) changes
  const hair = `${styles.includes(hairStyle) ? hairStyle : styles[0]}_${hairColor}`;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#141416' }}>
      <h1 className="font-heading font-black text-2xl mb-1" style={{ color: 'var(--gf-gold-text)' }}>
        Avatar Gallery (dev)
      </h1>
      {/* Athlete bench: the cast in every framing the app uses, so the
          signed-in screens' avatars can be checked without signing in. */}
      <section className="mb-10" aria-label="Athlete bench">
        <h2 className="font-heading font-black text-lg mb-1" style={{ color: '#FFFFFF' }}>Athletes</h2>
        <p className="font-body text-sm mb-4" style={{ color: '#A1A1AA' }}>
          Portrait at Beginner, Intermediate, and Elite; rest day; bust (Home ring); faces at 44 and 36. The first portrait in each row is interactive.
        </p>
        <div className="space-y-4">
          {ATHLETES.map(a => (
            <div key={a.id} className="flex flex-wrap items-end gap-3" data-athlete={a.id}>
              <span className="w-24 font-body text-xs" style={{ color: '#A1A1AA' }}>
                {a.name}<br />{disciplineOf(a)}
              </span>
              <AthleteAvatar athleteId={a.id} tier={1} size={96} interactive />
              <AthleteAvatar athleteId={a.id} tier={3} size={96} />
              <AthleteAvatar athleteId={a.id} tier={5} size={96} />
              <AthleteAvatar athleteId={a.id} tier={2} size={96} resting />
              <AthleteAvatar athleteId={a.id} tier={2} size={120} variant="bust" />
              <AthleteAvatar athleteId={a.id} tier={2} size={44} />
              <AthleteAvatar athleteId={a.id} tier={4} size={36} />
            </div>
          ))}
        </div>
      </section>

      {/* Coach pup bench: every pose, plus the face variant used in chat. */}
      <section className="mb-10" aria-label="Coach pup bench">
        <h2 className="font-heading font-black text-lg mb-1" style={{ color: '#FFFFFF' }}>Coach pup</h2>
        <p className="font-body text-sm mb-3" style={{ color: '#A1A1AA' }}>Every pose, then the face at 40, 32 and 24 px.</p>
        <div className="flex flex-wrap gap-3">
          {POSE_NAMES.map(p => (
            <div key={p} data-pup-pose={p} className="flex flex-col items-center gap-1 rounded-xl p-2" style={{ backgroundColor: '#1E1E21' }}>
              <CoachPup pose={p} size={110} />
              <span className="font-body text-[11px]" style={{ color: '#A1A1AA' }}>{p}</span>
            </div>
          ))}
          <div className="flex items-end gap-2 rounded-xl p-3" style={{ backgroundColor: '#1E1E21' }} data-pup-faces>
            <CoachPup variant="face" pose="talk" size={40} talking />
            <CoachPup variant="face" pose="idle" size={32} />
            <CoachPup variant="face" pose="cheer" size={24} />
          </div>
        </div>
        {/* Workout complete is only reachable by logging a real workout, so
            its five coach lines are shown here instead. */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2" data-pup-lines>
          {[
            { saveError: 'offline' },
            { badge: 'First Sweat', streak: 1 },
            { nextRank: 'Novice II', toGo: 40, near: true, streak: 3 },
            { streak: 6 },
            { streak: 1 },
          ].map((s, i) => {
            const c = completionLine(s);
            return <CoachLine key={i} text={c.line} pose={c.pose} size={56} tone="dark" />;
          })}
        </div>
      </section>

      {/* Kit Bag bench: every picture of every athlete with the chosen floor
          and wear items, to check placement across all 40 pictures. */}
      <section className="mb-10" aria-label="Kit Bag bench">
        <h2 className="font-heading font-black text-lg mb-1" style={{ color: '#FFFFFF' }}>Kit Bag</h2>
        <p className="font-body text-sm mb-3" style={{ color: '#A1A1AA' }}>
          Relaxed, celebrating, elite, rest. Wear items skip pictures where they would clash (existing headwear, hands at the chest).
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {itemsForSlot('wear').map(i => (
            <button key={i.id} type="button" data-kit-wear={i.id} onClick={() => setKitWear(i.id)}
              className="px-2 py-1 rounded text-xs font-body"
              style={{ backgroundColor: kitWear === i.id ? '#F4B044' : '#28282C', color: kitWear === i.id ? '#141416' : '#A1A1AA' }}>
              {i.label}
            </button>
          ))}
          <span className="w-3" />
          {itemsForSlot('floor').map(i => (
            <button key={i.id} type="button" data-kit-floor={i.id} onClick={() => setKitFloor(i.id)}
              className="px-2 py-1 rounded text-xs font-body"
              style={{ backgroundColor: kitFloor === i.id ? '#F4B044' : '#28282C', color: kitFloor === i.id ? '#141416' : '#A1A1AA' }}>
              {i.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {itemsForSlot('finish').map(i => (
            <button key={i.id} type="button" data-kit-finish={i.id}
              onClick={() => { setFinishKind(i.id); setFinishPlay(n => n + 1); }}
              className="px-2 py-1 rounded text-xs font-body" style={{ backgroundColor: '#28282C', color: '#A1A1AA' }}>
              Play {i.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {ATHLETES.map((a, n) => (
            <div key={a.id} className="flex flex-wrap items-end gap-3" data-kit-athlete={a.id}>
              <span className="w-16 font-body text-xs" style={{ color: '#A1A1AA' }}>{a.name}</span>
              {ATHLETE_POSES.map(p => (
                <span key={p} className="relative inline-block">
                  <AthleteAvatar athleteId={a.id} pose={p} tier={2} size={120}
                    kit={{ floor: kitFloor, wear: kitWear }} />
                  {n === 0 && p === 'celebrate' && (
                    <FinishEffect kind={finishKind} play={finishPlay} tier={2} />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <p className="font-body text-sm mb-4" style={{ color: '#A1A1AA' }}>
        5 classes × 5 tiers · {body} · skin: {skin} · hair: {hair} {accessory && `· acc: ${accessory}`}
      </p>

      {/* controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(SKIN_TONES).map(s => (
          <button key={s} onClick={() => setSkin(s)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: SKIN_TONES[s].base, borderColor: skin === s ? '#F4B044' : '#2E2E33' }}
            title={s} />
        ))}
        <span className="w-3" />
        {BODY_TYPES.map(b => (
          <button key={b} onClick={() => setBody(b)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: body === b ? '#F4B044' : '#28282C', color: body === b ? '#141416' : '#A1A1AA' }}>
            {BODY_LABELS[b]}
          </button>
        ))}
        <span className="w-3" />
        {styles.map(h => (
          <button key={h} onClick={() => setHairStyle(h)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: hairStyle === h ? '#F4B044' : '#28282C', color: hairStyle === h ? '#141416' : '#A1A1AA' }}>
            {h}
          </button>
        ))}
        {Object.keys(HAIR_COLORS).map(c => (
          <button key={c} onClick={() => setHairColor(c)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: HAIR_COLORS[c].base, borderColor: hairColor === c ? '#F4B044' : '#2E2E33' }}
            title={c} />
        ))}
        <span className="w-3" />
        <button onClick={() => setAccessory('')}
          className="px-2 py-1 rounded text-xs font-body"
          style={{ backgroundColor: accessory === '' ? '#F4B044' : '#28282C', color: accessory === '' ? '#141416' : '#A1A1AA' }}>
          none
        </button>
        {ACCESSORY_IDS.map(a => (
          <button key={a} onClick={() => setAccessory(a)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: accessory === a ? '#F4B044' : '#28282C', color: accessory === a ? '#141416' : '#A1A1AA' }}>
            {a}
          </button>
        ))}
      </div>

      {/* Interaction bench. The two behavioural states only exist behind auth
          on AvatarScreen and in the rank-up overlay, which makes them awkward
          to review; this exercises both without a login. */}
      <div className="mb-8 p-4 rounded-2xl" style={{ backgroundColor: '#28282C', border: '1px solid #2E2E33' }}>
        <h2 className="font-heading font-black text-lg mb-1" style={{ color: '#FFFFFF' }}>Interaction</h2>
        <p className="font-body text-xs mb-3" style={{ color: '#A1A1AA' }}>
          Left: tap or focus and press Enter for the reaction. Right: the
          rank-up reveal — only tier-{revealTier + 1} gear animates in. Use the
          button to replay it.
        </p>
        <div className="flex gap-6 items-end flex-wrap">
          <div className="flex flex-col items-center">
            <Avatar avatarClass="warrior" tier={3} body={body} skinTone={skin} hair={hair}
              size={130} interactive />
            <span className="font-body text-xs mt-2" style={{ color: '#A1A1AA' }}>interactive</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar key={replay} avatarClass="knight" tier={revealTier + 1} body={body}
              skinTone={skin} hair={hair} size={130} revealFromTier={revealTier} />
            <span className="font-body text-xs mt-2" style={{ color: '#A1A1AA' }}>
              tier {revealTier} → {revealTier + 1}
            </span>
          </div>
          <button onClick={() => setReplay(r => r + 1)}
            className="px-3 py-1.5 rounded text-xs font-body mb-6"
            style={{ backgroundColor: '#F4B044', color: '#141416' }}>
            replay reveal
          </button>
          <button onClick={() => setRevealTier(t => (t >= 4 ? 1 : t + 1))}
            className="px-3 py-1.5 rounded text-xs font-body mb-6"
            style={{ backgroundColor: '#28282C', color: '#A1A1AA', border: '1px solid #2E2E33' }}>
            next tier step
          </button>
        </div>
      </div>

      {/* the 5×5 grid */}
      {AVATAR_CLASSES.map(cls => (
        <div key={cls} className="mb-8">
          <h2 className="font-heading font-black text-lg mb-2" style={{ color: '#FFFFFF' }}>
            {CLASS_LABELS[cls]}
          </h2>
          <div className="flex gap-4 flex-wrap">
            {[1, 2, 3, 4, 5].map(tier => (
              <div key={tier} className="flex flex-col items-center p-3 rounded-2xl"
                style={{ backgroundColor: '#1E1E21', border: '1px solid #2E2E33' }}>
                <Avatar
                  avatarClass={cls}
                  tier={tier}
                  body={body}
                  skinTone={skin}
                  hair={hair}
                  accessories={accessory ? [accessory] : []}
                  size={130}
                  animate={false}
                />
                <span className="font-body text-xs mt-2" style={{ color: '#A1A1AA' }}>Tier {tier}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

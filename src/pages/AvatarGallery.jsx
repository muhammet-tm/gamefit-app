// DEV-ONLY quality-gate gallery: every class × tier, plus skin/hair/accessory
// matrices. Not routed in production builds.
import React, { useState } from 'react';
import Avatar from '@/components/avatar/Avatar';
import {
  AVATAR_CLASSES, CLASS_LABELS, SKIN_TONES, HAIR_COLORS,
  BODY_TYPES, BODY_LABELS, hairStylesFor,
} from '@/components/avatar/palettes';
import { ACCESSORY_LAYERS } from '@/components/avatar/layers/accessories';

const ACCESSORY_IDS = Object.keys(ACCESSORY_LAYERS);

export default function AvatarGallery() {
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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0B1A24' }}>
      <h1 className="font-heading font-black text-2xl mb-1" style={{ color: 'var(--gf-gold-text)' }}>
        Avatar Gallery (dev)
      </h1>
      <p className="font-body text-sm mb-4" style={{ color: '#88A5B7' }}>
        5 classes × 5 tiers · {body} · skin: {skin} · hair: {hair} {accessory && `· acc: ${accessory}`}
      </p>

      {/* controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(SKIN_TONES).map(s => (
          <button key={s} onClick={() => setSkin(s)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: SKIN_TONES[s].base, borderColor: skin === s ? '#F4B044' : '#24455A' }}
            title={s} />
        ))}
        <span className="w-3" />
        {BODY_TYPES.map(b => (
          <button key={b} onClick={() => setBody(b)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: body === b ? '#F4B044' : '#1A3242', color: body === b ? '#0B1A24' : '#88A5B7' }}>
            {BODY_LABELS[b]}
          </button>
        ))}
        <span className="w-3" />
        {styles.map(h => (
          <button key={h} onClick={() => setHairStyle(h)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: hairStyle === h ? '#F4B044' : '#1A3242', color: hairStyle === h ? '#0B1A24' : '#88A5B7' }}>
            {h}
          </button>
        ))}
        {Object.keys(HAIR_COLORS).map(c => (
          <button key={c} onClick={() => setHairColor(c)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: HAIR_COLORS[c].base, borderColor: hairColor === c ? '#F4B044' : '#24455A' }}
            title={c} />
        ))}
        <span className="w-3" />
        <button onClick={() => setAccessory('')}
          className="px-2 py-1 rounded text-xs font-body"
          style={{ backgroundColor: accessory === '' ? '#F4B044' : '#1A3242', color: accessory === '' ? '#0B1A24' : '#88A5B7' }}>
          none
        </button>
        {ACCESSORY_IDS.map(a => (
          <button key={a} onClick={() => setAccessory(a)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: accessory === a ? '#F4B044' : '#1A3242', color: accessory === a ? '#0B1A24' : '#88A5B7' }}>
            {a}
          </button>
        ))}
      </div>

      {/* Interaction bench. The two behavioural states only exist behind auth
          on AvatarScreen and in the rank-up overlay, which makes them awkward
          to review; this exercises both without a login. */}
      <div className="mb-8 p-4 rounded-2xl" style={{ backgroundColor: '#1A3242', border: '1px solid #24455A' }}>
        <h2 className="font-heading font-black text-lg mb-1" style={{ color: '#FFFFFF' }}>Interaction</h2>
        <p className="font-body text-xs mb-3" style={{ color: '#88A5B7' }}>
          Left: tap or focus and press Enter for the reaction. Right: the
          rank-up reveal — only tier-{revealTier + 1} gear animates in. Use the
          button to replay it.
        </p>
        <div className="flex gap-6 items-end flex-wrap">
          <div className="flex flex-col items-center">
            <Avatar avatarClass="warrior" tier={3} body={body} skinTone={skin} hair={hair}
              size={130} interactive />
            <span className="font-body text-xs mt-2" style={{ color: '#88A5B7' }}>interactive</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar key={replay} avatarClass="knight" tier={revealTier + 1} body={body}
              skinTone={skin} hair={hair} size={130} revealFromTier={revealTier} />
            <span className="font-body text-xs mt-2" style={{ color: '#88A5B7' }}>
              tier {revealTier} → {revealTier + 1}
            </span>
          </div>
          <button onClick={() => setReplay(r => r + 1)}
            className="px-3 py-1.5 rounded text-xs font-body mb-6"
            style={{ backgroundColor: '#F4B044', color: '#0B1A24' }}>
            replay reveal
          </button>
          <button onClick={() => setRevealTier(t => (t >= 4 ? 1 : t + 1))}
            className="px-3 py-1.5 rounded text-xs font-body mb-6"
            style={{ backgroundColor: '#1A3242', color: '#88A5B7', border: '1px solid #24455A' }}>
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
                style={{ backgroundColor: '#112532', border: '1px solid #24455A' }}>
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
                <span className="font-body text-xs mt-2" style={{ color: '#88A5B7' }}>Tier {tier}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// DEV-ONLY quality-gate gallery: every class × tier, plus skin/hair/accessory
// matrices. Not routed in production builds.
import React, { useState } from 'react';
import Avatar from '@/components/avatar/Avatar';
import {
  AVATAR_CLASSES, CLASS_LABELS, SKIN_TONES, HAIR_STYLES, HAIR_COLORS,
} from '@/components/avatar/palettes';
import { ACCESSORY_LAYERS } from '@/components/avatar/layers/accessories';

const ACCESSORY_IDS = Object.keys(ACCESSORY_LAYERS);

export default function AvatarGallery() {
  const [skin, setSkin] = useState('tan');
  const [hairStyle, setHairStyle] = useState('short');
  const [hairColor, setHairColor] = useState('black');
  const [accessory, setAccessory] = useState('');
  const hair = `${hairStyle}_${hairColor}`;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0D0F14' }}>
      <h1 className="font-heading font-black text-2xl mb-1" style={{ color: '#C8FF00' }}>
        Avatar Gallery (dev)
      </h1>
      <p className="font-body text-sm mb-4" style={{ color: '#8A8F9E' }}>
        5 classes × 5 tiers · skin: {skin} · hair: {hair} {accessory && `· acc: ${accessory}`}
      </p>

      {/* controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(SKIN_TONES).map(s => (
          <button key={s} onClick={() => setSkin(s)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: SKIN_TONES[s].base, borderColor: skin === s ? '#C8FF00' : '#2A2F3A' }}
            title={s} />
        ))}
        <span className="w-3" />
        {HAIR_STYLES.map(h => (
          <button key={h} onClick={() => setHairStyle(h)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: hairStyle === h ? '#C8FF00' : '#1E2330', color: hairStyle === h ? '#0D0F14' : '#8A8F9E' }}>
            {h}
          </button>
        ))}
        {Object.keys(HAIR_COLORS).map(c => (
          <button key={c} onClick={() => setHairColor(c)}
            className="w-8 h-8 rounded-full border-2"
            style={{ backgroundColor: HAIR_COLORS[c].base, borderColor: hairColor === c ? '#C8FF00' : '#2A2F3A' }}
            title={c} />
        ))}
        <span className="w-3" />
        <button onClick={() => setAccessory('')}
          className="px-2 py-1 rounded text-xs font-body"
          style={{ backgroundColor: accessory === '' ? '#C8FF00' : '#1E2330', color: accessory === '' ? '#0D0F14' : '#8A8F9E' }}>
          none
        </button>
        {ACCESSORY_IDS.map(a => (
          <button key={a} onClick={() => setAccessory(a)}
            className="px-2 py-1 rounded text-xs font-body"
            style={{ backgroundColor: accessory === a ? '#C8FF00' : '#1E2330', color: accessory === a ? '#0D0F14' : '#8A8F9E' }}>
            {a}
          </button>
        ))}
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
                style={{ backgroundColor: '#161A22', border: '1px solid #2A2F3A' }}>
                <Avatar
                  avatarClass={cls}
                  tier={tier}
                  skinTone={skin}
                  hair={hair}
                  accessories={accessory ? [accessory] : []}
                  size={130}
                  animate={false}
                />
                <span className="font-body text-xs mt-2" style={{ color: '#8A8F9E' }}>Tier {tier}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

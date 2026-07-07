import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Check, Lock } from 'lucide-react';

export const ACCESSORIES = [
  { id: 'halo',       label: 'Golden Halo',     emoji: '😇', cost: 80,  effect: 'Crown of champions', category: 'head' },
  { id: 'crown',      label: 'War Crown',        emoji: '👑', cost: 150, effect: 'For true legends',   category: 'head' },
  { id: 'flames',     label: 'Fire Aura',        emoji: '🔥', cost: 120, effect: 'Burning intensity',  category: 'aura' },
  { id: 'lightning',  label: 'Thunder Aura',     emoji: '⚡', cost: 200, effect: 'Storm power',        category: 'aura' },
  { id: 'shield_glow',label: 'Glowing Shield',   emoji: '🛡️', cost: 100, effect: 'Radiant defense',   category: 'gear' },
  { id: 'sword_glow', label: 'Neon Blade',        emoji: '⚔️', cost: 130, effect: 'Cuts through limits', category: 'gear' },
  { id: 'wings',      label: 'Angel Wings',      emoji: '🪽', cost: 300, effect: 'Ascended form',      category: 'back' },
  { id: 'cape',       label: 'Hero Cape',        emoji: '🦸', cost: 180, effect: 'Legendary swagger',  category: 'back' },
  { id: 'star_badge', label: 'Star Badge',       emoji: '⭐', cost: 60,  effect: 'Proven champion',   category: 'badge' },
  { id: 'diamond',    label: 'Diamond Badge',    emoji: '💎', cost: 250, effect: 'Elite status',       category: 'badge' },
];

const CATEGORY_LABELS = { head: '🪖 Head', aura: '✨ Aura', gear: '⚔️ Gear', back: '🪽 Back', badge: '🏅 Badge' };

export default function AccessoryShop({ coins, ownedAccessories = [], equippedAccessory, onBuy, onEquip }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [confirmItem, setConfirmItem] = useState(null);
  const [buyFeedback, setBuyFeedback] = useState(null);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];
  const filtered = activeCategory === 'all' ? ACCESSORIES : ACCESSORIES.filter(a => a.category === activeCategory);

  const handleBuy = (item) => {
    if (coins < item.cost) return;
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    if (!confirmItem) return;
    onBuy(confirmItem);
    setBuyFeedback(confirmItem.id);
    setConfirmItem(null);
    setTimeout(() => setBuyFeedback(null), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>Accessory Shop</h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-sm font-semibold"
          style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: 'var(--gf-amber)', border: '1px solid rgba(255,184,0,0.3)' }}>
          <Coins size={14} /> {coins.toLocaleString()}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-3">
        {categories.map(cat => (
          <button key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-all"
            style={{
              backgroundColor: activeCategory === cat ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
              color: activeCategory === cat ? '#0D0F14' : 'var(--gf-text-secondary)',
            }}>
            {cat === 'all' ? '🎒 All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(item => {
          const owned = ownedAccessories.includes(item.id);
          const equipped = equippedAccessory === item.id;
          const canAfford = coins >= item.cost;

          return (
            <motion.div key={item.id}
              className="rounded-2xl p-3 flex flex-col gap-2 relative"
              style={{
                backgroundColor: equipped ? 'rgba(200,255,0,0.08)' : 'var(--gf-bg-surface)',
                border: `1.5px solid ${equipped ? 'var(--gf-green)' : owned ? 'rgba(200,255,0,0.25)' : 'var(--gf-border)'}`,
              }}
              whileTap={{ scale: 0.97 }}>

              {equipped && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--gf-green)' }}>
                  <Check size={11} color="#0D0F14" strokeWidth={3} />
                </span>
              )}

              <div className="text-3xl text-center py-1">{item.emoji}</div>
              <div>
                <p className="font-body font-semibold text-sm leading-tight" style={{ color: 'var(--gf-text-primary)' }}>{item.label}</p>
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--gf-text-secondary)' }}>{item.effect}</p>
              </div>

              {owned ? (
                <button
                  onClick={() => onEquip(equipped ? null : item.id)}
                  className="w-full py-2 rounded-xl font-body text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: equipped ? 'rgba(200,255,0,0.15)' : 'var(--gf-bg-elevated)',
                    color: equipped ? 'var(--gf-green)' : 'var(--gf-text-secondary)',
                    border: `1px solid ${equipped ? 'var(--gf-green)' : 'var(--gf-border)'}`,
                  }}>
                  {equipped ? '✓ Equipped' : 'Equip'}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className="w-full py-2 rounded-xl font-body text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  style={{
                    backgroundColor: canAfford ? 'rgba(255,184,0,0.15)' : 'var(--gf-bg-elevated)',
                    color: canAfford ? 'var(--gf-amber)' : 'var(--gf-text-secondary)',
                    border: `1px solid ${canAfford ? 'rgba(255,184,0,0.4)' : 'var(--gf-border)'}`,
                    opacity: canAfford ? 1 : 0.5,
                  }}>
                  {canAfford ? <><Coins size={11} /> {item.cost}</> : <><Lock size={11} /> {item.cost}</>}
                </button>
              )}

              {buyFeedback === item.id && (
                <motion.div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(200,255,0,0.15)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="text-2xl">🎉</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmItem(null)}>
            <motion.div className="w-full max-w-sm rounded-3xl p-6"
              style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{confirmItem.emoji}</div>
                <h3 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>{confirmItem.label}</h3>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--gf-text-secondary)' }}>{confirmItem.effect}</p>
              </div>
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl mb-4"
                style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
                <Coins size={16} style={{ color: 'var(--gf-amber)' }} />
                <span className="font-heading font-black text-xl" style={{ color: 'var(--gf-amber)' }}>{confirmItem.cost} coins</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmItem(null)}
                  className="flex-1 py-3 rounded-xl font-body font-medium text-sm"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={confirmBuy}
                  className="flex-1 py-3 rounded-xl font-heading font-black text-base"
                  style={{ backgroundColor: 'var(--gf-amber)', color: '#0D0F14' }}>
                  Buy Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
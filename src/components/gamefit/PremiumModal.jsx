import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Check, X as XIcon } from 'lucide-react';

const FEATURES = [
  { label: 'Workout logging & XP', free: true, premium: true },
  { label: 'Global leaderboard', free: true, premium: true },
  { label: 'AI coaching requests', free: '10/month', premium: 'Unlimited' },
  { label: 'Advanced workout plans', free: false, premium: true },
  { label: 'Nutrition AI guidance', free: false, premium: true },
  { label: 'Full avatar customization', free: false, premium: true },
  { label: 'Premium marketplace rewards', free: false, premium: true },
];

export default function PremiumModal({ onClose }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('annual');

  // The upsell sheet only sells — real payment happens on /premium via
  // Stripe Checkout (the old version faked an upgrade client-side).
  const handleUpgrade = () => {
    onClose?.();
    navigate('/premium');
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="w-full rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--gf-bg-surface)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h2 className="font-heading font-black text-2xl" style={{ color: 'var(--gf-text-primary)' }}>
            Unlock Your Full Potential ⚡
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            <X size={18} color="var(--gf-text-secondary)" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Billing toggle */}
          <div className="flex rounded-xl p-1 mb-5" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            {['monthly', 'annual'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className="flex-1 py-2.5 rounded-lg font-body font-medium text-sm transition-all relative"
                style={{ backgroundColor: billing === b ? 'var(--gf-purple)' : 'transparent', color: billing === b ? '#FFFFFF' : 'var(--gf-text-secondary)' }}>
                {b === 'annual' ? 'Annual' : 'Monthly'}
                {b === 'annual' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: '#C8FF00', color: '#0D0F14' }}>-40%</span>
                )}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="text-center mb-5 py-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <p className="font-heading font-black text-4xl" style={{ color: 'var(--gf-purple)' }}>
              {billing === 'monthly' ? 'AED 29.99' : 'AED 214.99'}
            </p>
            <p className="font-body text-sm mt-1" style={{ color: 'var(--gf-text-secondary)' }}>
              {billing === 'monthly' ? 'per month' : 'per year (AED 17.92/month)'}
            </p>
          </div>

          {/* Feature table */}
          <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid var(--gf-border)' }}>
            <div className="grid grid-cols-3 px-4 py-2" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
              <p className="font-body text-xs font-semibold" style={{ color: 'var(--gf-text-secondary)' }}>Feature</p>
              <p className="font-body text-xs font-semibold text-center" style={{ color: 'var(--gf-text-secondary)' }}>Free</p>
              <p className="font-body text-xs font-semibold text-center" style={{ color: 'var(--gf-purple)' }}>Premium</p>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} className="grid grid-cols-3 px-4 py-3 items-center"
                style={{ borderTop: '1px solid var(--gf-border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <p className="font-body text-xs" style={{ color: 'var(--gf-text-primary)' }}>{f.label}</p>
                <div className="flex justify-center">
                  {f.free === true ? <Check size={16} color="#22C55E" /> :
                   f.free === false ? <XIcon size={16} color="#EF4444" /> :
                   <span className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{f.free}</span>}
                </div>
                <div className="flex justify-center">
                  {f.premium === true ? <Check size={16} color="#7C3AED" /> :
                   <span className="font-body text-xs font-semibold" style={{ color: '#7C3AED' }}>{f.premium}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* CTA — continues to the real Stripe checkout */}
          <button onClick={handleUpgrade}
            className="w-full py-4 rounded-2xl font-heading font-black text-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: '#FFFFFF' }}>
            Start Premium ⚡
          </button>

          <button onClick={onClose} className="w-full py-3 mt-3 font-body text-sm"
            style={{ color: 'var(--gf-text-secondary)' }}>
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
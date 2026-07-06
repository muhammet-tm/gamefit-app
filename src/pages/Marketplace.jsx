import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Copy, Check } from 'lucide-react';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import { useGameFit } from '@/lib/GameFitContext';
import { MOCK_REWARDS } from '@/lib/mockData';
import BottomNav from '@/components/gamefit/BottomNav';

const CATEGORIES = ['All', 'Avatar Items', 'Discount Codes'];
const REWARD_ICONS = { AvatarItem: '🎭', DiscountCode: '🏷️' };

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'GAMEFIT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function Marketplace() {
  const { user, redeemReward } = useGameFit();
  const [filter, setFilter] = useState('All');
  const [confirmReward, setConfirmReward] = useState(null);
  const [successCode, setSuccessCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const isPremium = user.account_type === 'premium';

  const filteredRewards = MOCK_REWARDS.filter(r => {
    if (filter === 'Avatar Items') return r.reward_type === 'AvatarItem';
    if (filter === 'Discount Codes') return r.reward_type === 'DiscountCode';
    return true;
  });

  const handleRedeem = (reward) => {
    if (reward.is_premium_only && !isPremium) return;
    if (user.coins < reward.cost_coins) return;
    setConfirmReward(reward);
  };

  const confirmRedeem = () => {
    if (!confirmReward) return;
    const ok = redeemReward(confirmReward);
    if (ok) {
      const code = confirmReward.reward_type === 'DiscountCode' ? genCode() : null;
      setSuccessCode({ reward: confirmReward, code });
      setConfirmReward(null);
    }
  };

  const copyCode = async () => {
    if (successCode?.code) {
      await navigator.clipboard.writeText(successCode.code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title="🛒 Marketplace"
        subtitle="Spend your coins wisely"
        showBackButton={false}
        rightAction={<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}>
          <span className="text-base">🪙</span>
          <span className="font-heading font-black text-lg" style={{ color: '#FFB800' }}>{user.coins}</span>
        </div>}
      />
        {/* Filter tabs */}
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-3 py-1.5 rounded-xl font-body text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === c ? 'var(--gf-amber)' : 'var(--gf-bg-elevated)',
                color: filter === c ? '#0D0F14' : 'var(--gf-text-secondary)',
              }}>
              {c}
            </button>
          ))}
        </div>
      </ScreenTransition>

      <div className="px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {filteredRewards.map((reward, i) => {
            const canAfford = user.coins >= reward.cost_coins;
            const isPremiumLocked = reward.is_premium_only && !isPremium;
            const coinsNeeded = reward.cost_coins - user.coins;

            return (
              <motion.div key={reward.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}>

                {/* Image/icon area */}
                <div className="h-28 flex items-center justify-center relative"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
                  <span className="text-5xl">{REWARD_ICONS[reward.reward_type] || '🎁'}</span>
                  {isPremiumLocked && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ backgroundColor: 'rgba(124,58,237,0.9)' }}>
                      <Lock size={10} color="#FFF" />
                      <span className="text-[10px] font-bold text-white">Premium</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="font-heading font-black text-sm leading-tight" style={{ color: 'var(--gf-text-primary)' }}>{reward.reward_name}</p>
                  <p className="font-body text-xs leading-relaxed flex-1" style={{ color: 'var(--gf-text-secondary)' }}>{reward.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-sm" style={{ color: '#FFB800' }}>🪙 {reward.cost_coins}</span>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || isPremiumLocked}
                    className="w-full py-2 rounded-xl font-heading font-black text-sm transition-all active:scale-95"
                    style={{
                      backgroundColor: isPremiumLocked ? 'var(--gf-bg-elevated)' :
                        canAfford ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
                      color: isPremiumLocked ? 'var(--gf-text-secondary)' :
                        canAfford ? '#0D0F14' : 'var(--gf-text-secondary)',
                      border: `1px solid ${!canAfford && !isPremiumLocked ? 'var(--gf-border)' : 'transparent'}`,
                    }}>
                    {isPremiumLocked ? '🔒 Premium Only' :
                      canAfford ? 'Redeem' : `Need ${coinsNeeded} more 🪙`}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Confirm bottom sheet */}
      <AnimatePresence>
        {confirmReward && (
          <motion.div className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmReward(null)}>
            <motion.div className="w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}
              style={{ backgroundColor: 'var(--gf-bg-surface)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 20 }}>
              <div className="text-center mb-5">
                <span className="text-5xl">{REWARD_ICONS[confirmReward.reward_type]}</span>
                <h3 className="font-heading font-black text-xl mt-3" style={{ color: 'var(--gf-text-primary)' }}>
                  Spend {confirmReward.cost_coins} 🪙 on
                </h3>
                <p className="font-heading font-black text-2xl mt-1" style={{ color: 'var(--gf-amber)' }}>
                  {confirmReward.reward_name}?
                </p>
                <p className="font-body text-sm mt-2" style={{ color: 'var(--gf-text-secondary)' }}>
                  You have {user.coins} 🪙 · {user.coins - confirmReward.cost_coins} remaining after
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmReward(null)}
                  className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={confirmRedeem}
                  className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                  style={{ backgroundColor: 'var(--gf-amber)', color: '#0D0F14' }}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success screen */}
      <AnimatePresence>
        {successCode && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <span className="text-5xl">🎉</span>
              <h3 className="font-heading font-black text-2xl mt-3 mb-1" style={{ color: 'var(--gf-text-primary)' }}>Redeemed!</h3>
              <p className="font-heading font-black text-base mb-4" style={{ color: 'var(--gf-amber)' }}>{successCode.reward.reward_name}</p>

              {successCode.code && (
                <div>
                  <p className="font-body text-sm mb-3" style={{ color: 'var(--gf-text-secondary)' }}>Your discount code:</p>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-5"
                    style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
                    <code className="flex-1 font-mono font-bold text-base tracking-widest" style={{ color: 'var(--gf-green)' }}>
                      {successCode.code}
                    </code>
                    <button onClick={copyCode}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: copied ? '#22C55E' : 'var(--gf-bg-primary)' }}>
                      {copied ? <Check size={16} color="#FFF" /> : <Copy size={16} color="var(--gf-text-secondary)" />}
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setSuccessCode(null)}
                className="w-full py-3.5 rounded-xl font-heading font-black text-base"
                style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, Zap, Brain, Trophy, BarChart2, Shield } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { invokeFunction } from '@/api/supabase';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: 'AED 29.99', period: '/month', priceId: null, badge: null },
  { id: 'yearly',  label: 'Yearly',  price: 'AED 214.99', period: '/year', priceId: null, badge: 'BEST VALUE — Save 40%' },
];

const FEATURES = [
  { icon: Trophy,   color: '#FFB800', title: 'Global Leaderboard',       desc: 'Compete with athletes worldwide and climb the ranks' },
  { icon: Brain,    color: '#7C3AED', title: 'Personalized Nutrition',    desc: 'AI-generated meal plans tailored to your exact fitness profile' },
  { icon: Zap,      color: '#C8FF00', title: 'Unlimited AI Coaching',     desc: 'Unlimited Coach G requests — workouts, advice & plans' },
  { icon: BarChart2,color: '#4FC3F7', title: 'Advanced Analytics',        desc: 'Deep stats on progress, body composition trends & insights' },
  { icon: Shield,   color: '#EF4444', title: 'Exclusive Avatar Items',    desc: 'Unlock premium skins, accessories & legendary tier gear' },
  { icon: Crown,    color: '#FFB800', title: 'Premium Badge',             desc: 'Show off the ⚡ PRO badge on your profile and leaderboard' },
];

export default function Premium() {
   const navigate = useNavigate();
   const { user } = useGameFit();
   const [selectedPlan, setSelectedPlan] = useState('yearly');
   const [loading, setLoading] = useState(false);

   const isPremium = user.account_type === 'premium';

   useEffect(() => {
     window.scrollTo(0, 0);
   }, []);

  const [checkoutError, setCheckoutError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setCheckoutError('');
    try {
      const res = await invokeFunction('create-checkout', { plan: selectedPlan });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        setCheckoutError('Could not start checkout. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="font-heading font-black text-3xl mb-2" style={{ color: 'var(--gf-text-primary)' }}>You're Premium!</h2>
        <p className="font-body text-sm mb-6" style={{ color: 'var(--gf-text-secondary)' }}>All premium features are unlocked for you.</p>
        <button onClick={() => navigate(-1)}
          className="px-8 py-3.5 rounded-2xl font-heading font-black text-lg"
          style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          <ArrowLeft size={18} color="var(--gf-text-secondary)" />
        </button>
        <h1 className="font-heading font-black text-2xl" style={{ color: 'var(--gf-text-primary)' }}>Go Premium</h1>
      </div>

      {/* Hero */}
      <motion.div className="mx-5 mt-5 rounded-3xl p-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0a4a 0%, #2d1080 50%, #0d0f14 100%)', border: '1px solid rgba(124,58,237,0.4)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 30%, #7C3AED, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="text-5xl mb-3">👑</div>
          <h2 className="font-heading font-black text-3xl text-white mb-2">Unlock Your Full Potential</h2>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Everything you need to crush your fitness goals — AI coaching, leaderboards, nutrition & more.
          </p>
        </div>
      </motion.div>

      {/* Features */}
      <div className="px-5 mt-6 space-y-3">
        <h3 className="font-heading font-black text-xl mb-4" style={{ color: 'var(--gf-text-primary)' }}>What You Get</h3>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${f.color}18` }}>
                <Icon size={20} color={f.color} />
              </div>
              <div className="flex-1">
                <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{f.title}</p>
                <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{f.desc}</p>
              </div>
              <Check size={16} color="#22C55E" />
            </motion.div>
          );
        })}
      </div>

      {/* Plan selector */}
      <div className="px-5 mt-7">
        <h3 className="font-heading font-black text-xl mb-4" style={{ color: 'var(--gf-text-primary)' }}>Choose Your Plan</h3>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
              className="p-4 rounded-2xl text-left transition-all relative overflow-hidden"
              style={{
                backgroundColor: selectedPlan === plan.id ? 'rgba(124,58,237,0.12)' : 'var(--gf-bg-surface)',
                border: `2px solid ${selectedPlan === plan.id ? '#7C3AED' : 'var(--gf-border)'}`,
              }}>
              {plan.badge && (
                <div className="absolute -top-0.5 -right-0.5 px-2 py-0.5 rounded-bl-xl rounded-tr-xl font-body text-[9px] font-black"
                  style={{ backgroundColor: '#7C3AED', color: 'white' }}>
                  {plan.badge}
                </div>
              )}
              <p className="font-heading font-black text-base mb-0.5" style={{ color: 'var(--gf-text-primary)' }}>{plan.label}</p>
              <p className="font-heading font-black text-2xl" style={{ color: selectedPlan === plan.id ? '#7C3AED' : 'var(--gf-text-primary)' }}>
                {plan.price}
              </p>
              <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{plan.period}</p>
            </button>
          ))}
        </div>

        {/* CTA */}
        {checkoutError && (
          <div className="mb-3 px-4 py-3 rounded-xl text-sm font-body"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {checkoutError}
          </div>
        )}
        <motion.button
          onClick={handleSubscribe}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-heading font-black text-xl flex items-center justify-center gap-2 transition-all"
          style={{ background: loading ? 'var(--gf-border)' : 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}>
          {loading ? (
            <span className="font-body">Processing...</span>
          ) : (
            <><Crown size={22} /> Start Premium — {PLANS.find(p => p.id === selectedPlan)?.price}</>
          )}
        </motion.button>

        <p className="text-center font-body text-xs mt-3" style={{ color: 'var(--gf-text-secondary)' }}>
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, Lock } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import BottomNav from '@/components/gamefit/BottomNav';
import PremiumModal from '@/components/gamefit/PremiumModal';
import NutritionTab from '@/components/gamefit/NutritionTab';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ActionSheet, { SelectTrigger } from '@/components/gamefit/ActionSheet';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import { invokeFunction } from '@/api/supabase';

const AI_LIMIT = 10;

const QUICK_PROMPTS = [
  "What should I eat today?",
  "Help me recover from leg day",
  "Am I overtraining?",
  "Suggest a warm-up routine",
];

const EQUIPMENT_OPTIONS = ['No Equipment', 'Dumbbells', 'Barbell', 'Machines', 'Full Gym'];

const MOCK_AI_RESPONSES = {
  plan: (days, duration, equipment) =>
    `Here's your personalized ${days}-day workout plan (${duration} min sessions, ${equipment.join(', ')}):\n\nDay 1 — Push\nWarm-up: 5 min light cardio + dynamic stretches\n• Bench Press / Push-ups: 4×10\n• Shoulder Press: 3×12\n• Tricep Dips: 3×15\nCooldown: 5 min stretch\n\nDay 2 — Pull\nWarm-up: 5 min\n• Rows / Pull-ups: 4×10\n• Bicep Curls: 3×12\n• Face Pulls: 3×15\n\nDay 3 — Legs\nWarm-up: 5 min\n• Squats: 4×10\n• Lunges: 3×12 each\n• Calf Raises: 3×20\n\nRest on remaining days. Stay hydrated and prioritize sleep for recovery. This is general guidance only — not medical advice. Consult a healthcare professional before starting any new exercise program.`,
  chat: [
    "Great question! For optimal recovery, focus on protein intake within 30 minutes post-workout (0.3g/kg of bodyweight). Prioritize sleep and consider light active recovery like walking or yoga on rest days. This is general guidance only — not medical advice.",
    "Based on your recent workouts, you're doing great! I recommend ensuring at least 1-2 rest days per week to avoid overtraining. Watch for signs like persistent fatigue, declining performance, or mood changes. This is general guidance only — not medical advice.",
    "For pre-workout fuel, try a light meal 1-2 hours before: complex carbs + lean protein works well. Think oats with banana, or rice cakes with peanut butter. Post-workout, prioritize protein + carbs for glycogen replenishment. This is general guidance only — not medical advice.",
    "A solid warm-up routine: 5 min light cardio, leg swings (10 each side), arm circles (10 each), hip circles (10 each), bodyweight squats (10), then 2 lighter sets of your first exercise. This primes your nervous system and reduces injury risk. This is general guidance only — not medical advice.",
  ]
};

export default function Coach() {
  const { user, incrementAIRequests } = useGameFit();
  const [tab, setTab] = useState('plan');
  const [showPremium, setShowPremium] = useState(false);
  const isPremium = user.account_type === 'premium';
  const requestsLeft = AI_LIMIT - user.ai_requests_this_month;
  const atLimit = !isPremium && user.ai_requests_this_month >= AI_LIMIT;

  // Plan state
  const [days, setDays] = useState(3);
  const [sessionDuration, setSessionDuration] = useState('45');
  const [equipment, setEquipment] = useState(['No Equipment']);
  const [injuries, setInjuries] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState('');
  const [planRating, setPlanRating] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm Coach G 🤖 Your AI fitness coach. Ask me anything about workouts, nutrition, recovery, or training plans. I'm here to help you level up!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [showDurationSheet, setShowDurationSheet] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const toggleEquipment = (e) => {
    setEquipment(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const handleGeneratePlan = async () => {
    if (atLimit) { setShowPremium(true); return; }
    setPlanLoading(true);
    setPlanResult('');
    const eq = equipment.length ? equipment : ['No Equipment'];
    try {
      const res = await invokeFunction('coach-g', {
        type: 'plan', days, sessionDuration, equipment: eq, injuries,
      });
      setPlanResult(res?.reply || 'Failed to generate plan. Please try again.');
    } catch (err) {
      if (err.premium_required) { setShowPremium(true); setPlanResult(''); }
      else setPlanResult(err.message || 'Failed to generate plan. Please try again.');
    }
    incrementAIRequests();
    setPlanLoading(false);
    setPlanRating(null);
  };

  const handleChat = async (msg) => {
    if (atLimit) { setShowPremium(true); return; }
    const userMsg = msg || chatInput.trim();
    if (!userMsg) return;
    setChatInput('');
    const updatedMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(updatedMessages);
    setChatLoading(true);
    try {
      const res = await invokeFunction('coach-g', {
        type: 'chat',
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res?.reply || 'Sorry, I could not respond right now.';
      setMessages(prev => [...prev, { role: 'ai', content: reply, showRating: true, rated: null }]);
      incrementAIRequests();
    } catch (err) {
      if (err.premium_required) {
        setShowPremium(true);
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: err.message || 'Sorry, I could not respond right now.',
        }]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const rateMessage = (idx, rating) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rated: rating } : m));
  };

  const inputStyle = { backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' };

  return (
    <div className="min-h-screen pb-20 flex flex-col" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
        <ScreenHeader 
          title="Coach G" 
          subtitle="Your AI fitness coach"
          showBackButton={false}
          rightAction={!isPremium && (
            <div className="px-3 py-1.5 rounded-xl font-body text-xs font-medium"
              style={{ backgroundColor: atLimit ? 'rgba(239,68,68,0.15)' : 'var(--gf-bg-elevated)', color: atLimit ? '#EF4444' : 'var(--gf-text-secondary)' }}>
              {user.ai_requests_this_month} / {AI_LIMIT}
            </div>
          )}
        />
        
        {/* Tabs */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex rounded-xl p-1" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            {[['plan','📋 Plan'], ['nutrition','🥗 Nutrition'], ['chat','💬 Chat']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-lg font-body font-medium text-sm transition-all"
                style={{ backgroundColor: tab === t ? 'var(--gf-purple)' : 'transparent', color: tab === t ? '#FFFFFF' : 'var(--gf-text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </ScreenTransition>

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">
          {/* Days */}
          <div>
            <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>
              Days per week: <span style={{ color: 'var(--gf-purple)' }}>{days}</span>
            </label>
            <div className="flex items-center gap-4">
              <button onClick={() => setDays(d => Math.max(1, d - 1))}
                className="w-10 h-10 rounded-xl font-heading font-black text-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)' }}>−</button>
              <div className="flex-1 flex gap-1">
                {[1,2,3,4,5,6,7].map(d => (
                  <div key={d} className="flex-1 h-2 rounded-full transition-all"
                    style={{ backgroundColor: d <= days ? 'var(--gf-purple)' : 'var(--gf-border)' }} />
                ))}
              </div>
              <button onClick={() => setDays(d => Math.min(7, d + 1))}
                className="w-10 h-10 rounded-xl font-heading font-black text-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)' }}>+</button>
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Session Duration</label>
            <SelectTrigger 
              value={`${sessionDuration} min`}
              label="Select duration"
              onClick={() => setShowDurationSheet(true)}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Equipment Available</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(e => (
                <button key={e} onClick={() => toggleEquipment(e)}
                  className="px-3 py-2 rounded-xl font-body text-sm font-medium transition-all"
                  style={{
                    backgroundColor: equipment.includes(e) ? 'rgba(124,58,237,0.2)' : 'var(--gf-bg-elevated)',
                    color: equipment.includes(e) ? 'var(--gf-purple)' : 'var(--gf-text-secondary)',
                    border: `1px solid ${equipment.includes(e) ? 'var(--gf-purple)' : 'var(--gf-border)'}`,
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Injuries */}
          <div>
            <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Injuries / Limitations</label>
            <input type="text" placeholder="e.g. bad knees, shoulder injury (optional)"
              value={injuries} onChange={e => setInjuries(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-colors"
              style={{ 
                ...inputStyle,
                borderColor: injuries ? 'var(--gf-purple)' : 'var(--gf-border)'
              }} />
          </div>

          {/* Premium locked plans */}
          <div>
            <p className="font-body text-sm mb-2" style={{ color: 'var(--gf-text-secondary)' }}>Premium Plans</p>
            <div className="space-y-2">
              {['Marathon Training', 'Competition Prep', 'Advanced Powerlifting'].map(plan => (
                <div key={plan} className="rounded-xl p-3 flex items-center justify-between opacity-60"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
                  <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>{plan}</span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: 'var(--gf-purple)' }}>
                    <Lock size={12} /> Premium
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGeneratePlan} disabled={planLoading}
            className="w-full py-4 rounded-2xl font-heading font-black text-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: atLimit ? 'var(--gf-border)' : 'var(--gf-purple)', color: '#FFFFFF', opacity: planLoading ? 0.7 : 1 }}>
            {planLoading ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⚙️</motion.span> Generating...</>
            ) : atLimit ? (<><Lock size={20} /> Limit Reached</>) : (<><Zap size={20} /> Generate Plan</>)}
          </button>

          {/* Plan result */}
          {planResult && (
            <motion.div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <pre className="font-body text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--gf-text-primary)' }}>
                {planResult}
              </pre>
              {!planRating && (
                <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--gf-border)' }}>
                  <p className="font-body text-xs mr-auto" style={{ color: 'var(--gf-text-secondary)' }}>Rate this plan:</p>
                  {[{ label: '👍 Too Easy', val: 'too_easy' }, { label: '✅ Just Right', val: 'just_right' }, { label: '👎 Too Hard', val: 'too_hard' }].map(r => (
                    <button key={r.val} onClick={() => setPlanRating(r.val)}
                      className="px-2 py-1 rounded-lg font-body text-xs transition-all active:scale-95"
                      style={{ backgroundColor: 'var(--gf-bg-surface)', color: 'var(--gf-text-secondary)', border: '1px solid var(--gf-border)' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {planRating && (
                <p className="text-center text-sm mt-3 font-body" style={{ color: 'var(--gf-green)' }}>✓ Thanks for your feedback!</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Nutrition Tab */}
      {tab === 'nutrition' && (
        <NutritionTab
          user={user}
          atLimit={atLimit}
          onLimitHit={() => setShowPremium(true)}
          incrementAIRequests={incrementAIRequests}
        />
      )}

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick prompts */}
          <div className="px-5 pt-3 pb-2 overflow-x-auto flex gap-2 no-scrollbar">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleChat(p)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl font-body text-xs font-medium whitespace-nowrap transition-all"
                style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: 'var(--gf-purple)', border: '1px solid rgba(124,58,237,0.3)' }}>
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div className={`px-4 py-3 rounded-2xl font-body text-sm leading-relaxed`}
                    style={{
                      backgroundColor: msg.role === 'user' ? 'rgba(200,255,0,0.15)' : 'rgba(124,58,237,0.15)',
                      color: 'var(--gf-text-primary)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(200,255,0,0.3)' : 'rgba(124,58,237,0.3)'}`,
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                    {msg.content}
                  </div>
                  {msg.showRating && !msg.rated && (
                    <div className="flex gap-1 mt-1 justify-end">
                      {[{ label: '👍', val: 'too_easy' }, { label: '✅', val: 'just_right' }, { label: '👎', val: 'too_hard' }].map(r => (
                        <button key={r.val} onClick={() => rateMessage(i, r.val)}
                          className="w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all"
                          style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.rated && (
                    <p className="text-xs text-right mt-1 font-body" style={{ color: 'var(--gf-text-secondary)' }}>Feedback saved ✓</p>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gf-purple)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-3 flex gap-2" style={{ borderTop: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
            <input value={chatInput} maxLength={500}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
              placeholder={atLimit ? 'Upgrade to send more messages' : "Ask Coach G anything..."}
              disabled={atLimit}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm outline-none"
              style={{ ...inputStyle, opacity: atLimit ? 0.5 : 1 }} />
            <button onClick={() => handleChat()} disabled={!chatInput.trim() || atLimit}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ backgroundColor: chatInput.trim() && !atLimit ? 'var(--gf-purple)' : 'var(--gf-bg-elevated)' }}>
              <Send size={18} color={chatInput.trim() && !atLimit ? '#FFFFFF' : 'var(--gf-text-secondary)'} />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      
      <ActionSheet
        isOpen={showDurationSheet}
        onClose={() => setShowDurationSheet(false)}
        title="Session Duration"
        options={['20','30','45','60','90'].map(d => ({
          label: `${d} minutes`,
          selected: sessionDuration === d,
          onSelect: () => setSessionDuration(d)
        }))}
      />
    </div>
  );
}
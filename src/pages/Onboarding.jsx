import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import HumanAvatar from '@/components/gamefit/HumanAvatar';
import { base44 } from '@/api/base44Client';

// ── Mascot (little GameFit elephant-like coach) ───────────────────────────────
function Mascot({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx="40" cy="42" rx="22" ry="26" fill="#64B5F6" />
      <ellipse cx="30" cy="42" rx="8" ry="7" fill="#64B5F6" />
      <ellipse cx="50" cy="42" rx="8" ry="7" fill="#64B5F6" />
      <ellipse cx="30" cy="40" rx="5" ry="4.5" fill="#4FC3F7" />
      <ellipse cx="50" cy="40" rx="5" ry="4.5" fill="#4FC3F7" />
      <ellipse cx="40" cy="26" rx="16" ry="14" fill="#64B5F6" />
      <rect x="28" y="18" width="24" height="8" rx="4" fill="#4CAF50" />
      <circle cx="33" cy="27" r="4" fill="#90CAF9" />
      <circle cx="47" cy="27" r="4" fill="#90CAF9" />
      <circle cx="34" cy="27" r="2.2" fill="#1A237E" />
      <circle cx="48" cy="27" r="2.2" fill="#1A237E" />
      <circle cx="34.7" cy="26.3" r="0.8" fill="white" />
      <circle cx="48.7" cy="26.3" r="0.8" fill="white" />
      <path d="M36 32 Q40 35 44 32" stroke="#1565C0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#90CAF9" />
      <path d="M30 52 Q28 62 30 68" stroke="#64B5F6" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M50 52 Q52 62 50 68" stroke="#64B5F6" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="68" rx="5" ry="3" fill="#90CAF9" />
      <ellipse cx="50" cy="68" rx="5" ry="3" fill="#90CAF9" />
    </svg>
  );
}

function SpeechBubble({ text }) {
  return (
    <div className="relative max-w-xs mx-auto mb-6">
      <div className="px-5 py-3 rounded-2xl rounded-bl-sm font-body text-base text-white text-center"
        style={{ backgroundColor: '#1E2330', border: '1px solid #2A2F3A' }}>
        {text}
      </div>
      <div className="absolute -bottom-2 left-8 w-0 h-0"
        style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #1E2330' }} />
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-1.5 rounded-full mb-6" style={{ backgroundColor: '#2A2F3A' }}>
      <motion.div className="h-full rounded-full" style={{ backgroundColor: '#C8FF00' }}
        animate={{ width: `${(current / total) * 100}%` }} transition={{ duration: 0.4 }} />
    </div>
  );
}

// ── Option Row ────────────────────────────────────────────────────────────────
function OptionRow({ label, sublabel, emoji, selected, onSelect }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3 transition-all active:scale-98"
      style={{
        backgroundColor: selected ? 'rgba(200,255,0,0.10)' : '#161A22',
        border: `1.5px solid ${selected ? '#C8FF00' : '#2A2F3A'}`,
      }}>
      <div className="flex items-center gap-3">
        {emoji && <span className="text-xl">{emoji}</span>}
        <span className="font-body font-semibold text-base text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {sublabel && <span className="font-body text-sm" style={{ color: '#8A8F9E' }}>{sublabel}</span>}
        {selected && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C8FF00' }}>
          <Check size={12} color="#0D0F14" strokeWidth={3} />
        </div>}
      </div>
    </button>
  );
}

// ── Scroll Picker ─────────────────────────────────────────────────────────────
function ScrollPicker({ value, onChange, min, max, unit, step = 1 }) {
  const items = [];
  for (let i = min; i <= max; i += step) items.push(i);
  const listRef = useRef(null);
  const ITEM_H = 64;

  const scrollTo = (val, smooth = true) => {
    const idx = items.indexOf(val);
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
    }
  };

  React.useEffect(() => { scrollTo(value, false); }, []);
  React.useEffect(() => { scrollTo(value, true); }, [value]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clampedIdx] !== value) onChange(items[clampedIdx]);
  };

  return (
    <div className="relative flex flex-col items-center" style={{ width: 240 }}>
      {/* Center highlight — sits behind the scroll list */}
      <div className="absolute pointer-events-none rounded-2xl z-10"
        style={{ top: ITEM_H, height: ITEM_H, left: 0, right: 0, border: '2px solid #C8FF00', backgroundColor: 'rgba(200,255,0,0.08)' }} />

      <div ref={listRef} onScroll={handleScroll}
        className="overflow-y-scroll no-scrollbar relative z-0"
        style={{ height: ITEM_H * 3, width: '100%', scrollSnapType: 'y mandatory' }}>
        {/* top padding */}
        <div style={{ height: ITEM_H }} />
        {items.map(v => {
          const isSelected = v === value;
          return (
            <div key={v} onClick={() => { onChange(v); scrollTo(v); }}
              className="flex items-center justify-center cursor-pointer"
              style={{ height: ITEM_H, scrollSnapAlign: 'start' }}>
              {isSelected ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-black text-5xl text-white leading-none">{v}</span>
                  {unit && <span className="font-body font-semibold text-xl" style={{ color: '#8A8F9E' }}>{unit}</span>}
                </div>
              ) : (
                <span className="font-heading font-black text-2xl" style={{ color: '#4A5065' }}>{v}</span>
              )}
            </div>
          );
        })}
        {/* bottom padding */}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

// ── Avatar Customizer ─────────────────────────────────────────────────────────
function AvatarCustomizer({ avatarConfig, onChange }) {
  const skins = ['light', 'medium', 'dark', 'deepbrown'];
  const outfits = ['blue', 'black', 'red', 'green', 'purple'];
  const hairs = ['brown', 'black', 'blonde', 'white', 'pink'];

  const skinLabels = { light: '☀️', medium: '🌤️', dark: '🌙', deepbrown: '🌑' };
  const outfitLabels = { blue: '🔵', black: '⚫', red: '🔴', green: '🟢', purple: '🟣' };
  const hairLabels = { brown: '🤎', black: '🖤', blonde: '💛', white: '🤍', pink: '🩷' };

  return (
    <div className="w-full">
      {/* Avatar preview */}
      <div className="flex justify-center mb-6">
        <div className="relative p-4 rounded-3xl" style={{ backgroundColor: '#161A22', border: '2px solid #C8FF00' }}>
          <HumanAvatar {...avatarConfig} size={140} tier={1} />
        </div>
      </div>

      {/* Gender */}
      <div className="mb-4">
        <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#8A8F9E' }}>Gender</p>
        <div className="flex gap-3">
          {['male', 'female'].map(g => (
            <button key={g} onClick={() => onChange({ ...avatarConfig, gender: g })}
              className="flex-1 py-3 rounded-xl font-body font-semibold text-sm transition-all"
              style={{
                backgroundColor: avatarConfig.gender === g ? '#C8FF00' : '#161A22',
                color: avatarConfig.gender === g ? '#0D0F14' : '#8A8F9E',
                border: `1px solid ${avatarConfig.gender === g ? '#C8FF00' : '#2A2F3A'}`,
              }}>
              {g === 'male' ? '♂ Male' : '♀ Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Skin */}
      <div className="mb-4">
        <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#8A8F9E' }}>Skin Tone</p>
        <div className="flex gap-3 justify-center">
          {skins.map(s => (
            <button key={s} onClick={() => onChange({ ...avatarConfig, skin: s })}
              className="w-11 h-11 rounded-full transition-all flex items-center justify-center text-lg"
              style={{
                backgroundColor: { light: '#FDDBB4', medium: '#E8AC7A', dark: '#C68642', deepbrown: '#7D4C2A' }[s],
                border: `3px solid ${avatarConfig.skin === s ? '#C8FF00' : 'transparent'}`,
              }}>
              {avatarConfig.skin === s && <Check size={14} color="white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      {/* Outfit */}
      <div className="mb-4">
        <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#8A8F9E' }}>Outfit Color</p>
        <div className="flex gap-3 justify-center">
          {outfits.map(o => (
            <button key={o} onClick={() => onChange({ ...avatarConfig, outfit: o })}
              className="w-11 h-11 rounded-full transition-all flex items-center justify-center text-lg"
              style={{
                backgroundColor: { blue: '#4FC3F7', black: '#37474F', red: '#EF5350', green: '#66BB6A', purple: '#AB47BC' }[o],
                border: `3px solid ${avatarConfig.outfit === o ? 'white' : 'transparent'}`,
              }}>
              {avatarConfig.outfit === o && <Check size={14} color="white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      {/* Hair */}
      <div>
        <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#8A8F9E' }}>Hair Color</p>
        <div className="flex gap-3 justify-center">
          {hairs.map(h => (
            <button key={h} onClick={() => onChange({ ...avatarConfig, hair: h })}
              className="w-11 h-11 rounded-full transition-all flex items-center justify-center text-lg"
              style={{
                backgroundColor: { brown: '#5D4037', black: '#212121', blonde: '#FBC02D', white: '#ECEFF1', pink: '#F48FB1' }[h],
                border: `3px solid ${avatarConfig.hair === h ? '#C8FF00' : 'transparent'}`,
              }}>
              {avatarConfig.hair === h && <Check size={14} color="white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Health Integrations Screen ────────────────────────────────────────────────
function HealthIntegrations({ connected, onToggle }) {
  const INTEGRATIONS = [
    { id: 'strava',        name: 'Strava',        emoji: '🏃', color: '#FC4C02', desc: 'Sync runs, rides & activities' },
    { id: 'apple_health',  name: 'Apple Health',  emoji: '❤️', color: '#FF2D55', desc: 'Steps, heart rate & workouts' },
    { id: 'google_fit',    name: 'Google Fit',    emoji: '🟢', color: '#34A853', desc: 'Activity & fitness metrics' },
    { id: 'whoop',         name: 'WHOOP',         emoji: '⚡', color: '#CDF000', desc: 'Recovery & strain data' },
    { id: 'garmin',        name: 'Garmin',        emoji: '⌚', color: '#007CC3', desc: 'GPS & performance tracking' },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <Mascot size={60} />
      </div>
      <SpeechBubble text="Connect your health apps to sync your data automatically!" />
      
      {INTEGRATIONS.map(int => {
        const isConnected = connected.includes(int.id);
        return (
          <button key={int.id} onClick={() => onToggle(int.id)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-98"
            style={{
              backgroundColor: isConnected ? `${int.color}15` : '#161A22',
              border: `1.5px solid ${isConnected ? int.color : '#2A2F3A'}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${int.color}20` }}>
                {int.emoji}
              </div>
              <div className="text-left">
                <p className="font-body font-semibold text-sm text-white">{int.name}</p>
                <p className="font-body text-xs" style={{ color: '#8A8F9E' }}>{int.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="text-xs font-body font-semibold px-2 py-1 rounded-lg" style={{ color: int.color, backgroundColor: `${int.color}20` }}>
                  Connected ✓
                </span>
              ) : (
                <span className="text-xs font-body font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: '#2A2F3A', color: '#8A8F9E' }}>
                  Connect
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Onboarding Flow ──────────────────────────────────────────────────────
const TOTAL_STEPS = 9;

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser } = useGameFit();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // All profile state
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(22);
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [fitnessGoal, setFitnessGoal] = useState(null);
  const [fitnessLevel, setFitnessLevel] = useState(null);
  const [avatarConfig, setAvatarConfig] = useState({ gender: 'male', skin: 'light', outfit: 'blue', hair: 'brown' });
  const [connectedApps, setConnectedApps] = useState([]);

  const bmi = weightKg && heightCm ? (weightKg / ((heightCm / 100) ** 2)).toFixed(1) : null;
  const bmiLabel = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese') : '';

  const toggleApp = (id) => {
    setConnectedApps(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // Sync avatar gender with profile gender
  React.useEffect(() => {
    if (gender) setAvatarConfig(a => ({ ...a, gender }));
  }, [gender]);

  const canProceed = () => {
    if (step === 0) return !!gender;
    if (step === 4) return !!fitnessGoal;
    if (step === 5) return !!fitnessLevel;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    // Only include safe, user-editable profile fields — never send admin/payment fields
    const profileData = {
      gender, age, weight_kg: weightKg, height_cm: heightCm,
      bmi: parseFloat(bmi), fitness_goal: fitnessGoal,
      fitness_level: fitnessLevel, avatar_config: avatarConfig,
      connected_apps: connectedApps, onboarding_complete: true,
      avatar_style: `${avatarConfig.gender}_${avatarConfig.skin}`,
    };
    updateUser(profileData);

    // Save to backend
    try {
      const me = await base44.auth.me();
      if (me) {
        await base44.auth.updateMe(profileData);
      }
    } catch (_) { /* offline — continue */ }

    setSaving(false);
    navigate('/dashboard', { replace: true });
  };

  const next = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else finish();
  };

  const back = () => { if (step > 0) setStep(s => s - 1); };

  const steps = [
    // 0 — Gender
    {
      mascotText: "Alright! Let's get some basic info down.",
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-1">I am...</h2>
          <div className="flex gap-4 mt-6">
            {[['male', '♂', 'MALE'], ['female', '♀', 'FEMALE']].map(([val, sym, label]) => (
              <button key={val} onClick={() => setGender(val)}
                className="flex-1 py-8 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                style={{
                  backgroundColor: gender === val ? 'rgba(200,255,0,0.10)' : '#161A22',
                  border: `2px solid ${gender === val ? '#C8FF00' : '#2A2F3A'}`,
                }}>
                <span className="font-heading font-black text-5xl" style={{ color: '#4A5065' }}>{sym}</span>
                <span className="font-heading font-black text-lg text-white">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    // 1 — Age
    {
      mascotText: 'How old are you?',
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={age} onChange={setAge} min={13} max={80} unit="yrs" />
        </div>
      ),
    },
    // 2 — Weight
    {
      mascotText: "What's your current weight?",
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={weightKg} onChange={setWeightKg} min={30} max={200} unit="kg" />
          {bmi && (
            <div className="mt-4 px-5 py-3 rounded-2xl w-full" style={{ backgroundColor: '#161A22', border: '1px solid #2A2F3A' }}>
              <p className="font-body text-sm text-center" style={{ color: '#8A8F9E' }}>
                ⓘ Your BMI is <span className="text-white font-semibold">{bmi}</span> — <span style={{ color: '#C8FF00' }}>{bmiLabel}</span>
              </p>
            </div>
          )}
        </div>
      ),
    },
    // 3 — Height
    {
      mascotText: "How tall are you?",
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={heightCm} onChange={setHeightCm} min={120} max={220} unit="cm" />
        </div>
      ),
    },
    // 4 — Fitness Goal
    {
      mascotText: 'What is your top fitness goal?',
      content: (
        <div className="w-full">
          {[
            { val: 'Lose weight and get lean',   emoji: '🥗', sub: 'Fat loss' },
            { val: 'Build muscle mass',           emoji: '💪', sub: 'Hypertrophy' },
            { val: 'Become stronger',             emoji: '🏋️', sub: 'Strength' },
            { val: 'Improve endurance',           emoji: '🏃', sub: 'Cardio' },
            { val: 'Become more consistent',      emoji: '🔥', sub: 'Habits' },
            { val: 'General fitness',             emoji: '⭐', sub: 'Stay active' },
          ].map(({ val, emoji, sub }) => (
            <OptionRow key={val} label={val} sublabel={sub} emoji={emoji}
              selected={fitnessGoal === val} onSelect={() => setFitnessGoal(val)} />
          ))}
        </div>
      ),
    },
    // 5 — Experience
    {
      mascotText: 'How experienced are you with working out?',
      content: (
        <div className="w-full">
          {[
            { val: 'Beginner', label: "I've never worked out", sub: 'Starter', emoji: '📊' },
            { val: 'Novice',   label: 'Beginner – Tried it before', sub: 'Learning', emoji: '📈' },
            { val: 'Intermediate', label: 'Intermediate – Regular training', sub: 'Consistent', emoji: '📉' },
            { val: 'Advanced', label: 'Advanced – Years of experience', sub: 'Elite', emoji: '🏆' },
          ].map(({ val, label, sub, emoji }) => (
            <OptionRow key={val} label={label} sublabel={sub} emoji={emoji}
              selected={fitnessLevel === val} onSelect={() => setFitnessLevel(val)} />
          ))}
        </div>
      ),
    },
    // 6 — Avatar Pick
    {
      mascotText: 'Pick an Avatar to get started! Make it your own.',
      content: <AvatarCustomizer avatarConfig={avatarConfig} onChange={setAvatarConfig} />,
    },
    // 7 — Avatar Reveal
    {
      mascotText: 'Say hello to your very own Avatar!',
      content: (
        <div className="w-full flex flex-col items-center">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <h2 className="font-heading font-black text-3xl text-white text-center mb-2">Meet your Avatar</h2>
            <p className="font-body text-sm text-center mb-8" style={{ color: '#8A8F9E' }}>
              A reflection of you. It grows as you get stronger!
            </p>
            <div className="flex justify-center">
              <div className="p-8 rounded-3xl relative overflow-hidden"
                style={{ backgroundColor: '#161A22', border: '2px solid #C8FF00' }}>
                <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 50% 40%, #C8FF00, transparent 60%)' }} />
                <HumanAvatar {...avatarConfig} size={160} tier={1} />
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    // 8 — Health Integrations
    {
      mascotText: null,
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-2xl text-white mb-1">Health Connect</h2>
          <p className="font-body text-sm mb-5" style={{ color: '#8A8F9E' }}>
            Connect your health apps to automatically sync your fitness data with GameFit.
          </p>
          <HealthIntegrations connected={connectedApps} onToggle={toggleApp} />
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 pt-12" style={{ backgroundColor: '#0D0F14' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {step > 0 ? (
          <button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1E2330' }}>
            <ChevronLeft size={18} color="#8A8F9E" />
          </button>
        ) : <div className="w-9" />}
        <div className="flex-1">
          <ProgressBar current={step + 1} total={TOTAL_STEPS} />
        </div>
      </div>

      {/* Mascot + Bubble */}
      {step !== 7 && step !== 8 && (
        <div className="flex items-start gap-3 mb-5">
          <Mascot size={60} />
          {currentStep.mascotText && <SpeechBubble text={currentStep.mascotText} />}
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="mt-6 space-y-3">
        <button onClick={next} disabled={!canProceed() || saving}
          className="w-full py-4 rounded-2xl font-heading font-black text-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            backgroundColor: canProceed() ? '#C8FF00' : '#2A2F3A',
            color: canProceed() ? '#0D0F14' : '#4A5065',
          }}>
          {saving ? 'Setting up your profile...' : isLast ? "Let's Go! 🚀" : 'NEXT'}
          {!saving && !isLast && <ChevronRight size={22} />}
        </button>
        {step >= 8 && (
          <button onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3 font-body text-sm" style={{ color: '#4A5065' }}>
            Continue without connecting
          </button>
        )}
      </div>
    </div>
  );
}
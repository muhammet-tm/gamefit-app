import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { invokeFunction } from '@/api/supabase';
import Avatar from '@/components/avatar/Avatar';
import {
  AVATAR_CLASSES, CLASS_LABELS, CLASS_TAGLINES, CLASS_COLORS,
  SKIN_TONES, HAIR_COLORS, DEFAULT_CONFIG,
  hairStylesFor, hairForBody, DEFAULT_HAIR_BY_BODY,
} from '@/components/avatar/palettes';

// ── Mascot (little GameFit elephant-like coach) ───────────────────────────────
function Mascot({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <ellipse cx="40" cy="42" rx="22" ry="26" fill="#1A3242" />
      <ellipse cx="30" cy="42" rx="8" ry="7" fill="#1A3242" />
      <ellipse cx="50" cy="42" rx="8" ry="7" fill="#1A3242" />
      <ellipse cx="30" cy="40" rx="5" ry="4.5" fill="#2A3040" />
      <ellipse cx="50" cy="40" rx="5" ry="4.5" fill="#2A3040" />
      <ellipse cx="40" cy="26" rx="16" ry="14" fill="#1A3242" />
      <rect x="28" y="18" width="24" height="8" rx="4" fill="#F4B044" />
      <circle cx="33" cy="27" r="4" fill="#F1EDE6" />
      <circle cx="47" cy="27" r="4" fill="#F1EDE6" />
      <circle cx="34" cy="27" r="2.2" fill="#0B1A24" />
      <circle cx="48" cy="27" r="2.2" fill="#0B1A24" />
      <circle cx="34.7" cy="26.3" r="0.8" fill="#F4B044" />
      <circle cx="48.7" cy="26.3" r="0.8" fill="#F4B044" />
      <path d="M36 32 Q40 35 44 32" stroke="#F4B044" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#2A3040" />
      <path d="M30 52 Q28 62 30 68" stroke="#1A3242" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M50 52 Q52 62 50 68" stroke="#1A3242" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="68" rx="5" ry="3" fill="#F4B044" />
      <ellipse cx="50" cy="68" rx="5" ry="3" fill="#F4B044" />
    </svg>
  );
}

function SpeechBubble({ text }) {
  return (
    <div className="relative max-w-xs mx-auto mb-6">
      <div className="px-5 py-3 rounded-2xl rounded-bl-sm font-body text-base text-white text-center"
        style={{ backgroundColor: '#1A3242', border: '1px solid #24455A' }}>
        {text}
      </div>
      <div className="absolute -bottom-2 left-8 w-0 h-0"
        style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #1A3242' }} />
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-1.5 rounded-full mb-6" style={{ backgroundColor: '#24455A' }}>
      <motion.div className="h-full rounded-full" style={{ backgroundColor: '#F4B044' }}
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
        backgroundColor: selected ? 'rgba(244, 176, 68,0.10)' : '#112532',
        border: `1.5px solid ${selected ? '#F4B044' : '#24455A'}`,
      }}>
      <div className="flex items-center gap-3">
        {emoji && <span className="text-xl">{emoji}</span>}
        <span className="font-body font-semibold text-base text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {sublabel && <span className="font-body text-sm" style={{ color: '#88A5B7' }}>{sublabel}</span>}
        {selected && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F4B044' }}>
          <Check size={12} color="#0B1A24" strokeWidth={3} />
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
        style={{ top: ITEM_H, height: ITEM_H, left: 0, right: 0, border: '2px solid #F4B044', backgroundColor: 'rgba(244, 176, 68,0.08)' }} />

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
                  {unit && <span className="font-body font-semibold text-xl" style={{ color: '#88A5B7' }}>{unit}</span>}
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

// ── Health Integrations Screen ────────────────────────────────────────────────
// Strava is a real OAuth connection; the rest are on the roadmap and say so.
// A "Connected ✓" toggle that only stores a string would show up as a phantom
// connection on the Avatar screen's Connect tab, which tracks real tokens.
const HEALTH_APPS = [
  { id: 'strava',       name: 'Strava',       emoji: '🏃', color: '#FC4C02', desc: 'Sync runs, rides & activities', comingSoon: false },
  { id: 'apple_health', name: 'Apple Health', emoji: '❤️', color: '#FF2D55', desc: 'Steps, heart rate & workouts',  comingSoon: true },
  { id: 'whoop',        name: 'WHOOP',        emoji: '⚡', color: '#CDF000', desc: 'Recovery & strain data',        comingSoon: true },
  { id: 'garmin',       name: 'Garmin',       emoji: '⌚', color: '#007CC3', desc: 'GPS & performance tracking',    comingSoon: true },
];

function HealthIntegrations({ onConnectStrava, stravaBusy }) {
  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <Mascot size={60} />
      </div>
      <SpeechBubble text="Connect a health app to sync activities automatically — or do it later from your Avatar screen." />

      {HEALTH_APPS.map(app => (
        <button key={app.id} onClick={app.comingSoon ? undefined : onConnectStrava}
          disabled={app.comingSoon || stravaBusy}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-98"
          style={{
            backgroundColor: '#112532',
            border: '1.5px solid #24455A',
            opacity: app.comingSoon ? 0.55 : 1,
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${app.color}20` }}>
              {app.emoji}
            </div>
            <div className="text-left">
              <p className="font-body font-semibold text-sm text-white">{app.name}</p>
              <p className="font-body text-xs" style={{ color: '#88A5B7' }}>{app.desc}</p>
            </div>
          </div>
          {app.comingSoon ? (
            <span className="text-xs font-body font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: '#24455A', color: '#88A5B7' }}>
              Soon
            </span>
          ) : (
            <span className="text-xs font-body font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: '#FC4C02', color: '#FFFFFF' }}>
              {stravaBusy ? 'Opening…' : 'Connect'}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main Onboarding Flow ──────────────────────────────────────────────────────
const TOTAL_STEPS = 10;

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
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [avatarClass, setAvatarClass] = useState(null);
  const [skinTone, setSkinTone] = useState(DEFAULT_CONFIG.skin_tone);
  const [hair, setHair] = useState(DEFAULT_CONFIG.hair);
  const [stravaBusy, setStravaBusy] = useState(false);

  const bmi = weightKg && heightCm ? (weightKg / ((heightCm / 100) ** 2)).toFixed(1) : null;
  const bmiLabel = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese') : '';

  // Gender picks the avatar rig: male and female are separately drawn
  // characters, not one body with different hair. The body can still be
  // changed later from the Avatar screen.
  const body = gender === 'female' ? 'female' : 'male';
  const pickGender = (g) => {
    setGender(g);
    setHair(prev => (prev === DEFAULT_CONFIG.hair
      ? DEFAULT_HAIR_BY_BODY[g === 'female' ? 'female' : 'male']
      : hairForBody(prev, g === 'female' ? 'female' : 'male')));
  };

  const canProceed = () => {
    if (step === 0) return !!gender;
    if (step === 1) return !!avatarClass;
    if (step === 5) return !!fitnessGoal;
    if (step === 6) return !!fitnessLevel;
    if (step === 7) return !!weeklyGoal;
    return true;
  };

  // Only safe, user-editable profile fields — never admin/payment fields.
  // connected_apps is deliberately NOT set here: only a completed OAuth flow
  // (StravaCallback) may claim a connection.
  const saveProfile = async () => {
    const profileData = {
      gender, age, weight_kg: weightKg, height_cm: heightCm,
      bmi: parseFloat(bmi), fitness_goal: fitnessGoal,
      fitness_level: fitnessLevel, weekly_goal: weeklyGoal,
      avatar_config: { version: 3, class: avatarClass, body, skin_tone: skinTone, hair },
      onboarding_complete: true,
    };
    try {
      await updateUser(profileData);
    } catch (_) { /* keep going — profile can be re-saved from the Profile tab */ }
  };

  const finish = async () => {
    setSaving(true);
    await saveProfile();
    setSaving(false);
    navigate('/dashboard', { replace: true });
  };

  // Strava is a real OAuth redirect: save the profile first so nothing is
  // lost, then hand the browser to Strava (StravaCallback returns to the app).
  const connectStrava = async () => {
    setStravaBusy(true);
    await saveProfile();
    try {
      const res = await invokeFunction('strava-auth', { action: 'authorize' });
      if (res?.url) { window.location.href = res.url; return; }
    } catch (err) {
      console.error('Strava auth error:', err);
    }
    setStravaBusy(false);
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
          <h2 className="font-heading font-black text-3xl text-white mb-4">I am...</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'male', label: 'MALE', symbol: '♂' },
              { val: 'female', label: 'FEMALE', symbol: '♀' },
            ].map(({ val, label, symbol }) => {
              const selected = gender === val;
              return (
                <button key={val} onClick={() => pickGender(val)}
                  className="rounded-2xl py-10 flex flex-col items-center gap-3 transition-all active:scale-95"
                  style={{
                    backgroundColor: selected ? 'rgba(244, 176, 68,0.10)' : '#112532',
                    border: `2px solid ${selected ? '#F4B044' : '#24455A'}`,
                  }}>
                  <span className="text-4xl leading-none" style={{ color: selected ? '#F4B044' : '#88A5B7' }}>{symbol}</span>
                  <span className="font-heading font-black text-lg" style={{ color: selected ? '#F4B044' : '#FFFFFF' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    // 1 — Class pick
    {
      mascotText: 'Choose your class, champion! You can change it anytime.',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-4">Choose your class</h2>
          <div className="grid grid-cols-2 gap-3">
            {AVATAR_CLASSES.map(cls => {
              const selected = avatarClass === cls;
              const cc = CLASS_COLORS[cls];
              return (
                <button key={cls} onClick={() => setAvatarClass(cls)}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                  style={{
                    backgroundColor: selected ? `${cc.glow}14` : '#112532',
                    border: `2px solid ${selected ? cc.glow : '#24455A'}`,
                  }}>
                  <Avatar avatarClass={cls} tier={2} body={body} skinTone={skinTone} hair={hair} size={72} animate={false} />
                  <span className="font-heading font-black text-base" style={{ color: selected ? cc.glow : '#FFFFFF' }}>
                    {CLASS_LABELS[cls]}
                  </span>
                  <span className="font-body text-[10px] text-center leading-tight" style={{ color: '#88A5B7' }}>
                    {CLASS_TAGLINES[cls]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    // 2 — Age
    {
      mascotText: 'How old are you?',
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={age} onChange={setAge} min={16} max={100} unit="yrs" />
        </div>
      ),
    },
    // 3 — Weight
    {
      mascotText: "What's your current weight?",
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={weightKg} onChange={setWeightKg} min={30} max={200} unit="kg" />
          {bmi && (
            <div className="mt-4 px-5 py-3 rounded-2xl w-full" style={{ backgroundColor: '#112532', border: '1px solid #24455A' }}>
              <p className="font-body text-sm text-center" style={{ color: '#88A5B7' }}>
                ⓘ Your BMI is <span className="text-white font-semibold">{bmi}</span> — <span style={{ color: 'var(--gf-gold-text)' }}>{bmiLabel}</span>
              </p>
            </div>
          )}
        </div>
      ),
    },
    // 4 — Height
    {
      mascotText: "How tall are you?",
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={heightCm} onChange={setHeightCm} min={120} max={220} unit="cm" />
        </div>
      ),
    },
    // 5 — Fitness Goal
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
    // 6 — Experience
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
    // 7 — Weekly target
    {
      mascotText: 'How many days a week will you train? Be honest — streaks are won by realists!',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-4">My weekly target</h2>
          {[
            { val: 2, label: '2 days / week', sub: 'Easing in', emoji: '🌱' },
            { val: 3, label: '3 days / week', sub: 'Solid habit', emoji: '💪' },
            { val: 4, label: '4 days / week', sub: 'Committed', emoji: '🔥' },
            { val: 5, label: '5+ days / week', sub: 'All in', emoji: '🏆' },
          ].map(({ val, label, sub, emoji }) => (
            <OptionRow key={val} label={label} sublabel={sub} emoji={emoji}
              selected={weeklyGoal === val} onSelect={() => setWeeklyGoal(val)} />
          ))}
        </div>
      ),
    },
    // 8 — Look customizer + reveal
    {
      mascotText: null,
      content: (
        <div className="w-full flex flex-col items-center">
          <motion.div className="w-full" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
            <h2 className="font-heading font-black text-3xl text-white text-center mb-2">Make it yours</h2>
            <p className="font-body text-sm text-center mb-5" style={{ color: '#88A5B7' }}>
              Your avatar grows as you get stronger!
            </p>
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-3xl relative overflow-hidden"
                style={{ backgroundColor: '#112532', border: '2px solid #F4B044' }}>
                <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 50% 40%, #F4B044, transparent 60%)' }} />
                <Avatar avatarClass={avatarClass || 'warrior'} body={body} skinTone={skinTone} hair={hair} size={150} tier={1} />
              </div>
            </div>

            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#88A5B7' }}>Skin tone</p>
            <div className="flex gap-2.5 justify-center mb-4">
              {Object.keys(SKIN_TONES).map(s => (
                <button key={s} onClick={() => setSkinTone(s)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: SKIN_TONES[s].base, border: `3px solid ${skinTone === s ? '#F4B044' : 'transparent'}` }}>
                  {skinTone === s && <Check size={13} color="white" strokeWidth={3} />}
                </button>
              ))}
            </div>

            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#88A5B7' }}>Hair</p>
            <div className="flex gap-2 mb-3">
              {hairStylesFor(body).map(style => {
                const cur = hair.split('_');
                const selected = cur[0] === style;
                return (
                  <button key={style} onClick={() => setHair(`${style}_${cur[1] || 'black'}`)}
                    className="flex-1 py-2 rounded-xl font-body font-medium text-xs capitalize transition-all"
                    style={{ backgroundColor: selected ? '#F4B044' : '#112532', color: selected ? '#0B1A24' : '#88A5B7', border: `1px solid ${selected ? '#F4B044' : '#24455A'}` }}>
                    {style}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2.5 justify-center">
              {Object.keys(HAIR_COLORS).map(c => {
                const cur = hair.split('_');
                const selected = (cur[1] || 'black') === c;
                return (
                  <button key={c} onClick={() => setHair(`${cur[0] || 'short'}_${c}`)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{ backgroundColor: HAIR_COLORS[c].base, border: `3px solid ${selected ? '#F4B044' : 'transparent'}` }}>
                    {selected && <Check size={13} color="white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      ),
    },
    // 9 — Health Integrations
    {
      mascotText: null,
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-2xl text-white mb-1">Health Connect</h2>
          <p className="font-body text-sm mb-5" style={{ color: '#88A5B7' }}>
            Connect your health apps to automatically sync your fitness data with GameFit.
          </p>
          <HealthIntegrations onConnectStrava={connectStrava} stravaBusy={stravaBusy} />
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 pt-12" style={{ backgroundColor: '#0B1A24' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {step > 0 ? (
          <button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1A3242' }}>
            <ChevronLeft size={18} color="#88A5B7" />
          </button>
        ) : <div className="w-9" />}
        <div className="flex-1">
          <ProgressBar current={step + 1} total={TOTAL_STEPS} />
        </div>
      </div>

      {/* Mascot + Bubble */}
      {step !== 8 && step !== 9 && (
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
            backgroundColor: canProceed() ? '#F4B044' : '#24455A',
            color: canProceed() ? '#0B1A24' : '#4A5065',
          }}>
          {saving ? 'Setting up your profile...' : isLast ? "Let's Go! 🚀" : 'NEXT'}
          {!saving && !isLast && <ChevronRight size={22} />}
        </button>
        {isLast && (
          <button onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3 font-body text-sm" style={{ color: '#4A5065' }}>
            Continue without connecting
          </button>
        )}
      </div>
    </div>
  );
}
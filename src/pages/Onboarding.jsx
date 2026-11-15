import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, Footprints, Heart, Zap, Watch, Salad,
  Dumbbell, Weight, Flame, Star, Sprout, TrendingUp, Activity, Trophy,
  Mars, Venus,
} from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { invokeFunction } from '@/api/supabase';
import AthleteAvatar from '@/components/avatar/AthleteAvatar';
import CoachLine from '@/components/brand/CoachLine';
import { COACH_NAME } from '@/lib/coach';
import {
  ATHLETES, getAthlete, athleteForConfig, configForAthlete, disciplineOf,
} from '@/components/avatar/athletes';

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-1.5 rounded-full mb-6" style={{ backgroundColor: '#2E2E33' }}>
      <motion.div className="h-full rounded-full" style={{ backgroundColor: '#F4B044' }}
        animate={{ width: `${(current / total) * 100}%` }} transition={{ duration: 0.4 }} />
    </div>
  );
}

// ── Option Row ────────────────────────────────────────────────────────────────
function OptionRow({ label, sublabel, Icon, selected, onSelect }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3 transition-all active:scale-98"
      style={{
        backgroundColor: selected ? 'rgba(244, 176, 68,0.10)' : '#1E1E21',
        border: `1.5px solid ${selected ? '#F4B044' : '#2E2E33'}`,
      }}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={19} strokeWidth={2.1} style={{ color: selected ? '#F4B044' : '#A1A1AA' }} aria-hidden="true" />}
        <span className="font-body font-semibold text-base text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {sublabel && <span className="font-body text-sm" style={{ color: '#A1A1AA' }}>{sublabel}</span>}
        {selected && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F4B044' }}>
          <Check size={12} color="#141416" strokeWidth={3} />
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
                  {unit && <span className="font-body font-semibold text-xl" style={{ color: '#A1A1AA' }}>{unit}</span>}
                </div>
              ) : (
                <span className="font-heading font-black text-2xl" style={{ color: '#52525B' }}>{v}</span>
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
// Every integration is on the roadmap and says so. Strava's OAuth is fully
// built (connectStrava below, plus the strava-auth Edge Function and the
// /strava-callback route) and is held behind this one flag - flip comingSoon
// back to false to re-enable it, no other change needed.
//
// Nothing here writes a "Connected ✓" string on its own: a bare string with no
// token behind it would show up as a phantom connection on the Avatar screen's
// Connect tab, which tracks real tokens.
const HEALTH_APPS = [
  { id: 'strava',       name: 'Strava',       Icon: Footprints, color: '#FC4C02', desc: 'Sync runs, rides & activities', comingSoon: true },
  { id: 'apple_health', name: 'Apple Health', Icon: Heart, color: '#FF2D55', desc: 'Steps, heart rate & workouts',  comingSoon: true },
  { id: 'whoop',        name: 'WHOOP',        Icon: Zap, color: '#CDF000', desc: 'Recovery & strain data',        comingSoon: true },
  { id: 'garmin',       name: 'Garmin',       Icon: Watch, color: '#007CC3', desc: 'GPS & performance tracking',    comingSoon: true },
];

function HealthIntegrations({ onConnectStrava, stravaBusy }) {
  return (
    <div className="w-full">
      {HEALTH_APPS.map(app => (
        <button key={app.id} onClick={app.comingSoon ? undefined : onConnectStrava}
          disabled={app.comingSoon || stravaBusy}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-98"
          style={{
            backgroundColor: '#1E1E21',
            border: '1.5px solid #2E2E33',
            opacity: app.comingSoon ? 0.55 : 1,
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${app.color}20` }}>
              <app.Icon size={18} strokeWidth={2.1} style={{ color: app.color }} aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="font-body font-semibold text-sm text-white">{app.name}</p>
              <p className="font-body text-xs" style={{ color: '#A1A1AA' }}>{app.desc}</p>
            </div>
          </div>
          {app.comingSoon ? (
            <span className="text-xs font-body font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: '#2E2E33', color: '#A1A1AA' }}>
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
  const [athleteId, setAthleteId] = useState(null);
  const [stravaBusy, setStravaBusy] = useState(false);

  const bmi = weightKg && heightCm ? (weightKg / ((heightCm / 100) ** 2)).toFixed(1) : null;
  const bmiLabel = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese') : '';

  // Gender only orders the athlete list: people matching it come first.
  // Anyone can pick any athlete, here or later from the Avatar screen.
  const body = gender === 'female' ? 'female' : 'male';
  const pickGender = (g) => setGender(g);
  const athleteOrder = [...ATHLETES].sort((a, b) => (b.body === body) - (a.body === body));
  const chosen = getAthlete(athleteId) || athleteForConfig({ body });

  const canProceed = () => {
    if (step === 0) return !!gender;
    if (step === 1) return !!athleteId;
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
      avatar_config: configForAthlete(chosen.id),
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
      if (res?.url) {
        // Remember the CSRF state so the callback can verify this browser
        // started the flow before it exchanges the returned code.
        if (res.state) sessionStorage.setItem('strava_oauth_state', res.state);
        window.location.href = res.url;
        return;
      }
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
      mascotText: `Hi, I'm ${COACH_NAME}. Let's get some basic info down.`,
      pose: 'wave',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-4">I am...</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              // Drawn marks rather than U+2642/U+2640: the display faces do not
              // guarantee coverage of those codepoints, and a fallback-font glyph
              // at 4xl is very visible when it lands.
              { val: 'male', label: 'MALE', Icon: Mars },
              { val: 'female', label: 'FEMALE', Icon: Venus },
            ].map(({ val, label, Icon }) => {
              const selected = gender === val;
              return (
                <button key={val} onClick={() => pickGender(val)}
                  className="rounded-2xl py-10 flex flex-col items-center gap-3 transition-all active:scale-95"
                  style={{
                    backgroundColor: selected ? 'rgba(244, 176, 68,0.10)' : '#1E1E21',
                    border: `2px solid ${selected ? '#F4B044' : '#2E2E33'}`,
                  }}>
                  <Icon size={38} strokeWidth={2} style={{ color: selected ? '#F4B044' : '#A1A1AA' }} aria-hidden="true" />
                  <span className="font-heading font-black text-lg" style={{ color: selected ? '#F4B044' : '#FFFFFF' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    // 1 — Athlete pick. Ten preset people; the ones matching the gender
    // picked on step 0 come first, but every athlete is open to everyone.
    {
      mascotText: 'Pick the athlete you train as. You can change this anytime.',
      pose: 'present',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-4">Choose your athlete</h2>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose your athlete">
            {athleteOrder.map(a => {
              const selected = athleteId === a.id;
              return (
                <button key={a.id} type="button" role="radio" aria-checked={selected}
                  onClick={() => setAthleteId(a.id)}
                  className="rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                  style={{
                    backgroundColor: selected ? 'rgba(244, 176, 68,0.10)' : '#1E1E21',
                    border: `2px solid ${selected ? '#F4B044' : '#2E2E33'}`,
                  }}>
                  <AthleteAvatar athleteId={a.id} tier={1} size={96} frame={false} />
                  <span className="font-heading font-black text-base leading-tight" style={{ color: selected ? '#F4B044' : '#FFFFFF' }}>
                    {a.name}
                  </span>
                  <span className="font-body text-[11px] leading-tight" style={{ color: '#A1A1AA' }}>
                    {disciplineOf(a)} · {a.age}
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
      pose: 'listen',
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={age} onChange={setAge} min={16} max={100} unit="yrs" />
        </div>
      ),
    },
    // 3 — Weight
    {
      mascotText: "What's your current weight?",
      pose: 'point',
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={weightKg} onChange={setWeightKg} min={30} max={200} unit="kg" />
          {bmi && (
            <div className="mt-4 px-5 py-3 rounded-2xl w-full" style={{ backgroundColor: '#1E1E21', border: '1px solid #2E2E33' }}>
              <p className="font-body text-sm text-center" style={{ color: '#A1A1AA' }}>
                ⓘ Your BMI is <span className="text-white font-semibold">{bmi}</span> — <span style={{ color: 'var(--gf-gold-text)' }}>{bmiLabel}</span>
              </p>
            </div>
          )}
        </div>
      ),
    },
    // 4 — Height
    {
      mascotText: 'How tall are you?',
      pose: 'reach',
      content: (
        <div className="w-full flex flex-col items-center">
          <ScrollPicker value={heightCm} onChange={setHeightCm} min={120} max={220} unit="cm" />
        </div>
      ),
    },
    // 5 — Fitness Goal
    {
      mascotText: 'What is your top fitness goal?',
      pose: 'idea',
      content: (
        <div className="w-full">
          {[
            { val: 'Lose weight and get lean',   Icon: Salad,      sub: 'Fat loss' },
            { val: 'Build muscle mass',           Icon: Dumbbell,   sub: 'Hypertrophy' },
            { val: 'Become stronger',             Icon: Weight,     sub: 'Strength' },
            { val: 'Improve endurance',           Icon: Footprints, sub: 'Cardio' },
            { val: 'Become more consistent',      Icon: Flame,      sub: 'Habits' },
            { val: 'General fitness',             Icon: Star,       sub: 'Stay active' },
          ].map(({ val, Icon, sub }) => (
            <OptionRow key={val} label={val} sublabel={sub} Icon={Icon}
              selected={fitnessGoal === val} onSelect={() => setFitnessGoal(val)} />
          ))}
        </div>
      ),
    },
    // 6 — Experience
    {
      mascotText: 'How experienced are you with working out?',
      pose: 'think',
      content: (
        <div className="w-full">
          {[
            { val: 'Beginner', label: "I've never worked out", sub: 'Starter', Icon: Sprout },
            { val: 'Novice',   label: 'Beginner – Tried it before', sub: 'Learning', Icon: TrendingUp },
            { val: 'Intermediate', label: 'Intermediate – Regular training', sub: 'Consistent', Icon: Activity },
            { val: 'Advanced', label: 'Advanced – Years of experience', sub: 'Elite', Icon: Trophy },
          ].map(({ val, label, sub, Icon }) => (
            <OptionRow key={val} label={label} sublabel={sub} Icon={Icon}
              selected={fitnessLevel === val} onSelect={() => setFitnessLevel(val)} />
          ))}
        </div>
      ),
    },
    // 7 — Weekly target
    {
      mascotText: 'How many days a week will you train? Be honest: streaks are won by realists.',
      pose: 'thumbsUp',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-3xl text-white mb-4">My weekly target</h2>
          {[
            { val: 2, label: '2 days / week', sub: 'Easing in', Icon: Sprout },
            { val: 3, label: '3 days / week', sub: 'Solid habit', Icon: Dumbbell },
            { val: 4, label: '4 days / week', sub: 'Committed', Icon: Flame },
            { val: 5, label: '5+ days / week', sub: 'All in', Icon: Trophy },
          ].map(({ val, label, sub, Icon }) => (
            <OptionRow key={val} label={label} sublabel={sub} Icon={Icon}
              selected={weeklyGoal === val} onSelect={() => setWeeklyGoal(val)} />
          ))}
        </div>
      ),
    },
    // 8 — Meet your athlete (replaced the skin and hair customiser)
    {
      mascotText: `Good pick. ${chosen.name} is ready when you are.`,
      pose: 'clap',
      content: (
        <div className="w-full flex flex-col items-center">
          <motion.div className="w-full" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
            <h2 className="font-heading font-black text-3xl text-white text-center mb-2">Meet {chosen.name}</h2>
            <p className="font-body text-sm text-center mb-5" style={{ color: '#A1A1AA' }}>
              {disciplineOf(chosen)}, {chosen.age}. {chosen.line}
            </p>
            <div className="flex justify-center mb-5">
              <AthleteAvatar athleteId={chosen.id} tier={1} moment="celebrate" size={170} priority />
            </div>
            <p className="font-body text-sm text-center" style={{ color: '#A1A1AA' }}>
              Every workout moves you up the ranks, from Beginner to Elite.
              At Elite, {chosen.name} switches to the elite kit.
            </p>
          </motion.div>
        </div>
      ),
    },
    // 9 — Health Integrations
    {
      mascotText: 'Sync your workouts from a health app, or skip this for now.',
      pose: 'run',
      content: (
        <div className="w-full">
          <h2 className="font-heading font-black text-2xl text-white mb-1">Health Connect</h2>
          <p className="font-body text-sm mb-5" style={{ color: '#A1A1AA' }}>
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
    <div className="min-h-screen flex flex-col px-5 pb-8 pt-12" style={{ backgroundColor: '#141416' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {step > 0 ? (
          <button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#28282C' }}>
            <ChevronLeft size={18} color="#A1A1AA" />
          </button>
        ) : <div className="w-9" />}
        <div className="flex-1">
          <ProgressBar current={step + 1} total={TOTAL_STEPS} />
        </div>
      </div>

      {/* The coach. It stays mounted across steps, so each new pose eases
          in from the last one instead of the figure popping in again, and
          it talks while the line types out. */}
      <CoachLine text={currentStep.mascotText} pose={currentStep.pose} size={64} tone="dark" className="mb-5" />

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
          className={`w-full py-4 rounded-2xl font-heading font-black text-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${canProceed() ? 'gf-cta' : ''}`}
          style={canProceed() ? undefined : { backgroundColor: '#2E2E33', color: '#8A8A93' }}>
          {saving ? 'Setting up your profile...' : isLast ? "Let's Go!" : 'NEXT'}
          {!saving && !isLast && <ChevronRight size={22} />}
        </button>
        {isLast && (
          <button onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3 font-body text-sm" style={{ color: '#52525B' }}>
            Continue without connecting
          </button>
        )}
      </div>
    </div>
  );
}
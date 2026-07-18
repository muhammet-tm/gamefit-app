import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, Check, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameFit } from '@/lib/GameFitContext';
import { calcXP, calcCoins } from '@/lib/mockData';
import { validate, workoutDurationSchema } from '@/lib/validation';
import { BADGES } from '@/lib/badges';
import UserAvatar from '@/components/avatar/UserAvatar';
import BottomNav from '@/components/gamefit/BottomNav';
import QuickStartTemplates from '@/components/gamefit/QuickStartTemplates';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';

// gentle number count-up (interval-based so it works even in throttled tabs)
function useCountUp(target, duration = 900, run = true) {
  const [value, setValue] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) { setValue(target); return; }
    if (!target) { setValue(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target, duration, run]);
  return value;
}

const EXERCISE_TYPES = ['Running','Cycling','Weight Training','Swimming','Yoga','HIIT','Boxing','Basketball','Football','Walking','Other'];
const DURATION_PRESETS = [15, 30, 45, 60, 90];
const INTENSITIES = [
  { label: 'Low', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', multiplier: '×1' },
  { label: 'Medium', color: '#FFB800', bg: 'rgba(255,184,0,0.15)', multiplier: '×1.5' },
  { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', multiplier: '×2' },
];
const EXERCISE_EMOJI = { 'Running':'🏃','Cycling':'🚴','Weight Training':'🏋️','Swimming':'🏊','Yoga':'🧘','HIIT':'⚡','Boxing':'🥊','Basketball':'🏀','Football':'⚽','Walking':'🚶','Other':'💪' };

export default function Train() {
  const navigate = useNavigate();
  const { addWorkout, lastWorkoutResult, user } = useGameFit();
  const [exerciseType, setExerciseType] = useState('Weight Training');
  const [duration, setDuration] = useState(45);
  const [customDuration, setCustomDuration] = useState('');
  const [intensity, setIntensity] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [phase, setPhase] = useState('setup'); // 'setup' | 'timer' | 'complete'
  const [timeLeft, setTimeLeft] = useState(0);
  const [xpGain, setXpGain] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [durationError, setDurationError] = useState('');
  const intervalRef = useRef(null);

  const activeDuration = customDuration ? parseInt(customDuration) : duration;
  const previewXP = calcXP(activeDuration || 0, intensity);
  const previewCoins = calcCoins(previewXP);

  const startWorkout = () => {
    setDurationError('');
    const res = validate(workoutDurationSchema, activeDuration || 0);
    if (!res.ok) {
      setDurationError(res.message);
      return;
    }
    setTimeLeft(res.data * 60);
    setPhase('timer');
  };

  useEffect(() => {
    if (phase === 'timer') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            finishWorkout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const finishWorkout = () => {
    clearInterval(intervalRef.current);
    const xp = calcXP(activeDuration, intensity);
    const coins = calcCoins(xp);
    // optimistic preview — the server computes the real numbers and the
    // context reconciles; if it rejects (e.g. daily cap), tell the user
    addWorkout({
      exercise_type: exerciseType, duration_min: activeDuration,
      intensity_level: intensity, notes, xp_earned: xp, coins_earned: coins,
    }).catch(err => setSaveError(err.message || 'Could not save your workout. Please try again.'));
    setXpGain({ xp, coins });
    setPhase('complete');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalSecs = (activeDuration || 1) * 60;
  const progress = phase === 'timer' ? (totalSecs - timeLeft) / totalSecs : 0;

  if (phase === 'timer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: '#0D0F14' }}>
        <p className="font-heading font-black text-xl mb-2" style={{ color: '#8A8F9E' }}>
          {EXERCISE_EMOJI[exerciseType]} {exerciseType}
        </p>
        <p className="font-body text-sm mb-8" style={{ color: '#8A8F9E' }}>{intensity} intensity</p>

        {/* Circular timer */}
        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1E2330" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#C8FF00" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-heading font-black text-5xl text-white">{formatTime(timeLeft)}</p>
            <p className="font-body text-xs mt-1" style={{ color: '#8A8F9E' }}>remaining</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={finishWorkout}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-heading font-black text-lg"
            style={{ backgroundColor: '#C8FF00', color: '#0D0F14' }}>
            <Check size={20} /> Finish Early
          </button>
          <button onClick={() => { clearInterval(intervalRef.current); setPhase('setup'); }}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-heading font-black text-lg"
            style={{ backgroundColor: '#1E2330', color: '#8A8F9E', border: '1px solid #2A2F3A' }}>
            <Square size={20} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete' && xpGain) {
    // prefer the server-confirmed numbers once they arrive
    const confirmed = lastWorkoutResult?.workout;
    const shownXP = confirmed?.xp_earned ?? xpGain.xp;
    const shownCoins = confirmed?.coins_earned ?? xpGain.coins;
    const streak = lastWorkoutResult?.user?.current_streak ?? user.current_streak;
    const newBadges = (lastWorkoutResult?.new_badges || [])
      .map(id => BADGES.find(b => b.id === id))
      .filter(Boolean);
    return (
      <CompletionScreen
        xp={shownXP} coins={shownCoins} streak={streak}
        newBadges={newBadges} saveError={saveError}
        duration={activeDuration} exerciseType={exerciseType}
        user={user} onDone={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title="Log Workout"
        subtitle="Track your fitness session"
      />

      <div className="px-5 pt-5 space-y-6">
        {/* Quick Start */}
        <QuickStartTemplates onLaunch={(t) => {
          setExerciseType(t.exercise_type);
          setDuration(t.duration_min);
          setCustomDuration('');
          setIntensity(t.intensity);
        }} />

        {/* Exercise Type */}
        <div>
          <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Exercise Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EXERCISE_TYPES.map(type => (
              <button key={type} onClick={() => setExerciseType(type)}
                className="px-2 py-2.5 rounded-xl font-body text-xs font-medium transition-all active:scale-95 text-center"
                style={{
                  backgroundColor: exerciseType === type ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
                  color: exerciseType === type ? '#0D0F14' : 'var(--gf-text-secondary)',
                  border: `1px solid ${exerciseType === type ? 'var(--gf-green)' : 'var(--gf-border)'}`,
                }}>
                {EXERCISE_EMOJI[type]} {type}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Duration</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {DURATION_PRESETS.map(d => (
              <button key={d} onClick={() => { setDuration(d); setCustomDuration(''); }}
                className="px-4 py-2 rounded-xl font-body font-medium text-sm transition-all"
                style={{
                  backgroundColor: duration === d && !customDuration ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
                  color: duration === d && !customDuration ? '#0D0F14' : 'var(--gf-text-secondary)',
                  border: `1px solid ${duration === d && !customDuration ? 'var(--gf-green)' : 'var(--gf-border)'}`,
                }}>
                {d} min
              </button>
            ))}
          </div>
          <input
            type="number" min="1" max="600" placeholder="Custom (mins)"
            value={customDuration}
            onChange={e => { setCustomDuration(e.target.value); setDuration(0); }}
            className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-colors"
            style={{ 
              backgroundColor: 'var(--gf-bg-elevated)', 
              color: 'var(--gf-text-primary)', 
              border: `1px solid ${customDuration ? 'var(--gf-green)' : 'var(--gf-border)'}` 
            }}
          />
        </div>

        {/* Intensity */}
        <div>
          <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Intensity</label>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map(int => (
              <button key={int.label} onClick={() => setIntensity(int.label)}
                className="py-3 rounded-xl font-heading font-black text-base transition-all active:scale-95"
                style={{
                  backgroundColor: intensity === int.label ? int.bg : 'var(--gf-bg-elevated)',
                  color: intensity === int.label ? int.color : 'var(--gf-text-secondary)',
                  border: `1.5px solid ${intensity === int.label ? int.color : 'var(--gf-border)'}`,
                }}>
                {int.label}
                <span className="block text-xs opacity-70">{int.multiplier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-heading font-black text-base mb-3 block" style={{ color: 'var(--gf-text-primary)' }}>Notes (optional)</label>
          <textarea rows={3} placeholder="What did you work on today?"
            value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none resize-none transition-colors"
            style={{ 
              backgroundColor: 'var(--gf-bg-elevated)', 
              color: 'var(--gf-text-primary)', 
              border: '1px solid var(--gf-border)',
              borderColor: notes ? 'var(--gf-green)' : 'var(--gf-border)'
            }} />
        </div>

        {/* XP Preview */}
        <div className="rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.3)' }}>
          <div>
            <p className="font-body text-sm mb-0.5" style={{ color: '#8A8F9E' }}>You'll earn</p>
            <p className="font-heading font-black text-2xl" style={{ color: '#C8FF00' }}>+{previewXP} XP</p>
          </div>
          <div className="text-right">
            <p className="font-body text-sm mb-0.5" style={{ color: '#8A8F9E' }}>and</p>
            <p className="font-heading font-black text-2xl" style={{ color: '#FFB800' }}>🪙 {previewCoins}</p>
          </div>
        </div>

        {/* Start Button */}
        {durationError && (
          <div className="mb-3 px-4 py-3 rounded-xl text-sm font-body"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {durationError}
          </div>
        )}
        <button onClick={startWorkout}
          disabled={!activeDuration}
          className="w-full py-4 rounded-2xl font-heading font-black text-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: activeDuration ? 'var(--gf-green)' : 'var(--gf-border)', color: activeDuration ? '#0D0F14' : 'var(--gf-text-secondary)' }}>
          <Play size={22} /> Start Workout
        </button>
      </div>
      </ScreenTransition>

      <BottomNav />
    </div>
  );
}

function CompletionScreen({ xp, coins, streak, newBadges, saveError, duration, exerciseType, user, onDone }) {
  const xpShown = useCountUp(xp, 900, !saveError);
  const coinsShown = useCountUp(coins, 900, !saveError);

  useEffect(() => {
    if (saveError) return;
    // two quick bursts in brand colors
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.35 }, colors: ['#C8FF00', '#FFB800', '#9664FF'] });
    const t = setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { y: 0.3 }, colors: ['#C8FF00', '#FFFFFF'] }), 350);
    return () => clearTimeout(t);
  }, [saveError]);

  const EXERCISE_EMOJI_LOCAL = { 'Running':'🏃','Cycling':'🚴','Weight Training':'🏋️','Swimming':'🏊','Yoga':'🧘','HIIT':'⚡','Boxing':'🥊','Basketball':'🏀','Football':'⚽','Walking':'🚶','Other':'💪' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ backgroundColor: '#0D0F14' }}>
      <motion.div className="text-center w-full max-w-sm" initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>

        {/* the avatar celebrates with you */}
        <motion.div className="flex justify-center mb-2"
          initial={{ y: 14 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 8, delay: 0.15 }}>
          <UserAvatar user={user} size={110} />
        </motion.div>

        <h2 className="font-heading font-black text-4xl text-white mb-1">
          {saveError ? 'Not Saved' : 'Workout Complete!'}
        </h2>
        <p className="font-body mb-6" style={{ color: '#8A8F9E' }}>
          {EXERCISE_EMOJI_LOCAL[exerciseType]} {duration} min {exerciseType}
        </p>

        {saveError ? (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm font-body"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {saveError}
          </div>
        ) : (
          <>
            {/* counters */}
            <div className="flex gap-3 justify-center mb-4">
              <div className="flex-1 px-4 py-4 rounded-2xl" style={{ backgroundColor: '#1E2330', border: '1px solid rgba(200,255,0,0.3)' }}>
                <p className="font-heading font-black text-3xl" style={{ color: '#C8FF00' }}>+{xpShown}</p>
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8F9E' }}>XP EARNED</p>
              </div>
              <div className="flex-1 px-4 py-4 rounded-2xl" style={{ backgroundColor: '#1E2330', border: '1px solid rgba(255,184,0,0.3)' }}>
                <p className="font-heading font-black text-3xl" style={{ color: '#FFB800' }}>🪙 {coinsShown}</p>
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8F9E' }}>COINS</p>
              </div>
            </div>

            {/* streak */}
            <motion.div className="flex items-center justify-center gap-2 mb-4 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Flame size={18} color="#FFB800" fill="#FFB800" />
              <span className="font-heading font-black text-lg" style={{ color: '#FFB800' }}>
                {streak} day streak
              </span>
            </motion.div>

            {/* badge unlocks */}
            {newBadges.map((b, i) => (
              <motion.div key={b.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 text-left"
                style={{ backgroundColor: 'rgba(150,100,255,0.1)', border: '1px solid rgba(150,100,255,0.4)' }}
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.15 }}>
                <span className="text-3xl">{b.emoji}</span>
                <div>
                  <p className="font-heading font-black text-sm" style={{ color: '#9664FF' }}>BADGE UNLOCKED</p>
                  <p className="font-body text-sm text-white">{b.label} — {b.desc}</p>
                </div>
              </motion.div>
            ))}
          </>
        )}

        <button onClick={onDone}
          className="w-full py-4 rounded-2xl font-heading font-black text-xl mt-2"
          style={{ backgroundColor: '#C8FF00', color: '#0D0F14' }}>
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

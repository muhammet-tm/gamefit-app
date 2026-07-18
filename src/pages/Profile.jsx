import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Shield, LogOut, Trash2, ChevronRight } from 'lucide-react';
import ActionSheet, { SelectTrigger } from '@/components/gamefit/ActionSheet';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import { useGameFit } from '@/lib/GameFitContext';
import { validate, profileSchema } from '@/lib/validation';
import { LEVEL_TITLES } from '@/lib/mockData';
import BottomNav from '@/components/gamefit/BottomNav';
import PremiumModal from '@/components/gamefit/PremiumModal';
import BadgeGrid from '@/components/gamefit/BadgeGrid';
import { format } from 'date-fns';

const FITNESS_GOALS = ['Lose Weight', 'Build Muscle', 'Improve Endurance', 'Stay Active', 'General Fitness'];

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout, theme, toggleTheme, workouts } = useGameFit();
  const [showPremium, setShowPremium] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    fitness_goal: user.fitness_goal,
    age: user.age || '',
    height_cm: user.height_cm || '',
    weight_kg: user.weight_kg || '',
  });
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [showGoalSheet, setShowGoalSheet] = useState(false);

  const isPremium = user.account_type === 'premium';
  const bmi = form.height_cm && form.weight_kg
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : '—';

  const title = LEVEL_TITLES[user.current_level] || 'Recruit';
  const joinedDate = user.joined_at ? format(new Date(user.joined_at), 'MMM yyyy') : 'Jan 2024';

  const handleSave = () => {
    setFormError('');
    const res = validate(profileSchema, {
      first_name: form.first_name,
      last_name: form.last_name || '',
      age: form.age,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
    });
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    // Explicitly whitelist only safe profile fields — never spread form directly
    updateUser({
      ...res.data,
      fitness_goal: form.fitness_goal,
      bmi: parseFloat(bmi) || user.bmi,
    });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const inputCls = "w-full px-4 py-3 rounded-xl font-body text-sm outline-none";
  const inputStyle = { backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' };

  const stats = [
    { label: 'Total XP', value: user.total_xp.toLocaleString() },
    { label: 'Total Workouts', value: workouts.length },
    { label: 'Best Streak', value: `${user.best_streak} days` },
    { label: 'Current Streak', value: `${user.current_streak} days` },
    { label: 'All-Time Coins', value: `🪙 ${user.coins}` },
  ];

  return (
    <div className="min-h-screen pb-48" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title={`${user.first_name} ${user.last_name}`}
        subtitle={`${title} · Since ${joinedDate}`}
        showBackButton={false}
        rightAction={isPremium && (
          <span className="px-2 py-1 rounded-lg font-body text-xs font-bold"
            style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: 'var(--gf-purple)' }}>
            ⚡ PRO
          </span>
        )}
      />

      <div className="px-5 pt-5 space-y-5">
        {/* Theme toggle */}
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} color="var(--gf-purple)" /> : <Sun size={18} color="var(--gf-amber)" />}
            <span className="font-body font-medium text-sm" style={{ color: 'var(--gf-text-primary)' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <button onClick={toggleTheme}
            className="relative w-12 h-6 rounded-full transition-all"
            style={{ backgroundColor: theme === 'dark' ? 'var(--gf-purple)' : 'var(--gf-green)' }}>
            <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white"
              animate={{ left: theme === 'dark' ? 26 : 4 }} transition={{ type: 'spring', damping: 15 }} />
          </button>
        </div>

        {/* Profile fields */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>Profile</h3>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className="px-4 py-1.5 rounded-xl font-body text-sm font-medium transition-all"
              style={{ backgroundColor: editing ? 'var(--gf-green)' : 'var(--gf-bg-elevated)', color: editing ? '#0D0F14' : 'var(--gf-text-secondary)' }}>
              {saved ? '✓ Saved!' : editing ? 'Save' : 'Edit'}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {formError && editing && (
              <div className="px-4 py-3 rounded-xl text-sm font-body"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {formError}
              </div>
            )}
            <div className="flex gap-3">
              {['first_name', 'last_name'].map(k => (
                <div key={k} className="flex-1">
                  <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>
                    {k === 'first_name' ? 'First Name' : 'Last Name'}
                  </p>
                  <input className={inputCls} style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                    disabled={!editing} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div>
                <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Fitness Goal</p>
                <SelectTrigger 
                  value={form.fitness_goal}
                  label="Select goal"
                  onClick={() => editing && setShowGoalSheet(true)}
                  disabled={!editing}
                />
              </div>

            <div className="grid grid-cols-3 gap-3">
              {[['age', 'Age'], ['height_cm', 'Height (cm)'], ['weight_kg', 'Weight (kg)']].map(([k, label]) => (
                <div key={k}>
                  <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>{label}</p>
                  <input type="number" className={inputCls} style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                    disabled={!editing} value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className="px-4 py-2 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
              <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>BMI (calculated)</span>
              <span className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>{bmi}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>My Stats</h3>
          </div>
          <div className="grid grid-cols-2">
            {stats.map((s, i) => (
              <div key={i} className="p-4"
                style={{ borderBottom: i < 4 ? '1px solid var(--gf-border)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--gf-border)' : 'none' }}>
                <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>{s.label}</p>
                <p className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <BadgeGrid workouts={workouts} user={user} />

        {/* Account */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>Account</h3>
          </div>

          {!isPremium ? (
            <button onClick={() => navigate('/premium')}
              className="w-full px-4 py-3.5 flex items-center justify-between transition-all"
              style={{ borderBottom: '1px solid var(--gf-border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">⚡</span>
                <span className="font-body font-semibold text-sm" style={{ color: 'var(--gf-purple)' }}>Upgrade to Premium</span>
              </div>
              <ChevronRight size={16} color="var(--gf-purple)" />
            </button>
          ) : (
            <div className="px-4 py-3.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--gf-border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">✓</span>
                <span className="font-body font-semibold text-sm" style={{ color: '#22C55E' }}>Premium Active</span>
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--gf-purple)' }}>Manage →</span>
            </div>
          )}

          <button className="w-full px-4 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <div className="flex items-center gap-3">
              <Bell size={16} color="var(--gf-text-secondary)" />
              <span className="font-body font-medium text-sm" style={{ color: 'var(--gf-text-primary)' }}>Notification Settings</span>
            </div>
            <ChevronRight size={16} color="var(--gf-text-secondary)" />
          </button>

          <button className="w-full px-4 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <div className="flex items-center gap-3">
              <Shield size={16} color="var(--gf-text-secondary)" />
              <span className="font-body font-medium text-sm" style={{ color: 'var(--gf-text-primary)' }}>Privacy Policy</span>
            </div>
            <ChevronRight size={16} color="var(--gf-text-secondary)" />
          </button>

          <button onClick={() => setShowLogout(true)}
            className="w-full px-4 py-3.5 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--gf-border)' }}>
            <LogOut size={16} color="#EF4444" />
            <span className="font-body font-medium text-sm" style={{ color: '#EF4444' }}>Sign Out</span>
          </button>

          <button onClick={() => setShowDelete(true)} className="w-full px-4 py-3.5 flex items-center gap-3">
            <Trash2 size={16} color="#EF4444" />
            <span className="font-body text-sm" style={{ color: '#EF4444' }}>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowLogout(false)}>
          <div className="w-full rounded-t-3xl p-6" style={{ backgroundColor: 'var(--gf-bg-surface)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-black text-xl mb-2" style={{ color: 'var(--gf-text-primary)' }}>Sign Out?</h3>
            <p className="font-body text-sm mb-5" style={{ color: 'var(--gf-text-secondary)' }}>You'll need to sign in again to continue.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                style={{ backgroundColor: '#EF4444', color: '#FFF' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowDelete(false)}>
          <div className="w-full rounded-t-3xl p-6" style={{ backgroundColor: 'var(--gf-bg-surface)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-black text-xl mb-2" style={{ color: '#EF4444' }}>Delete Account?</h3>
            <p className="font-body text-sm mb-5" style={{ color: 'var(--gf-text-secondary)' }}>This action is permanent. All your data, XP, and rewards will be lost forever.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3.5 rounded-xl font-heading font-black text-base"
                style={{ backgroundColor: '#EF4444', color: '#FFF' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <ActionSheet
        isOpen={showGoalSheet}
        onClose={() => setShowGoalSheet(false)}
        title="Fitness Goal"
        options={FITNESS_GOALS.map(g => ({
          label: g,
          selected: form.fitness_goal === g,
          onSelect: () => setForm(f => ({ ...f, fitness_goal: g }))
        }))}
      />

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      </ScreenTransition>
    </div>
  );
}
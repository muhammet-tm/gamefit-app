import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Camera, Plus, Trash2, Loader2, Crown, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ActionSheet, { SelectTrigger } from '@/components/gamefit/ActionSheet';

const today = () => new Date().toISOString().split('T')[0];

const MEAL_TYPES = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'];
const MEAL_EMOJIS = {
  'Breakfast': '🌅', 'Morning Snack': '🍎', 'Lunch': '🥗',
  'Afternoon Snack': '🥜', 'Dinner': '🍽️', 'Evening Snack': '🌙',
};

const DEFAULT_GOALS = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

function CalorieRing({ consumed, goal }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="var(--gf-border)" strokeWidth="10" />
        <circle cx="72" cy="72" r={radius} fill="none"
          stroke={over ? '#EF4444' : 'var(--gf-green)'}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-heading font-black text-2xl leading-none" style={{ color: over ? '#EF4444' : 'var(--gf-text-primary)' }}>
          {over ? consumed - goal : remaining}
        </span>
        <span className="font-body text-[10px] mt-0.5" style={{ color: 'var(--gf-text-secondary)' }}>
          {over ? 'over' : 'remaining'}
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, goal, color }) {
  const pct = Math.min((consumed / Math.max(goal, 1)) * 100, 100);
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="font-body text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-body text-[10px]" style={{ color: 'var(--gf-text-secondary)' }}>{Math.round(consumed)}/{goal}g</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

function AddMealModal({ onSave, onClose }) {
  const [form, setForm] = useState({ meal_name: '', meal_type: 'Breakfast', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [showMealTypeSheet, setShowMealTypeSheet] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.meal_name && form.calories;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="w-full max-w-lg rounded-t-3xl p-6 space-y-4 pb-10"
        style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>Add Meal</h3>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--gf-text-secondary)' }} /></button>
        </div>
        <input placeholder="Meal name (e.g. Salmon & Broccoli)" value={form.meal_name}
          onChange={e => set('meal_name', e.target.value)}
          className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none"
          style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }} />
        <div className="grid grid-cols-2 gap-3">
          <SelectTrigger 
            value={form.meal_type}
            label="Meal type"
            onClick={() => setShowMealTypeSheet(true)}
          />
          <input placeholder="Calories *" type="number" value={form.calories} onChange={e => set('calories', e.target.value)}
            className="px-3 py-3 rounded-xl font-body text-sm outline-none"
            style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['protein_g', 'Protein (g)', '#EF4444'], ['carbs_g', 'Carbs (g)', '#3B82F6'], ['fat_g', 'Fat (g)', '#F59E0B']].map(([k, label, color]) => (
            <input key={k} placeholder={label} type="number" value={form[k]} onChange={e => set(k, e.target.value)}
              className="px-3 py-3 rounded-xl font-body text-xs outline-none"
              style={{ backgroundColor: 'var(--gf-bg-elevated)', color, border: `1px solid ${form[k] ? color + '60' : 'var(--gf-border)'}` }} />
          ))}
        </div>
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className="w-full py-4 rounded-2xl font-heading font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
          <Plus size={20} /> Save Meal
        </button>
      </motion.div>

      <ActionSheet
        isOpen={showMealTypeSheet}
        onClose={() => setShowMealTypeSheet(false)}
        title="Meal Type"
        options={MEAL_TYPES.map(t => ({
          label: t,
          selected: form.meal_type === t,
          onSelect: () => set('meal_type', t)
        }))}
      />
    </motion.div>
  );
}

function SnapResultSheet({ result, onSave, onRetry, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-lg rounded-t-3xl pb-10 overflow-hidden"
        style={{ backgroundColor: 'var(--gf-bg-surface)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
        {result.image_url && (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={result.image_url} alt="meal" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, var(--gf-bg-surface) 100%)' }} />
          </div>
        )}
        <div className="px-6 pt-4 space-y-4">
          <div>
            <h3 className="font-heading font-black text-2xl" style={{ color: 'var(--gf-text-primary)' }}>{result.meal_name}</h3>
            {result.health_score && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Health Score</span>
                <div className="flex-1 h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${result.health_score * 10}%`, backgroundColor: '#22C55E' }} />
                </div>
                <span className="font-body text-xs font-bold" style={{ color: '#22C55E' }}>{result.health_score}/10</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl p-4 flex items-center gap-4"
            style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Calories</p>
              <p className="font-heading font-black text-4xl" style={{ color: 'var(--gf-text-primary)' }}>{result.calories}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Protein', value: result.protein_g, emoji: '🥩', color: '#EF4444' },
              { label: 'Carbs', value: result.carbs_g, emoji: '🌾', color: '#3B82F6' },
              { label: 'Fats', value: result.fat_g, emoji: '🫒', color: '#F59E0B' },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', border: `1px solid ${m.color}30` }}>
                <span className="text-xl">{m.emoji}</span>
                <p className="font-body text-[10px] mt-1" style={{ color: 'var(--gf-text-secondary)' }}>{m.label}</p>
                <p className="font-heading font-black text-xl" style={{ color: m.color }}>{m.value}g</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onRetry}
              className="flex-1 py-3 rounded-2xl font-heading font-black text-base flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }}>
              ✦ Fix Results
            </button>
            <button onClick={() => onSave(result)}
              className="flex-1 py-3 rounded-2xl font-heading font-black text-base flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--gf-text-primary)', color: 'var(--gf-bg-primary)' }}>
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function NutritionTab({ user, atLimit, onLimitHit, incrementAIRequests }) {
  const isPremium = user.account_type === 'premium';
  const fileInputRef = useRef(null);

  const [meals, setMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSnapResult, setShowSnapResult] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(user.calorie_goal || DEFAULT_GOALS.calories);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(calorieGoal);

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const goals = {
    calories: calorieGoal,
    protein_g: Math.round(calorieGoal * 0.3 / 4),
    carbs_g: Math.round(calorieGoal * 0.4 / 4),
    fat_g: Math.round(calorieGoal * 0.3 / 9),
  };

  const todayStr = today();

  useEffect(() => {
    if (!user?.id) { setLoadingMeals(false); return; }
    base44.entities.MealLog.filter({ user_id: user.id, logged_date: todayStr }, '-created_date', 50)
      .then(setMeals).catch(() => setMeals([])).finally(() => setLoadingMeals(false));
  }, [user?.id]);

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein_g: acc.protein_g + (m.protein_g || 0),
    carbs_g: acc.carbs_g + (m.carbs_g || 0),
    fat_g: acc.fat_g + (m.fat_g || 0),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  const handleSaveMeal = async (form) => {
    if (!user?.id) return;
    const entry = {
      user_id: user.id,
      meal_name: form.meal_name,
      meal_type: form.meal_type || 'Breakfast',
      calories: Number(form.calories) || 0,
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fat_g: Number(form.fat_g) || 0,
      image_url: form.image_url || null,
      health_score: form.health_score || null,
      logged_date: todayStr,
    };
    const saved = await base44.entities.MealLog.create(entry);
    setMeals(prev => [saved, ...prev]);
    setShowAddModal(false);
    setShowSnapResult(null);
  };

  const handleDeleteMeal = async (id) => {
    await base44.entities.MealLog.delete(id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveGoal = () => {
    const g = Number(goalInput);
    if (g > 0) { setCalorieGoal(g); base44.auth.updateMe({ calorie_goal: g }).catch(() => {}); }
    setEditingGoal(false);
  };

  const handleSnapPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSnapLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional nutritionist. Analyze this food photo and return the nutritional breakdown. Be accurate based on visible portion sizes. Return ONLY valid JSON.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            meal_name: { type: 'string' },
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            health_score: { type: 'number' },
          },
        },
      });
      setShowSnapResult({ ...result, image_url: file_url, meal_type: 'Lunch' });
      incrementAIRequests?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSnapLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">

      {/* Daily Summary Ring */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
        <p className="font-heading font-black text-base mb-4 text-center" style={{ color: 'var(--gf-text-primary)' }}>Today</p>
        <div className="flex items-center gap-4">
          <CalorieRing consumed={totals.calories} goal={goals.calories} />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between font-body text-sm">
              <span style={{ color: 'var(--gf-text-secondary)' }}>Goal</span>
              {editingGoal ? (
                <input type="number" value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onBlur={handleSaveGoal}
                  onKeyDown={e => e.key === 'Enter' && handleSaveGoal()}
                  autoFocus
                  className="w-20 px-2 py-0.5 rounded-lg font-body text-sm outline-none text-right"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-green)' }} />
              ) : (
                <button onClick={() => setEditingGoal(true)} className="flex items-center gap-1">
                  <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>{goals.calories.toLocaleString()}</span>
                  <span className="text-xs">✏️</span>
                </button>
              )}
            </div>
            <div className="flex justify-between font-body text-sm">
              <span style={{ color: 'var(--gf-text-secondary)' }}>Food</span>
              <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>{totals.calories.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-body text-sm">
              <span style={{ color: 'var(--gf-text-secondary)' }}>Exercise</span>
              <span className="font-heading font-black" style={{ color: 'var(--gf-green)' }}>+0</span>
            </div>
          </div>
        </div>

        {isPremium ? (
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--gf-border)' }}>
            <MacroBar label="Protein" consumed={totals.protein_g} goal={goals.protein_g} color="#EF4444" />
            <MacroBar label="Carbs" consumed={totals.carbs_g} goal={goals.carbs_g} color="#3B82F6" />
            <MacroBar label="Fat" consumed={totals.fat_g} goal={goals.fat_g} color="#F59E0B" />
          </div>
        ) : (
          <button onClick={onLimitHit}
            className="w-full mt-4 pt-4 flex items-center justify-center gap-2 font-body text-sm"
            style={{ borderTop: '1px solid var(--gf-border)', color: 'var(--gf-purple)' }}>
            <Crown size={14} /> <span className="font-semibold">Press to View Macros</span>
          </button>
        )}
      </div>

      {/* Add Meal Buttons */}
      <div className="space-y-3">
        {isPremium ? (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleSnapPhoto} />
            <button
              onClick={() => !snapLoading && fileInputRef.current?.click()}
              disabled={snapLoading}
              className="w-full py-4 rounded-2xl font-heading font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #C026D3)', color: '#FFFFFF' }}>
              {snapLoading ? (
                <><Loader2 size={20} className="animate-spin" /> Analyzing meal...</>
              ) : (
                <><Camera size={20} /> Snap a Photo</>
              )}
            </button>
            <p className="text-center font-body text-xs mt-1.5" style={{ color: 'var(--gf-text-secondary)' }}>
              AI analyzes calories, protein, carbs & fat from your photo
            </p>
          </div>
        ) : (
          <button onClick={onLimitHit}
            className="w-full py-4 rounded-2xl font-heading font-black text-lg flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(192,38,211,0.3))', border: '1px dashed rgba(124,58,237,0.5)', color: 'rgba(255,255,255,0.6)' }}>
            <Lock size={18} />
            <span>Snap a Photo</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
              style={{ backgroundColor: 'rgba(124,58,237,0.3)', color: '#C084FC' }}>PREMIUM</span>
          </button>
        )}

        <button onClick={() => setShowAddModal(true)}
          className="w-full py-4 rounded-2xl font-heading font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)', color: 'var(--gf-text-primary)' }}>
          <Plus size={20} /> Add Meal Manually
        </button>
      </div>

      {/* Today's Meal Log */}
      <div>
        <h3 className="font-heading font-black text-xl mb-3" style={{ color: 'var(--gf-text-primary)' }}>Today's Log</h3>
        {loadingMeals ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--gf-text-secondary)' }} />
          </div>
        ) : meals.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
            <p className="text-3xl mb-2">🍽️</p>
            <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>No meals logged today. Add your first meal!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map(meal => (
              <motion.div key={meal.id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                {meal.image_url ? (
                  <img src={meal.image_url} alt={meal.meal_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
                    {MEAL_EMOJIS[meal.meal_type] || '🍽️'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--gf-text-primary)' }}>{meal.meal_name}</p>
                  <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{meal.meal_type}</p>
                  {isPremium && (meal.protein_g > 0 || meal.carbs_g > 0 || meal.fat_g > 0) && (
                    <div className="flex gap-2 mt-0.5">
                      <span className="font-body text-[10px]" style={{ color: '#EF4444' }}>P {meal.protein_g}g</span>
                      <span className="font-body text-[10px]" style={{ color: '#3B82F6' }}>C {meal.carbs_g}g</span>
                      <span className="font-body text-[10px]" style={{ color: '#F59E0B' }}>F {meal.fat_g}g</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-heading font-black text-base" style={{ color: 'var(--gf-green)' }}>{meal.calories}</p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--gf-text-secondary)' }}>kcal</p>
                </div>
                <button onClick={() => handleDeleteMeal(meal.id)} className="ml-1 p-1.5 rounded-lg transition-all active:scale-90"
                  style={{ color: 'var(--gf-text-secondary)' }}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <AddMealModal onSave={handleSaveMeal} onClose={handleCloseAddModal} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSnapResult && (
          <SnapResultSheet
            result={showSnapResult}
            onSave={handleSaveMeal}
            onRetry={() => { setShowSnapResult(null); fileInputRef.current?.click(); }}
            onClose={() => setShowSnapResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
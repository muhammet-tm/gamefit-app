import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Zap } from 'lucide-react';
import ActionSheet, { SelectTrigger } from '@/components/gamefit/ActionSheet';

const EXERCISE_EMOJI = { 'Running':'🏃','Cycling':'🚴','Weight Training':'🏋️','Swimming':'🏊','Yoga':'🧘','HIIT':'⚡','Boxing':'🥊','Basketball':'🏀','Football':'⚽','Walking':'🚶','Other':'💪' };
const INTENSITY_COLORS = { Low: '#22C55E', Medium: '#FFB800', High: '#EF4444' };

const DEFAULT_TEMPLATES = [
  { id: 't1', name: 'Morning Run',      exercise_type: 'Running',        duration_min: 30, intensity: 'Medium' },
  { id: 't2', name: 'Power Lift',       exercise_type: 'Weight Training', duration_min: 60, intensity: 'High'   },
  { id: 't3', name: 'Evening Yoga',     exercise_type: 'Yoga',            duration_min: 45, intensity: 'Low'    },
];

export default function QuickStartTemplates({ onLaunch }) {
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gf_templates') || 'null') || DEFAULT_TEMPLATES; } catch { return DEFAULT_TEMPLATES; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', exercise_type: 'Running', duration_min: 30, intensity: 'Medium' });
  const [showExerciseSheet, setShowExerciseSheet] = useState(false);
  const [showIntensitySheet, setShowIntensitySheet] = useState(false);

  const save = (list) => {
    setTemplates(list);
    localStorage.setItem('gf_templates', JSON.stringify(list));
  };

  const addTemplate = () => {
    if (!form.name.trim()) return;
    const newT = { ...form, id: `t${Date.now()}`, duration_min: parseInt(form.duration_min) || 30 };
    save([...templates, newT]);
    setForm({ name: '', exercise_type: 'Running', duration_min: 30, intensity: 'Medium' });
    setShowAdd(false);
  };

  const deleteTemplate = (id) => save(templates.filter(t => t.id !== id));

  const inputStyle = { backgroundColor: 'var(--gf-bg-primary)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>⚡ Quick Start</h2>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-all"
          style={{ backgroundColor: showAdd ? 'var(--gf-bg-elevated)' : 'rgba(200,255,0,0.15)', color: showAdd ? 'var(--gf-text-secondary)' : 'var(--gf-green)', border: `1px solid ${showAdd ? 'var(--gf-border)' : 'rgba(200,255,0,0.3)'}` }}>
          <Plus size={12} /> {showAdd ? 'Cancel' : 'Save Routine'}
        </button>
      </div>

      {/* Add template form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-4 mb-4 space-y-3 overflow-hidden"
            style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
            <p className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>Save Current as Template</p>
            <input
              placeholder="Template name (e.g. Monday Push Day)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl font-body text-sm outline-none"
              style={inputStyle}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Exercise</p>
                <SelectTrigger 
                  value={form.exercise_type}
                  label="Select"
                  onClick={() => setShowExerciseSheet(true)}
                />
              </div>
              <div>
                <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Duration</p>
                <input type="number" min="5" max="240"
                  className="w-full px-2 py-2 rounded-xl font-body text-xs outline-none" style={inputStyle}
                  value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
              </div>
              <div>
                <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Intensity</p>
                <SelectTrigger 
                  value={form.intensity}
                  label="Select"
                  onClick={() => setShowIntensitySheet(true)}
                />
              </div>
            </div>
            <button onClick={addTemplate}
              className="w-full py-2.5 rounded-xl font-heading font-black text-base transition-all active:scale-95"
              style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
              Save Template
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {templates.map(t => (
          <motion.div key={t.id} layout
            className="flex-shrink-0 rounded-2xl p-4 flex flex-col justify-between relative"
            style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)', width: 148, minHeight: 130 }}>
            <button onClick={() => deleteTemplate(t.id)}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
              <Trash2 size={11} color="var(--gf-text-secondary)" />
            </button>
            <div>
              <div className="text-2xl mb-1">{EXERCISE_EMOJI[t.exercise_type] || '💪'}</div>
              <p className="font-heading font-black text-sm leading-tight mb-1" style={{ color: 'var(--gf-text-primary)' }}>{t.name}</p>
              <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{t.duration_min}m · <span style={{ color: INTENSITY_COLORS[t.intensity] }}>{t.intensity}</span></p>
            </div>
            <button onClick={() => onLaunch(t)}
              className="mt-3 w-full py-2 rounded-xl font-heading font-black text-sm flex items-center justify-center gap-1 transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(200,255,0,0.15)', color: 'var(--gf-green)', border: '1px solid rgba(200,255,0,0.25)' }}>
              <Zap size={13} /> Go!
            </button>
          </motion.div>
        ))}
      </div>

      <ActionSheet
        isOpen={showExerciseSheet}
        onClose={() => setShowExerciseSheet(false)}
        title="Exercise Type"
        options={Object.keys(EXERCISE_EMOJI).map(t => ({
          label: t,
          selected: form.exercise_type === t,
          onSelect: () => setForm(f => ({ ...f, exercise_type: t }))
        }))}
      />

      <ActionSheet
        isOpen={showIntensitySheet}
        onClose={() => setShowIntensitySheet(false)}
        title="Intensity"
        options={['Low', 'Medium', 'High'].map(i => ({
          label: i,
          selected: form.intensity === i,
          onSelect: () => setForm(f => ({ ...f, intensity: i }))
        }))}
      />
    </div>
  );
}
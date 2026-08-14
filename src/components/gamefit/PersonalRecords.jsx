import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Trash2, Trophy, X } from 'lucide-react';
import { supabase, callRpc } from '@/api/supabase';
import { prSchema, validate } from '@/lib/validation';
import { track } from '@/lib/analytics';

// Personal records card (Profile screen): best weight x reps per exercise
// with date, PR badges, and a rotating motivational quote. All writes go
// through the log_pr RPC — the server decides what counts as a record.

const SUGGESTED_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Hip Thrust', 'Leg Press', 'Weighted Pull-up', 'Weighted Dip', 'Lat Pulldown',
];

// Original one-liners — rotates daily
const QUOTES = [
  'The bar doesn’t care how you feel today. Lift it anyway.',
  'Records exist so you can break them.',
  'Strong is built one heavy rep at a time.',
  'Your only real rival is last month’s you.',
  'Progress is quiet until the day it isn’t.',
  'Show up heavy. Leave stronger.',
  'A PR is proof the work is working.',
  'Chase the extra rep, not the perfect day.',
];

function fmtDate(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputStyle = {
  backgroundColor: 'var(--gf-bg-elevated)',
  color: 'var(--gf-text-primary)',
  border: '1px solid var(--gf-border)',
};

export default function PersonalRecords({ onBadges }) {
  const [records, setRecords] = useState(null); // null = loading
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ exercise: '', weight_kg: '', reps: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState(null); // { exercise, weight, reps, previous }

  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  useEffect(() => {
    supabase.from('personal_records')
      .select('id, exercise, weight_kg, reps, achieved_on')
      .order('achieved_on', { ascending: false })
      .then(({ data }) => setRecords(data ?? []));
  }, []);

  // Current best per exercise (case-insensitive grouping, latest casing wins)
  const bests = useMemo(() => {
    const byExercise = new Map();
    for (const r of records ?? []) {
      const key = r.exercise.toLowerCase();
      const cur = byExercise.get(key);
      const better = !cur
        || Number(r.weight_kg) > Number(cur.weight_kg)
        || (Number(r.weight_kg) === Number(cur.weight_kg) && r.reps > cur.reps);
      if (better) byExercise.set(key, { ...r, attempts: (cur?.attempts || 0) + 1 });
      else cur.attempts += 1;
    }
    return [...byExercise.values()].sort((a, b) => Number(b.weight_kg) - Number(a.weight_kg));
  }, [records]);

  const isRecent = (d) => (Date.now() - new Date(`${d}T00:00:00`)) < 7 * 86400000;

  const submit = async () => {
    const res = validate(prSchema, form);
    if (!res.ok) { setFormError(res.message); return; }
    setSaving(true);
    setFormError('');
    try {
      const out = await callRpc('log_pr', {
        p_exercise: res.data.exercise,
        p_weight_kg: res.data.weight_kg,
        p_reps: res.data.reps,
      });
      setRecords(prev => [out.record, ...(prev ?? [])]);
      setShowForm(false);
      setForm({ exercise: '', weight_kg: '', reps: '' });
      if (out.new_badges?.length) onBadges?.(out.new_badges);
      track('pr_logged', { new_record: !!out.is_new_record });
      if (out.is_new_record) {
        setCelebration({
          exercise: out.record.exercise,
          weight: out.record.weight_kg,
          reps: out.record.reps,
          previous: out.previous_best,
        });
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      }
    } catch (err) {
      setFormError(err.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const prev = records;
    setRecords(rs => rs.filter(r => r.id !== id));
    const { error } = await supabase.from('personal_records').delete().eq('id', id);
    if (error) setRecords(prev);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gf-border)', backgroundColor: 'var(--gf-bg-surface)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gf-border)' }}>
        <h3 className="font-heading font-black text-lg flex items-center gap-2" style={{ color: 'var(--gf-text-primary)' }}>
          <Trophy size={18} color="var(--gf-amber, #F59E0B)" /> Personal Records
        </h3>
        <button onClick={() => { setShowForm(v => !v); setFormError(''); }}
          className="px-3 py-1.5 rounded-xl font-body text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
          style={{ backgroundColor: 'var(--gf-green)', color: '#0B1A24' }}>
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? 'Close' : 'Log PR'}
        </button>
      </div>

      <p className="px-4 pt-3 font-body text-xs italic" style={{ color: 'var(--gf-text-secondary)' }}>
        “{quote}”
      </p>

      {showForm && (
        <div className="px-4 pt-3 space-y-2">
          <input list="pr-exercises" placeholder="Exercise (e.g. Bench Press)" value={form.exercise}
            onChange={e => setForm(f => ({ ...f, exercise: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none" style={inputStyle} />
          <datalist id="pr-exercises">
            {SUGGESTED_EXERCISES.map(e => <option key={e} value={e} />)}
          </datalist>
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" placeholder="Weight (kg)" value={form.weight_kg}
              onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm outline-none" style={inputStyle} />
            <input type="number" inputMode="numeric" placeholder="Reps" value={form.reps}
              onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
              className="w-24 px-4 py-3 rounded-xl font-body text-sm outline-none" style={inputStyle} />
          </div>
          {formError && <p className="font-body text-xs" style={{ color: '#E5614A' }}>{formError}</p>}
          <button onClick={submit} disabled={saving}
            className="w-full py-3 rounded-xl font-heading font-black text-base transition-all active:scale-95"
            style={{ backgroundColor: 'var(--gf-green)', color: '#0B1A24', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      )}

      {celebration && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(244, 176, 68,0.10)', border: '1px solid var(--gf-green)' }}>
          <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-gold-text)' }}>🏆 NEW PERSONAL RECORD!</p>
          <p className="font-body text-xs mt-0.5" style={{ color: 'var(--gf-text-primary)' }}>
            {celebration.exercise}: <strong>{Number(celebration.weight)} kg × {celebration.reps}</strong>
            {celebration.previous && (
              <span style={{ color: 'var(--gf-text-secondary)' }}> (was {Number(celebration.previous.weight_kg)} kg × {celebration.previous.reps})</span>
            )}
          </p>
        </div>
      )}

      {records === null ? (
        <div className="p-4 space-y-2">
          {[0, 1].map(i => (
            <div key={i} className="h-10 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--gf-bg-elevated)' }} />
          ))}
        </div>
      ) : bests.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-3xl mb-2">🏋️</p>
          <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
            No records yet. Log your best lift and start beating it.
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Exercise', 'Best', 'Date', ''].map(h => (
                  <th key={h} className="text-left font-body font-semibold uppercase tracking-wide pb-2 pr-2 text-[10px] whitespace-nowrap"
                    style={{ color: 'var(--gf-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bests.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--gf-border)' }}>
                  <td className="py-2.5 pr-2 font-body font-medium" style={{ color: 'var(--gf-text-primary)' }}>
                    {r.exercise}
                    {isRecent(r.achieved_on) && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ backgroundColor: 'rgba(244, 176, 68,0.15)', color: 'var(--gf-gold-text)' }}>PR!</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 font-heading font-black whitespace-nowrap" style={{ color: 'var(--gf-text-primary)' }}>
                    {Number(r.weight_kg)} kg <span className="font-body font-normal" style={{ color: 'var(--gf-text-secondary)' }}>× {r.reps}</span>
                  </td>
                  <td className="py-2.5 pr-2 font-body whitespace-nowrap" style={{ color: 'var(--gf-text-secondary)' }}>
                    {fmtDate(r.achieved_on)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => remove(r.id)} aria-label={`Delete ${r.exercise} record`}
                      className="p-1.5 rounded-lg transition-all active:scale-90">
                      <Trash2 size={13} color="var(--gf-text-secondary)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ChevronDown } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { MOCK_USER } from '@/lib/mockData';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';

const FITNESS_GOALS = ['Lose Weight', 'Build Muscle', 'Improve Endurance', 'Stay Active', 'General Fitness'];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useGameFit();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', age: '', fitnessGoal: 'General Fitness'
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await base44.auth.loginViaEmailPassword(form.email, form.password);
        window.location.href = '/dashboard';
      } else {
        await base44.auth.register({ email: form.email, password: form.password });
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all";
  const inputStyle = { backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
         <div className="flex flex-col items-center mb-8">
           <img src="https://media.base44.com/images/public/6a22946565d355d321574da0/f6b46b39a_GameFit_Logo.png" 
             alt="GameFit Logo" className="h-40 object-contain mb-2" />
         </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2.5 rounded-lg font-body font-medium text-sm transition-all"
              style={{
                backgroundColor: mode === m ? 'var(--gf-green)' : 'transparent',
                color: mode === m ? '#0D0F14' : 'var(--gf-text-secondary)'
              }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 px-4 py-3 rounded-xl text-sm font-body"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--gf-text-secondary)' }} />
                  <input className={inputCls} style={{ ...inputStyle, paddingLeft: 36 }}
                    placeholder="First Name" value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div className="relative flex-1">
                  <input className={inputCls} style={inputStyle}
                    placeholder="Last Name" value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <input className={inputCls} style={inputStyle} type="number" placeholder="Age"
                value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} required />
              <div className="relative">
                <select className={inputCls} style={{ ...inputStyle, appearance: 'none' }}
                  value={form.fitnessGoal} onChange={e => setForm(f => ({ ...f, fitnessGoal: e.target.value }))}>
                  {FITNESS_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3.5 pointer-events-none" style={{ color: 'var(--gf-text-secondary)' }} />
              </div>
            </>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--gf-text-secondary)' }} />
            <input className={inputCls} style={{ ...inputStyle, paddingLeft: 36 }}
              type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--gf-text-secondary)' }} />
            <input className={inputCls} style={{ ...inputStyle, paddingLeft: 36, paddingRight: 40 }}
              type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-3" style={{ color: 'var(--gf-text-secondary)' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <span className="text-sm font-body" style={{ color: 'var(--gf-purple)' }}>Forgot Password?</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-heading font-black text-lg mt-2 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gf-border)' }} />
          <span className="text-xs font-body" style={{ color: 'var(--gf-text-secondary)' }}>or continue with</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gf-border)' }} />
        </div>

        <button
          className="w-full py-3.5 rounded-xl font-body font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' }}
          onClick={() => base44.auth.loginWithProvider('google', '/dashboard')}
        >
          <GoogleIcon className="w-5 h-5" />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, Bot, Trophy, BarChart2, Plus, Trash2, Check, X } from 'lucide-react';
import ActionSheet, { SelectTrigger } from '@/components/gamefit/ActionSheet';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import { MOCK_LEADERBOARD, MOCK_REWARDS } from '@/lib/mockData';

const ADMIN_TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'rewards', label: 'Rewards', icon: ShoppingBag },
  { id: 'ai', label: 'AI Usage', icon: Bot },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const MOCK_ANALYTICS = {
  totalUsers: 1248,
  premiumUsers: 187,
  dau: 342,
  totalWorkouts: 8914,
  totalXP: 2840000,
};

const AI_USAGE = [
  { date: '2024-06-04', requests: 214 },
  { date: '2024-06-03', requests: 189 },
  { date: '2024-06-02', requests: 230 },
  { date: '2024-06-01', requests: 198 },
  { date: '2024-05-31', requests: 175 },
];

export default function Admin() {
  const [tab, setTab] = useState('analytics');
  const [rewards, setRewards] = useState(MOCK_REWARDS);
  const [editingReward, setEditingReward] = useState(null);
  const [showAddReward, setShowAddReward] = useState(false);
  const [newReward, setNewReward] = useState({ reward_name: '', description: '', cost_coins: 100, reward_type: 'DiscountCode', is_premium_only: false });
  const [showRewardTypeSheet, setShowRewardTypeSheet] = useState(false);

  const surfaceStyle = { backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' };
  const inputCls = "w-full px-3 py-2 rounded-xl font-body text-sm outline-none";
  const inputStyle = { backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-primary)', border: '1px solid var(--gf-border)' };

  const toggleRewardActive = (id) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };

  const deleteReward = (id) => {
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const addReward = () => {
    setRewards(prev => [...prev, { ...newReward, id: `r${Date.now()}`, is_active: true }]);
    setNewReward({ reward_name: '', description: '', cost_coins: 100, reward_type: 'DiscountCode', is_premium_only: false });
    setShowAddReward(false);
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title="Admin Panel"
        subtitle="GameFit Management Console"
        showBackButton={false}
        rightAction={<span className="px-3 py-1 rounded-full font-body text-xs font-bold"
          style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>
          ADMIN
        </span>}
      />

      {/* Tab bar */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto no-scrollbar"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        {ADMIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all"
            style={{
              backgroundColor: tab === t.id ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
              color: tab === t.id ? '#0D0F14' : 'var(--gf-text-secondary)',
            }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Analytics */}
        {tab === 'analytics' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: MOCK_ANALYTICS.totalUsers.toLocaleString(), color: 'var(--gf-green)' },
                { label: 'Premium Users', value: MOCK_ANALYTICS.premiumUsers, color: 'var(--gf-purple)' },
                { label: 'Daily Active', value: MOCK_ANALYTICS.dau, color: '#3B82F6' },
                { label: 'Total Workouts', value: MOCK_ANALYTICS.totalWorkouts.toLocaleString(), color: 'var(--gf-amber)' },
                { label: 'Total XP Distributed', value: `${(MOCK_ANALYTICS.totalXP / 1000).toFixed(0)}K`, color: 'var(--gf-green)' },
                { label: 'Premium Rate', value: `${((MOCK_ANALYTICS.premiumUsers / MOCK_ANALYTICS.totalUsers) * 100).toFixed(1)}%`, color: 'var(--gf-purple)' },
              ].map((s, i) => (
                <motion.div key={i} className="rounded-2xl p-4" style={surfaceStyle}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>{s.label}</p>
                  <p className="font-heading font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={surfaceStyle}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--gf-border)' }}>
              <p className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>
                User List ({MOCK_LEADERBOARD.length})
              </p>
            </div>
            {MOCK_LEADERBOARD.slice(0, 8).map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < 7 ? '1px solid var(--gf-border)' : 'none' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-heading font-black text-sm"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>
                  {u.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--gf-text-primary)' }}>{u.display_name}</p>
                  <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Lvl {u.current_level} · {u.total_xp.toLocaleString()} XP</p>
                </div>
                <select className="px-2 py-1 rounded-lg font-body text-xs outline-none"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)', border: '1px solid var(--gf-border)' }}>
                  <option value="regular">Regular</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Rewards */}
        {tab === 'rewards' && (
          <>
            <button onClick={() => setShowAddReward(!showAddReward)}
              className="w-full py-3 rounded-xl font-heading font-black text-base flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
              <Plus size={18} /> Add Reward
            </button>

            {showAddReward && (
              <div className="rounded-2xl p-4 space-y-3" style={surfaceStyle}>
                <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>New Reward</h3>
                {[['reward_name', 'Name'], ['description', 'Description']].map(([k, label]) => (
                  <div key={k}>
                    <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>{label}</p>
                    <input className={inputCls} style={inputStyle} value={newReward[k]}
                      onChange={e => setNewReward(r => ({ ...r, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Cost (coins)</p>
                    <input type="number" className={inputCls} style={inputStyle} value={newReward.cost_coins}
                      onChange={e => setNewReward(r => ({ ...r, cost_coins: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <p className="font-body text-xs mb-1" style={{ color: 'var(--gf-text-secondary)' }}>Type</p>
                    <SelectTrigger 
                      value={newReward.reward_type}
                      label="Select type"
                      onClick={() => setShowRewardTypeSheet(true)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newReward.is_premium_only}
                    onChange={e => setNewReward(r => ({ ...r, is_premium_only: e.target.checked }))} />
                  <span className="font-body text-sm" style={{ color: 'var(--gf-text-primary)' }}>Premium only</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddReward(false)} className="flex-1 py-2.5 rounded-xl font-heading font-black text-sm"
                    style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>Cancel</button>
                  <button onClick={addReward} className="flex-1 py-2.5 rounded-xl font-heading font-black text-sm"
                    style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>Add</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {rewards.map(r => (
                <div key={r.id} className="rounded-2xl p-4 flex items-center gap-3" style={surfaceStyle}>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{r.reward_name}</p>
                    <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                      🪙 {r.cost_coins} · {r.reward_type} {r.is_premium_only ? '· ⚡Premium' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRewardActive(r.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: r.is_active ? 'rgba(34,197,94,0.2)' : 'var(--gf-bg-elevated)' }}>
                      {r.is_active ? <Check size={14} color="#22C55E" /> : <X size={14} color="var(--gf-text-secondary)" />}
                    </button>
                    <button onClick={() => deleteReward(r.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* AI Usage */}
        {tab === 'ai' && (
          <div className="rounded-2xl overflow-hidden" style={surfaceStyle}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--gf-border)' }}>
              <p className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>Daily AI Requests</p>
            </div>
            {AI_USAGE.map((day, i) => (
              <div key={day.date} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < AI_USAGE.length - 1 ? '1px solid var(--gf-border)' : 'none' }}>
                <span className="font-body text-sm flex-1" style={{ color: 'var(--gf-text-secondary)' }}>{day.date}</span>
                <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(day.requests / 250) * 100}%`, backgroundColor: 'var(--gf-purple)' }} />
                </div>
                <span className="font-heading font-black text-sm w-10 text-right" style={{ color: 'var(--gf-purple)' }}>{day.requests}</span>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard management */}
        {tab === 'leaderboard' && (
          <>
            <button className="w-full py-3.5 rounded-2xl font-heading font-black text-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--gf-purple)', color: '#FFF' }}>
              <Trophy size={20} /> Refresh Materialized View
            </button>
            <p className="text-center font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
              Last refreshed: just now · Auto-refreshes every 10 minutes
            </p>
            <div className="rounded-2xl overflow-hidden" style={surfaceStyle}>
              {MOCK_LEADERBOARD.slice(0, 5).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < 4 ? '1px solid var(--gf-border)' : 'none' }}>
                  <span className="font-heading font-black text-sm w-6 text-center" style={{ color: 'var(--gf-text-secondary)' }}>#{u.rank}</span>
                  <span className="flex-1 font-body font-medium text-sm" style={{ color: 'var(--gf-text-primary)' }}>{u.display_name}</span>
                  <span className="font-heading font-black text-sm" style={{ color: 'var(--gf-green)' }}>{u.total_xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </ScreenTransition>

      <ActionSheet
        isOpen={showRewardTypeSheet}
        onClose={() => setShowRewardTypeSheet(false)}
        title="Reward Type"
        options={[
          { label: 'Discount Code', selected: newReward.reward_type === 'DiscountCode', onSelect: () => setNewReward(r => ({ ...r, reward_type: 'DiscountCode' })) },
          { label: 'Avatar Item', selected: newReward.reward_type === 'AvatarItem', onSelect: () => setNewReward(r => ({ ...r, reward_type: 'AvatarItem' })) },
        ]}
      />
    </div>
  );
}
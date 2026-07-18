import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Lock } from 'lucide-react';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import PullToRefresh from '@/components/gamefit/PullToRefresh';
import { useGameFit } from '@/lib/GameFitContext';
import { callRpc } from '@/api/supabase';
import Avatar from '@/components/avatar/Avatar';
import RankEmblem from '@/components/gamefit/RankEmblem';
import { getRank } from '@/lib/ranks';
import { normalizeAvatarConfig } from '@/components/avatar/migrate';
import BottomNav from '@/components/gamefit/BottomNav';
import PremiumModal from '@/components/gamefit/PremiumModal';

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function EntryAvatar({ entry, size }) {
  const cfg = normalizeAvatarConfig(entry.avatar_config);
  return (
    <Avatar
      avatarClass={cfg.class}
      tier={entry.avatar_tier || 1}
      skinTone={cfg.skin_tone}
      hair={cfg.hair}
      accessories={entry.equipped_accessory ? [entry.equipped_accessory] : []}
      size={size}
      animate={false}
    />
  );
}

function RowSkeleton({ i }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 animate-pulse"
      style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)', opacity: 1 - i * 0.12 }}>
      <div className="w-6 h-5 rounded" style={{ backgroundColor: 'var(--gf-border)' }} />
      <div className="w-9 h-12 rounded-lg" style={{ backgroundColor: 'var(--gf-border)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded" style={{ backgroundColor: 'var(--gf-border)' }} />
        <div className="h-2.5 w-16 rounded" style={{ backgroundColor: 'var(--gf-border)' }} />
      </div>
      <div className="h-4 w-12 rounded" style={{ backgroundColor: 'var(--gf-border)' }} />
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useGameFit();
  const [tab, setTab] = useState('alltime'); // 'alltime' | 'weekly' | 'friends'
  const [showPremium, setShowPremium] = useState(false);
  const isPremium = user.account_type === 'premium';
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ entries: [], me: null, total_players: 0 });

  const scope = tab === 'weekly' ? 'weekly' : 'alltime';

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await callRpc('get_leaderboard', { p_scope: scope, p_limit: 50 });
      setData({
        entries: res?.entries || [],
        me: res?.me || null,
        total_players: res?.total_players || 0,
      });
    } catch (e) {
      setError('Could not load the leaderboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useEffect(() => {
    if (tab === 'friends') return;
    setLoading(true);
    load();
  }, [tab, load]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const entries = data.entries;
  const myEntry = data.me;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const inList = myEntry && myEntry.rank <= entries.length;
  const topPct = myEntry && data.total_players > 0
    ? Math.max(1, Math.round((myEntry.rank / data.total_players) * 100))
    : null;

  return (
    <PullToRefresh onRefresh={handlePullRefresh} disabled={refreshing}>
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader
        title="🏆 Leaderboard"
        subtitle={tab === 'weekly' ? 'This week · resets Monday (UAE time)' : 'All-time rankings'}
        showBackButton={false}
        rightAction={<button onClick={handlePullRefresh}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.5 }}>
            <RefreshCw size={16} color="var(--gf-text-secondary)" />
          </motion.div>
        </button>}
      />
        {/* Tabs */}
        <div className="flex rounded-xl p-1 mt-3" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          {[['alltime', '🌍 All-Time'], ['weekly', '📅 This Week']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg font-body font-medium text-sm transition-all"
              style={{ backgroundColor: tab === t ? 'var(--gf-bg-surface)' : 'transparent', color: tab === t ? 'var(--gf-text-primary)' : 'var(--gf-text-secondary)' }}>
              {label}
            </button>
          ))}
          <button
            onClick={() => isPremium ? setTab('friends') : setShowPremium(true)}
            className="flex-1 py-2 rounded-lg font-body font-medium text-sm transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: tab === 'friends' ? 'var(--gf-bg-surface)' : 'transparent', color: tab === 'friends' ? 'var(--gf-text-primary)' : 'var(--gf-text-secondary)' }}>
            {!isPremium && <Lock size={12} style={{ color: 'var(--gf-amber)' }} />}
            👥 Friends
          </button>
        </div>
      </ScreenTransition>

      {tab === 'friends' ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-5 text-center">
          <span className="text-5xl mb-4">👥</span>
          <h3 className="font-heading font-black text-2xl mb-2" style={{ color: 'var(--gf-text-primary)' }}>Friends Leaderboard</h3>
          <p className="font-body" style={{ color: 'var(--gf-text-secondary)' }}>Coming soon — invite friends to GameFit to compete head-to-head!</p>
        </div>
      ) : loading ? (
        <div className="px-5 pt-5 space-y-2">
          {[0, 1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} i={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <span className="text-5xl mb-4">📡</span>
          <p className="font-body" style={{ color: 'var(--gf-text-secondary)' }}>{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <span className="text-5xl mb-4">🏁</span>
          <h3 className="font-heading font-black text-2xl mb-2" style={{ color: 'var(--gf-text-primary)' }}>
            {tab === 'weekly' ? 'No workouts yet this week' : 'The board is empty'}
          </h3>
          <p className="font-body" style={{ color: 'var(--gf-text-secondary)' }}>
            Log a workout and claim the #1 spot! 🏆
          </p>
        </div>
      ) : (
        <div className="px-5 pt-5">
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-3 mb-6">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry) => {
              const podiumRank = entry.rank;
              const height = podiumRank === 1 ? 'h-32' : podiumRank === 2 ? 'h-24' : 'h-20';
              const medalColor = MEDAL_COLORS[podiumRank] || MEDAL_COLORS[3];
              return (
                <motion.div key={entry.user_id}
                  className="flex flex-col items-center gap-2 flex-1"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumRank * 0.08 }}>
                  <div className="relative">
                    <div className="rounded-2xl p-2 border-2" style={{ backgroundColor: 'var(--gf-bg-elevated)', borderColor: medalColor }}>
                      <EntryAvatar entry={entry} size={podiumRank === 1 ? 60 : 48} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: medalColor, color: '#0D0F14' }}>
                      {podiumRank}
                    </span>
                  </div>
                  <p className="font-body font-semibold text-xs text-center leading-tight" style={{ color: 'var(--gf-text-primary)' }}>
                    {entry.display_name}
                  </p>
                  <p className="font-heading font-black text-sm" style={{ color: medalColor }}>
                    {(entry.total_xp || 0).toLocaleString()} XP
                  </p>
                  <div className={`w-full rounded-t-xl ${height}`}
                    style={{ backgroundColor: `${medalColor}20`, border: `1px solid ${medalColor}40` }} />
                </motion.div>
              );
            })}
          </div>

          {/* Ranked list */}
          <div className="space-y-2 mb-4">
            {rest.map((entry, i) => {
              const isMe = entry.user_id === user.id;
              const r = getRank(entry.current_level);
              return (
                <motion.div key={entry.user_id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: isMe ? 'rgba(200,255,0,0.08)' : 'var(--gf-bg-surface)',
                    border: `1px solid ${isMe ? 'rgba(200,255,0,0.3)' : 'var(--gf-border)'}`,
                  }}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(0.05 * i, 0.4) }}>
                  <span className="font-heading font-black text-base w-6 text-center" style={{ color: 'var(--gf-text-secondary)' }}>
                    {entry.rank}
                  </span>
                  <EntryAvatar entry={entry} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-sm truncate" style={{ color: isMe ? 'var(--gf-green)' : 'var(--gf-text-primary)' }}>
                      {entry.display_name} {isMe && '(You)'}
                    </p>
                    <p className="font-body text-xs uppercase" style={{ color: r.color, letterSpacing: '0.05em' }}>
                      {r.display}
                    </p>
                  </div>
                  <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
                    {(entry.total_xp || 0).toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* My rank pinned when outside the visible list */}
          {myEntry && !inList && (
            <div className="sticky bottom-20">
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(200,255,0,0.1)', border: '1.5px solid rgba(200,255,0,0.5)', backdropFilter: 'blur(8px)' }}>
                <RankEmblem level={myEntry.current_level} size={26} />
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-green)' }}>
                    {myEntry.display_name} (You)
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                    {(myEntry.total_xp || 0).toLocaleString()} XP
                  </p>
                </div>
                <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-green)' }}>
                  #{myEntry.rank}{topPct ? ` · Top ${topPct}%` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      </div>
    </PullToRefresh>
  );
}

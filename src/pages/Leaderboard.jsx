import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Lock } from 'lucide-react';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import PullToRefresh from '@/components/gamefit/PullToRefresh';
import { useGameFit } from '@/lib/GameFitContext';
import { MOCK_LEADERBOARD } from '@/lib/mockData';
import AvatarIllustration from '@/components/gamefit/AvatarIllustration';
import BottomNav from '@/components/gamefit/BottomNav';
import PremiumModal from '@/components/gamefit/PremiumModal';

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function Leaderboard() {
  const { user } = useGameFit();
  const [tab, setTab] = useState('global');
  const [showPremium, setShowPremium] = useState(false);
  const isPremium = user.account_type === 'premium';
  const [refreshing, setRefreshing] = useState(false);

  const leaderboard = MOCK_LEADERBOARD;
  const myEntry = leaderboard.find(e => e.user_id === user.id);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.filter(e => e.user_id !== user.id).slice(3);
  const inTop10 = myEntry && myEntry.rank <= 10;

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRefreshing(false);
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh} disabled={refreshing}>
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title="🏆 Leaderboard"
        subtitle="Resets weekly · Monday midnight UTC"
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
          <button onClick={() => setTab('global')}
            className="flex-1 py-2 rounded-lg font-body font-medium text-sm transition-all"
            style={{ backgroundColor: tab === 'global' ? 'var(--gf-bg-surface)' : 'transparent', color: tab === 'global' ? 'var(--gf-text-primary)' : 'var(--gf-text-secondary)' }}>
            🌍 Global
          </button>
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
          <p className="font-body" style={{ color: 'var(--gf-text-secondary)' }}>Invite friends to GameFit to compete head-to-head on the friends leaderboard!</p>
        </div>
      ) : (
        <div className="px-5 pt-5">
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-3 mb-6">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, idx) => {
              const podiumRank = [2, 1, 3][idx];
              const height = podiumRank === 1 ? 'h-32' : podiumRank === 2 ? 'h-24' : 'h-20';
              const medalColor = MEDAL_COLORS[podiumRank];
              return (
                <motion.div key={entry.user_id}
                  className="flex flex-col items-center gap-2 flex-1"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}>
                  <div className="relative">
                    <div className="rounded-2xl p-2 border-2" style={{ backgroundColor: 'var(--gf-bg-elevated)', borderColor: medalColor }}>
                      <AvatarIllustration style={entry.avatar_style} tier={entry.avatar_tier} size={podiumRank === 1 ? 60 : 48} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: medalColor, color: podiumRank === 2 ? '#0D0F14' : '#0D0F14' }}>
                      {podiumRank}
                    </span>
                  </div>
                  <p className="font-body font-semibold text-xs text-center leading-tight" style={{ color: 'var(--gf-text-primary)' }}>
                    {entry.display_name}
                  </p>
                  <p className="font-heading font-black text-sm" style={{ color: medalColor }}>
                    {entry.total_xp.toLocaleString()} XP
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
              return (
                <motion.div key={entry.user_id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: isMe ? 'rgba(200,255,0,0.08)' : 'var(--gf-bg-surface)',
                    border: `1px solid ${isMe ? 'rgba(200,255,0,0.3)' : 'var(--gf-border)'}`,
                  }}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <span className="font-heading font-black text-base w-6 text-center" style={{ color: 'var(--gf-text-secondary)' }}>
                    {entry.rank}
                  </span>
                  <AvatarIllustration style={entry.avatar_style} tier={entry.avatar_tier} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-sm truncate" style={{ color: isMe ? 'var(--gf-green)' : 'var(--gf-text-primary)' }}>
                      {entry.display_name} {isMe && '(You)'}
                    </p>
                    <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Level {entry.current_level}</p>
                  </div>
                  <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
                    {entry.total_xp.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* My rank pinned if not in top 10 */}
          {!inTop10 && myEntry && (
            <div className="sticky bottom-20">
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(200,255,0,0.1)', border: '1.5px solid rgba(200,255,0,0.5)' }}>
                <span className="font-heading font-black text-base w-6 text-center" style={{ color: 'var(--gf-green)' }}>
                  {myEntry.rank}
                </span>
                <AvatarIllustration style={myEntry.avatar_style} tier={myEntry.avatar_tier} size={36} />
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-green)' }}>
                    {myEntry.display_name} (You)
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Level {myEntry.current_level}</p>
                </div>
                <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-green)' }}>
                  #{myEntry.rank}
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
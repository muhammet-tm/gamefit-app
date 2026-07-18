import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Dumbbell, Bot, ShoppingBag, Trophy, Zap, Flame } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { getNextLevelXP, getCurrentLevelXP } from '@/lib/mockData';
import { getRank } from '@/lib/ranks';
import RankEmblem from '@/components/gamefit/RankEmblem';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import UserAvatar from '@/components/avatar/UserAvatar';
import BottomNav from '@/components/gamefit/BottomNav';
import LevelUpOverlay from '@/components/gamefit/LevelUpOverlay';
import NotificationsPanel from '@/components/gamefit/NotificationsPanel';
import StreakCalendar from '@/components/gamefit/StreakCalendar';
import ProgressChart from '@/components/gamefit/ProgressChart';
import PullToRefresh from '@/components/gamefit/PullToRefresh';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, workouts, unreadCount, theme, toggleTheme } = useGameFit();
  const [showNotifs, setShowNotifs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRefreshing(false);
  };

  const level = user.current_level;
  const currentLevelXP = getCurrentLevelXP(level);
  const nextLevelXP = getNextLevelXP(level);
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((user.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100;
  const rank = getRank(level);
  const title = rank.display;

  const quickActions = [
    { label: 'Log Workout', icon: Dumbbell, color: '#C8FF00', textColor: '#0D0F14', path: '/train' },
    { label: 'Avatar Coach', icon: Bot, color: '#7C3AED', textColor: '#FFFFFF', path: '/avatar-coach' },
    { label: 'Marketplace', icon: ShoppingBag, color: '#FFB800', textColor: '#0D0F14', path: '/marketplace' },
    { label: 'Leaderboard', icon: Trophy, color: '#3B82F6', textColor: '#FFFFFF', path: '/leaderboard' },
  ];

  const recentWorkouts = workouts.slice(0, 3);

  const EXERCISE_EMOJI = {
    'Running': '🏃', 'Cycling': '🚴', 'Weight Training': '🏋️', 'Swimming': '🏊',
    'Yoga': '🧘', 'HIIT': '⚡', 'Boxing': '🥊', 'Basketball': '🏀',
    'Football': '⚽', 'Walking': '🚶', 'Other': '💪',
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh} disabled={refreshing}>
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
        <ScreenTransition direction="forward">
        {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        <div>
          <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Welcome back</p>
          <h2 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>
            {user.first_name} 👋
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            {theme === 'dark' ? <Sun size={18} color="var(--gf-amber)" /> : <Moon size={18} color="var(--gf-purple)" />}
          </button>
          <button onClick={() => setShowNotifs(true)} className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            <Bell size={18} color="var(--gf-text-secondary)" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: '#EF4444' }}>{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Hero Avatar Card */}
        <motion.div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          {/* BG glow */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: 'var(--gf-green)' }} />

          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar user={user} size={90} />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full font-heading font-black text-xs"
                style={{ backgroundColor: 'var(--gf-green)', color: '#0D0F14' }}>
                LVL {level}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <RankEmblem level={level} size={22} />
                <p className="font-heading font-black text-lg uppercase" style={{ color: rank.color, letterSpacing: '0.04em' }}>
                  {title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <Flame size={14} color="#FFB800" />
                <span className="font-body text-sm font-medium" style={{ color: '#FFB800' }}>
                  {user.current_streak} day streak
                </span>
              </div>
              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-body" style={{ color: 'var(--gf-text-secondary)' }}>
                  <span>{user.total_xp.toLocaleString()} XP</span>
                  <span>{nextLevelXP.toLocaleString()} XP</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--gf-green)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total XP', value: user.total_xp.toLocaleString(), icon: Zap, color: 'var(--gf-green)' },
            { label: 'This Week', value: `${user.weekly_workout_count} / ${user.weekly_goal || 3}`, sub: user.weekly_workout_count >= (user.weekly_goal || 3) ? 'Goal hit! 🎯' : 'workouts', icon: Dumbbell, color: '#3B82F6' },
            { label: 'Coins', value: `🪙 ${user.coins}`, icon: null, color: 'var(--gf-amber)' },
          ].map((stat, i) => (
            <motion.div key={i}
              className="rounded-2xl p-3 flex flex-col gap-1"
              style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.2 }}>
              <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{stat.label}</p>
              <p className="font-heading font-black text-base leading-tight" style={{ color: stat.color }}>{stat.value}</p>
              {stat.sub && (
                <p className="font-body text-[10px] leading-none" style={{ color: 'var(--gf-text-secondary)' }}>{stat.sub}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-heading font-black text-lg mb-3" style={{ color: 'var(--gf-text-primary)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <motion.button key={action.label}
                onClick={() => navigate(action.path)}
                className="rounded-2xl p-4 flex flex-col items-start gap-2 transition-all active:scale-95"
                style={{ backgroundColor: `${action.color}15`, border: `1px solid ${action.color}40` }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i + 0.4 }}
                whileTap={{ scale: 0.95 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: action.color }}>
                  <action.icon size={20} color={action.textColor} />
                </div>
                <span className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Streak Calendar */}
        <StreakCalendar />

        {/* Progress chart */}
        <ProgressChart />

        {/* Recent Activity */}
        <div>
          <h3 className="font-heading font-black text-lg mb-3" style={{ color: 'var(--gf-text-primary)' }}>Recent Activity</h3>
          <div className="space-y-2">
            {recentWorkouts.length === 0 && (
              <button onClick={() => navigate('/train')}
                className="w-full rounded-2xl p-5 text-center transition-all active:scale-98"
                style={{ backgroundColor: 'rgba(200,255,0,0.06)', border: '1.5px dashed rgba(200,255,0,0.4)' }}>
                <span className="text-3xl block mb-1.5">💧</span>
                <p className="font-heading font-black text-base" style={{ color: 'var(--gf-green)' }}>
                  Log your first workout
                </p>
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--gf-text-secondary)' }}>
                  and earn the First Sweat badge
                </p>
              </button>
            )}
            {recentWorkouts.map((w, i) => (
              <motion.div key={w.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i + 0.5 }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{EXERCISE_EMOJI[w.exercise_type] || '💪'}</span>
                  <div>
                    <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{w.exercise_type}</p>
                    <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                      {w.duration_min} min · {formatDistanceToNow(new Date(w.logged_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-green)' }}>+{w.xp_earned} XP</p>
                  <p className="font-body text-xs" style={{ color: 'var(--gf-amber)' }}>🪙 {w.coins_earned}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
        </ScreenTransition>

        <BottomNav />
        <LevelUpOverlay />
        {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      </div>
    </PullToRefresh>
  );
}
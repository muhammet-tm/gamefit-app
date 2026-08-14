import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Dumbbell, Bot, ShoppingBag, Trophy, Flame, Droplet } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { getNextLevelXP, getCurrentLevelXP } from '@/lib/mockData';
import { getRank } from '@/lib/ranks';
import RankEmblem from '@/components/gamefit/RankEmblem';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import UserAvatar from '@/components/avatar/UserAvatar';
import BottomNav from '@/components/gamefit/BottomNav';
import { disciplineIcon } from '@/lib/disciplines';
import Icon from '@/components/ui/Icon';
import LevelUpOverlay from '@/components/gamefit/LevelUpOverlay';
import NotificationsPanel from '@/components/gamefit/NotificationsPanel';
import StreakCalendar from '@/components/gamefit/StreakCalendar';
import XPMeter from '@/components/gamefit/XPMeter';
import StatTile from '@/components/gamefit/StatTile';
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
  const rank = getRank(level);
  const title = rank.display;

  // One primary action, then three quiet ones. These used to be four equally
  // weighted cards in four different accent colours, which is a colour with no
  // meaning: nothing distinguished the categories the colours marked, and with
  // everything emphasised nothing was.
  const secondaryActions = [
    { label: 'Coach', icon: Bot, path: '/avatar-coach' },
    { label: 'Ranks', icon: Trophy, path: '/leaderboard' },
    { label: 'Shop', icon: ShoppingBag, path: '/marketplace' },
  ];

  const recentWorkouts = workouts.slice(0, 3);


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
            {user.first_name}
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
                style={{ backgroundColor: '#E5614A' }}>{unreadCount}</span>
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
              {/* The hero card is a plain container, not a link, so there is
                  no competing tap target here. */}
              <UserAvatar user={user} size={90} interactive />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full font-heading font-black text-xs"
                style={{ backgroundColor: 'var(--gf-green)', color: '#0B1A24' }}>
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
                <Flame size={14} color="#E0680E" />
                <span className="font-body text-sm font-medium" style={{ color: '#E0680E' }}>
                  {user.current_streak} day streak
                </span>
              </div>
              <XPMeter
                value={user.total_xp - currentLevelXP}
                max={nextLevelXP - currentLevelXP}
                label={`${user.total_xp.toLocaleString()} XP`}
                caption={`${Math.max(nextLevelXP - user.total_xp, 0).toLocaleString()} to go`}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats. One hairline grid, so the figures align as a row of data
            rather than three separate cards competing with the rank hero. */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl"
          style={{ backgroundColor: 'var(--gf-border)', border: '1px solid var(--gf-border)' }}>
          <StatTile value={user.total_xp.toLocaleString()} label="Total XP" />
          <StatTile
            value={user.weekly_workout_count}
            unit={` / ${user.weekly_goal || 3}`}
            label="This week"
          />
          <StatTile value={user.coins} label="Coins" tone="ember" />
        </div>

        {/* Primary action */}
        <div>
          <motion.button
            onClick={() => navigate('/train')}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl font-heading font-black uppercase tracking-[0.04em] transition-transform active:scale-[0.98]"
            style={{ backgroundColor: 'var(--gf-gold)', color: '#0B1A24', fontSize: 15 }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.98 }}>
            <Dumbbell size={20} strokeWidth={2.1} aria-hidden="true" />
            Log a workout
          </motion.button>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {secondaryActions.map((action, i) => (
              <motion.button key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-[7px] rounded-2xl px-2 pb-2.5 pt-3 transition-transform active:scale-95"
                style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i + 0.42 }}
                whileTap={{ scale: 0.95 }}>
                <action.icon size={21} strokeWidth={1.8} aria-hidden="true"
                  style={{ color: 'var(--gf-text-secondary)' }} />
                <span className="font-body text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: 'var(--gf-text-secondary)' }}>
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
                style={{ backgroundColor: 'rgba(244, 176, 68,0.06)', border: '1.5px dashed rgba(244, 176, 68,0.4)' }}>
                <Droplet size={30} strokeWidth={1.6} aria-hidden="true" className="mx-auto mb-1.5" style={{ color: 'var(--gf-text-secondary)' }} />
                <p className="font-heading font-black text-base" style={{ color: 'var(--gf-gold-text)' }}>
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
                  <Icon name={disciplineIcon(w.exercise_type)} size={26} style={{ color: 'var(--gf-gold-text)' }} />
                  <div>
                    <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{w.exercise_type}</p>
                    <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                      {w.duration_min} min · {formatDistanceToNow(new Date(w.logged_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-black text-sm" style={{ color: 'var(--gf-gold-text)' }}>+{w.xp_earned} XP</p>
                  <p className="font-mono text-xs font-semibold tabular-nums" style={{ color: 'var(--gf-ember-text)' }}>+{w.coins_earned}</p>
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
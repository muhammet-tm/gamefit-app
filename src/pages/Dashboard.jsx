import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Dumbbell, Bot, ShoppingBag, Trophy, Droplet } from 'lucide-react';
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
import XPRing from '@/components/gamefit/XPRing';
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
  const nextTitle = level >= 10 ? rank.display : getRank(level + 1).display;
  const xpToGo = Math.max(nextLevelXP - user.total_xp, 0);

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
            {theme === 'dark' ? <Sun size={18} color="var(--gf-ember-text)" /> : <Moon size={18} color="var(--gf-gold-text)" />}
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
        {/* Ignition hero: the avatar stands inside its own XP ring, and the
            one number that matters (XP left to the next rank) is the only
            large figure on the screen. Total XP moved into the ring's
            accessible label and the caption under the number. */}
        <motion.section
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}
        >
          <XPRing
            value={user.total_xp - currentLevelXP}
            max={nextLevelXP - currentLevelXP}
            label={`${user.total_xp.toLocaleString()} XP. ${xpToGo.toLocaleString()} XP to ${nextTitle}`}
          >
            {/* The ring is a readout, not a link, so the avatar keeps its
                own tap reaction without a competing target. */}
            <UserAvatar user={user} size={132} interactive />
          </XPRing>

          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-heading text-xs font-bold"
              style={{ backgroundColor: 'var(--gf-text-primary)', color: 'var(--gf-bg-primary)' }}>
              LVL {level}
            </span>
            <RankEmblem level={level} size={20} />
            {/* Rank name in text color: the tier hues are tuned for dark
                grounds, and the emblem beside it already carries the tier. */}
            <span className="font-heading text-base font-semibold" style={{ color: 'var(--gf-text-primary)' }}>
              {title}
            </span>
          </div>

          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-heading text-5xl font-extrabold leading-none tabular-nums tracking-[-0.03em]"
              style={{ color: 'var(--gf-text-primary)' }}>
              {xpToGo.toLocaleString()}
            </span>
            <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
              {level >= 10 ? 'XP past the top rank' : `XP to ${nextTitle}`}
            </span>
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums" style={{ color: 'var(--gf-text-secondary)' }}>
            {user.total_xp.toLocaleString()} XP total
          </p>
        </motion.section>

        {/* Stats. One hairline grid, so the figures align as a row of data. */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl"
          style={{ backgroundColor: 'var(--gf-border)', border: '1px solid var(--gf-border)' }}>
          <StatTile value={user.current_streak} label="Day streak" tone="ember" />
          <StatTile
            value={user.weekly_workout_count}
            unit={` / ${user.weekly_goal || 3}`}
            label="This week"
          />
          <StatTile value={user.coins} label="Coins" tone="gold" />
        </div>

        {/* Primary action */}
        <div>
          <motion.button
            onClick={() => navigate('/train')}
            className="gf-cta flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl font-heading font-bold transition-transform active:scale-[0.98]"
            style={{ fontSize: 15 }}
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
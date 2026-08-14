import {
  Award, Crown, Droplet, Dumbbell, Flame, Hash, Medal, Moon, Shield, Sparkles, Star, Swords, Target, TrendingUp, Trophy, Zap,
} from 'lucide-react';

// Badge definitions and unlock logic for GameFit

export const BADGES = [
  // Workout count milestones
  { id: 'first_sweat',    Icon: Droplet, label: 'First Sweat',    desc: 'Log your first workout',          condition: (w, u) => w.length >= 1 },
  { id: 'ten_workouts',   Icon: Hash, label: 'Ten Strong',     desc: 'Log 10 workouts',                  condition: (w, u) => w.length >= 10 },
  { id: 'fifty_workouts', Icon: Medal, label: 'Half Century',   desc: 'Log 50 workouts',                  condition: (w, u) => w.length >= 50 },
  { id: 'century',        Icon: Award, label: 'Century Club',   desc: 'Log 100 workouts',                 condition: (w, u) => w.length >= 100 },

  // Streak milestones
  { id: 'streak_3',       Icon: Flame, label: 'On Fire',        desc: '3-day workout streak',            condition: (w, u) => u.best_streak >= 3 },
  { id: 'streak_7',       Icon: Zap, label: 'Week Warrior',   desc: '7-day workout streak',            condition: (w, u) => u.best_streak >= 7 },
  { id: 'streak_30',      Icon: Star, label: 'Unstoppable',    desc: '30-day workout streak',           condition: (w, u) => u.best_streak >= 30 },

  // XP milestones
  { id: 'xp_1000',        Icon: Swords, label: 'XP Hunter',     desc: 'Earn 1,000 total XP',             condition: (w, u) => u.total_xp >= 1000 },
  { id: 'xp_5000',        Icon: Trophy, label: 'XP Champion',   desc: 'Earn 5,000 total XP',             condition: (w, u) => u.total_xp >= 5000 },
  { id: 'xp_10000',       Icon: Crown, label: 'XP Legend',     desc: 'Earn 10,000 total XP',            condition: (w, u) => u.total_xp >= 10000 },

  // Variety badges
  { id: 'variety',        Icon: Target, label: 'All-Rounder',   desc: 'Try 5 different exercise types',  condition: (w, u) => new Set(w.map(x => x.exercise_type)).size >= 5 },
  { id: 'high_intensity', Icon: Sparkles, label: 'Beast Mode',    desc: 'Complete 10 High intensity sessions', condition: (w, u) => w.filter(x => x.intensity_level === 'High').length >= 10 },

  // Level milestones
  { id: 'level_5',        Icon: Shield, label: 'Champion',      desc: 'Reach Level 5',                  condition: (w, u) => u.current_level >= 5 },
  { id: 'level_10',       Icon: Moon, label: 'Titan',          desc: 'Reach Level 10',                 condition: (w, u) => u.current_level >= 10 },

  // Personal records (awarded server-side by log_pr; read from user.badges)
  { id: 'record_setter',  Icon: TrendingUp, label: 'Record Setter',  desc: 'Log your first personal record',  condition: (w, u) => (u.badges || []).includes('record_setter') },
  { id: 'record_breaker', Icon: Dumbbell, label: 'Record Breaker', desc: 'Beat one of your own PRs',        condition: (w, u) => (u.badges || []).includes('record_breaker') },
];

export function getEarnedBadges(workouts, user) {
  return BADGES.filter(b => b.condition(workouts, user));
}

export function getEarnedBadgeIds(workouts, user) {
  return new Set(getEarnedBadges(workouts, user).map(b => b.id));
}
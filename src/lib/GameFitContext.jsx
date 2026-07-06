import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLevelForXP, getAvatarTier, LEVEL_THRESHOLDS } from './mockData';
import { base44 } from '@/api/base44Client';

const GameFitContext = createContext(null);

const FRESH_USER = {
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  age: null,
  height_cm: null,
  weight_kg: null,
  bmi: null,
  account_type: 'regular',
  joined_at: null,
  total_xp: 0,
  current_level: 1,
  coins: 0,
  current_streak: 0,
  best_streak: 0,
  weekly_workout_count: 0,
  last_workout_date: null,
  avatar_tier: 1,
  fitness_goal: 'General Fitness',
  fitness_level: 'Beginner',
  gender: 'male',
  avatar_config: { gender: 'male', skin: 'light', outfit: 'blue', hair: 'brown' },
  connected_apps: [],
  onboarding_complete: false,
  ai_requests_this_month: 0,
  theme_preference: 'dark',
};

export function GameFitProvider({ children }) {
  const [user, setUser] = useState(FRESH_USER);
  const [workouts, setWorkouts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });
  const [levelUpData, setLevelUpData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load real user data on mount
  React.useEffect(() => {
    async function loadUser() {
      try {
        const me = await base44.auth.me();
        if (!me?.id) {
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Get user entity record for profile fields saved during onboarding
        let profileData = {};
        try {
          const userRecords = await base44.entities.User.filter({ id: me.id }, '-created_date', 1);
          if (userRecords && userRecords.length > 0) {
            profileData = userRecords[0];
          }
        } catch (e) {
          // User entity not accessible or no record yet
        }

        // Load all workouts to compute real stats
        let realTotalXP = 0;
        let realCoins = 0;
        let realLevel = 1;
        let realTier = 1;
        let currentStreak = 0;
        let bestStreak = profileData.best_streak || 0;
        let weeklyCount = 0;
        let lastWorkoutDate = null;
        let realWorkouts = [];

        try {
          const records = await base44.entities.Workout.filter({ user_id: me.id }, '-created_date', 200);
          if (records && records.length > 0) {
            realTotalXP = records.reduce((sum, w) => sum + (w.xp_earned || 0), 0);
            realCoins = records.reduce((sum, w) => sum + (w.coins_earned || 0), 0);
            realLevel = getLevelForXP(realTotalXP);
            realTier = getAvatarTier(realLevel);

            const sorted = [...records].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            lastWorkoutDate = sorted[0] ? new Date(sorted[0].created_date).toISOString() : null;

            weeklyCount = records.filter(w => (Date.now() - new Date(w.created_date)) < 7 * 24 * 60 * 60 * 1000).length;

            // Use streak_count from the most recent workout record (it was computed at log time)
            currentStreak = sorted[0]?.streak_count || 0;
            bestStreak = Math.max(bestStreak, currentStreak);

            realWorkouts = sorted.slice(0, 20).map(w => ({
              id: w.id,
              user_id: w.user_id,
              exercise_type: w.exercise_type,
              duration_min: w.duration_min,
              intensity_level: w.intensity_level,
              xp_earned: w.xp_earned,
              coins_earned: w.coins_earned,
              notes: w.notes || '',
              logged_at: w.created_date,
            }));
          }
        } catch (e) {
          // No workouts yet — new user starts at zero
        }

        const nameParts = (me.full_name || '').split(' ');

        setUser({
          ...FRESH_USER,
          id: me.id,
          email: me.email,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          // Profile fields from User entity (saved during onboarding/profile edit)
          age: profileData.age ?? FRESH_USER.age,
          height_cm: profileData.height_cm ?? FRESH_USER.height_cm,
          weight_kg: profileData.weight_kg ?? FRESH_USER.weight_kg,
          bmi: profileData.bmi ?? FRESH_USER.bmi,
          account_type: profileData.account_type || 'regular',
          fitness_goal: profileData.fitness_goal || FRESH_USER.fitness_goal,
          fitness_level: profileData.fitness_level || FRESH_USER.fitness_level,
          gender: profileData.gender || FRESH_USER.gender,
          avatar_config: profileData.avatar_config || FRESH_USER.avatar_config,
          connected_apps: profileData.connected_apps || [],
          onboarding_complete: profileData.onboarding_complete || false,
          theme_preference: profileData.theme_preference || theme,
          // Stats computed from real workout records (all zero for new users)
          total_xp: realTotalXP,
          current_level: realLevel,
          avatar_tier: realTier,
          coins: realCoins,
          current_streak: currentStreak,
          best_streak: bestStreak,
          weekly_workout_count: weeklyCount,
          last_workout_date: lastWorkoutDate,
          ai_requests_this_month: 0,
        });

        setWorkouts(realWorkouts);
      } catch (e) {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      setUser(u => ({ ...u, theme_preference: next }));
      return next;
    });
  }, []);

  // Apply theme on mount
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addWorkout = useCallback(async (workout) => {
    const prevUser = user;
    const prevWorkouts = workouts;

    const newWorkout = { ...workout, id: `w${Date.now()}`, user_id: user.id, logged_at: new Date().toISOString() };
    setWorkouts(prev => [newWorkout, ...prev]);

    const prevLevel = user.current_level;
    const newTotalXP = user.total_xp + workout.xp_earned;
    const newLevel = getLevelForXP(newTotalXP);
    const newTier = getAvatarTier(newLevel);
    const newWeekly = user.weekly_workout_count + 1;

    // Streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.last_workout_date ? new Date(user.last_workout_date) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);
    const diffDays = lastDate ? Math.floor((today - lastDate) / 86400000) : 999;
    const newStreak = diffDays <= 1 ? user.current_streak + 1 : 1;

    // Streak bonus coins
    const streakMultiplier = newStreak >= 7 ? 1.5 : newStreak >= 3 ? 1.25 : 1;
    const bonusCoins = Math.round(workout.coins_earned * streakMultiplier);

    setUser(prev => ({
      ...prev,
      total_xp: newTotalXP,
      current_level: newLevel,
      avatar_tier: newTier,
      coins: prev.coins + bonusCoins,
      weekly_workout_count: newWeekly,
      current_streak: newStreak,
      best_streak: Math.max(prev.best_streak, newStreak),
      last_workout_date: new Date().toISOString(),
    }));

    if (newLevel > prevLevel) {
      const levelBonusCoins = newLevel * 50;
      setLevelUpData({ newLevel, newTier, bonusCoins: levelBonusCoins });
      setUser(prev => ({ ...prev, coins: prev.coins + levelBonusCoins }));
    }

    // Persist to entity — triggers the notification automation
    base44.auth.me().then(me => {
      if (!me?.email) return;
      base44.entities.Workout.create({
        user_id: me.id || user.id,
        user_email: me.email,
        user_name: me.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        exercise_type: workout.exercise_type,
        duration_min: workout.duration_min,
        intensity_level: workout.intensity_level,
        xp_earned: workout.xp_earned,
        coins_earned: workout.coins_earned,
        total_xp_after: newTotalXP,
        level_before: prevLevel,
        level_after: newLevel,
        streak_count: newStreak,
        notes: workout.notes || '',
      }).catch(err => {
        console.warn('Workout entity save failed:', err.message);
        setUser(prevUser);
        setWorkouts(prevWorkouts);
      });
    }).catch(() => {});

    return newWorkout;
  }, [user, workouts]);

  const claimLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const updateUser = useCallback(async (updates) => {
    // Whitelist only safe, user-editable profile fields — never forward admin/payment fields
    const SAFE_FIELDS = [
      'first_name', 'last_name', 'fitness_goal', 'fitness_level',
      'age', 'height_cm', 'weight_kg', 'bmi', 'gender',
      'avatar_config', 'connected_apps', 'onboarding_complete',
      'theme_preference', 'calorie_goal', 'owned_accessories',
      'equipped_accessory',
    ];
    const safeUpdates = {};
    for (const key of SAFE_FIELDS) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    const prevUser = user;
    setUser(prev => ({ ...prev, ...safeUpdates }));

    try {
      const me = await base44.auth.me();
      if (me?.id) {
        await base44.entities.User.update(me.id, safeUpdates);
      }
    } catch (err) {
      console.warn('User update failed:', err.message);
      setUser(prevUser);
    }
  }, [user]);

  const redeemReward = useCallback((reward) => {
    if (user.coins < reward.cost_coins) return false;
    setUser(prev => ({ ...prev, coins: prev.coins - reward.cost_coins }));
    return true;
  }, [user.coins]);

  const login = useCallback((userData) => {
    setUser(userData || FRESH_USER);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const incrementAIRequests = useCallback(() => {
    setUser(prev => ({ ...prev, ai_requests_this_month: prev.ai_requests_this_month + 1 }));
  }, []);

  return (
    <GameFitContext.Provider value={{
      user, workouts, notifications, theme, levelUpData, isAuthenticated, loading,
      unreadCount, toggleTheme, addWorkout, claimLevelUp,
      markNotificationRead, markAllRead, updateUser, redeemReward,
      login, logout, incrementAIRequests,
      LEVEL_THRESHOLDS,
    }}>
      {children}
    </GameFitContext.Provider>
  );
}

export function useGameFit() {
  const ctx = useContext(GameFitContext);
  if (!ctx) throw new Error('useGameFit must be used within GameFitProvider');
  return ctx;
}
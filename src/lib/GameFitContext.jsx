import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLevelForXP, getAvatarTier, LEVEL_THRESHOLDS } from './mockData';
import { supabase, getMe, updateProfile, callRpc } from '@/api/supabase';
import { normalizeAvatarConfig, isLegacyConfig } from '@/components/avatar/migrate';

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
  avatar_config: { version: 2, class: 'warrior', skin_tone: 'tan', hair: 'short_black' },
  connected_apps: [],
  onboarding_complete: false,
  ai_requests_this_month: 0,
  theme_preference: 'dark',
  weekly_goal: 3,
  badges: [],
  owned_accessories: [],
  equipped_accessory: null,
  calorie_goal: null,
  role: 'user',
};

function mapWorkoutRow(w) {
  return {
    id: w.id,
    user_id: w.user_id,
    exercise_type: w.exercise_type,
    duration_min: w.duration_min,
    intensity_level: w.intensity_level,
    xp_earned: w.xp_earned,
    coins_earned: w.coins_earned,
    notes: w.notes || '',
    logged_at: w.created_at,
  };
}

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
  const [lastWorkoutResult, setLastWorkoutResult] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load the profile — the server is the single source of truth for all
  // stats. The old version re-derived XP/coins by summing workout records
  // (which made spent coins reappear on refresh); now they're just columns.
  React.useEffect(() => {
    async function loadUser() {
      try {
        const me = await getMe();
        if (!me?.id) {
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);

        const [workoutsRes, aiCountRes] = await Promise.all([
          supabase.from('workouts').select('*')
            .order('created_at', { ascending: false }).limit(20),
          supabase.from('ai_request_logs').select('id', { count: 'exact', head: true })
            .eq('month_key', new Date().toISOString().slice(0, 7)),
        ]);

        const rows = workoutsRes.data ?? [];
        const weeklyCount = rows.filter(
          w => Date.now() - new Date(w.created_at) < 7 * 24 * 60 * 60 * 1000,
        ).length;

        const nameParts = (me.full_name || '').split(' ');

        setUser({
          ...FRESH_USER,
          id: me.id,
          email: me.email,
          first_name: me.first_name || nameParts[0] || '',
          last_name: me.last_name || nameParts.slice(1).join(' ') || '',
          age: me.age ?? null,
          height_cm: me.height_cm ?? null,
          weight_kg: me.weight_kg ?? null,
          bmi: me.bmi ?? null,
          account_type: me.account_type || 'regular',
          fitness_goal: me.fitness_goal || FRESH_USER.fitness_goal,
          fitness_level: me.fitness_level || FRESH_USER.fitness_level,
          gender: me.gender || FRESH_USER.gender,
          avatar_config: normalizeAvatarConfig(me.avatar_config),
          connected_apps: me.connected_apps || [],
          onboarding_complete: me.onboarding_complete || false,
          theme_preference: me.theme_preference || theme,
          calorie_goal: me.calorie_goal ?? null,
          weekly_goal: me.weekly_goal ?? 3,
          role: me.role || 'user',
          joined_at: me.created_at || null,
          // server-authoritative stats
          total_xp: me.total_xp ?? 0,
          current_level: me.current_level ?? 1,
          avatar_tier: getAvatarTier(me.current_level ?? 1),
          coins: (me.total_coins_earned ?? 0) - (me.total_coins_spent ?? 0),
          current_streak: me.current_streak ?? 0,
          best_streak: me.best_streak ?? 0,
          badges: me.badges || [],
          owned_accessories: me.owned_accessories || [],
          equipped_accessory: me.equipped_accessory || null,
          weekly_workout_count: weeklyCount,
          last_workout_date: rows[0]?.created_at ?? null,
          ai_requests_this_month: aiCountRes.count ?? 0,
        });

        setWorkouts(rows.map(mapWorkoutRow));

        // one-time upgrade of old avatar configs to the v2 shape
        if (me.avatar_config && isLegacyConfig(me.avatar_config)) {
          updateProfile({ avatar_config: normalizeAvatarConfig(me.avatar_config) }).catch(() => {});
        }
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

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Log a workout. The UI updates instantly with a local preview; the server
  // computes the real XP/coins/streak/badges and its answer overwrites the
  // preview (so nobody can cheat, and every device agrees).
  const addWorkout = useCallback(async (workout) => {
    const prevUser = user;
    const prevWorkouts = workouts;

    const optimistic = {
      ...workout,
      id: `pending-${Date.now()}`,
      user_id: user.id,
      logged_at: new Date().toISOString(),
    };
    setWorkouts(prev => [optimistic, ...prev]);
    setUser(prev => ({
      ...prev,
      total_xp: prev.total_xp + (workout.xp_earned || 0),
      coins: prev.coins + (workout.coins_earned || 0),
      weekly_workout_count: prev.weekly_workout_count + 1,
      last_workout_date: optimistic.logged_at,
    }));

    try {
      const res = await callRpc('log_workout', {
        p_exercise_type: workout.exercise_type,
        p_duration_min: workout.duration_min,
        p_intensity: workout.intensity_level,
        p_notes: workout.notes || '',
      });

      // reconcile with the server's authoritative numbers
      setWorkouts(prev => [
        mapWorkoutRow(res.workout),
        ...prev.filter(w => w.id !== optimistic.id),
      ]);
      setUser(prev => ({
        ...prev,
        total_xp: res.user.total_xp,
        current_level: res.user.current_level,
        avatar_tier: res.user.avatar_tier,
        coins: res.user.coins,
        current_streak: res.user.current_streak,
        best_streak: res.user.best_streak,
        badges: res.new_badges?.length
          ? [...new Set([...(prev.badges || []), ...res.new_badges])]
          : prev.badges,
      }));

      if (res.level_up) {
        setLevelUpData({
          newLevel: res.level_up.new_level,
          newTier: res.level_up.new_tier,
          bonusCoins: res.level_up.bonus_coins,
        });
      }
      setLastWorkoutResult(res);
      return res;
    } catch (err) {
      console.warn('Workout save failed:', err.message);
      setUser(prevUser);
      setWorkouts(prevWorkouts);
      throw err;
    }
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
    // Only profile fields a user may edit about themselves. Economy, premium,
    // and accessories are server-owned (the database also refuses them).
    const SAFE_FIELDS = [
      'first_name', 'last_name', 'fitness_goal', 'fitness_level',
      'age', 'height_cm', 'weight_kg', 'bmi', 'gender',
      'avatar_config', 'connected_apps', 'onboarding_complete',
      'theme_preference', 'calorie_goal', 'weekly_goal',
    ];
    const safeUpdates = {};
    for (const key of SAFE_FIELDS) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    if (Object.keys(safeUpdates).length === 0) return;

    const prevUser = user;
    setUser(prev => ({ ...prev, ...safeUpdates }));
    try {
      await updateProfile(safeUpdates);
    } catch (err) {
      console.warn('Profile update failed:', err.message);
      setUser(prevUser);
      throw err;
    }
  }, [user]);

  // Buy or equip a shop accessory — the server checks the price and balance
  // atomically, so double-spends and free items are impossible.
  const purchaseAccessory = useCallback(async (accessoryId) => {
    try {
      const res = await callRpc('purchase_accessory', {
        p_action: 'purchase',
        p_accessory_id: accessoryId,
      });
      setUser(prev => ({
        ...prev,
        coins: res.coins,
        owned_accessories: res.owned_accessories,
        equipped_accessory: res.equipped_accessory,
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const equipAccessory = useCallback(async (accessoryId) => {
    try {
      const res = await callRpc('purchase_accessory', {
        p_action: accessoryId ? 'equip' : 'unequip',
        p_accessory_id: accessoryId,
      });
      setUser(prev => ({ ...prev, equipped_accessory: res.equipped_accessory }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const login = useCallback((userData) => {
    setUser(userData || FRESH_USER);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(FRESH_USER);
    setWorkouts([]);
  }, []);

  const incrementAIRequests = useCallback(() => {
    setUser(prev => ({ ...prev, ai_requests_this_month: prev.ai_requests_this_month + 1 }));
  }, []);

  return (
    <GameFitContext.Provider value={{
      user, workouts, notifications, theme, levelUpData, lastWorkoutResult,
      isAuthenticated, loading,
      unreadCount, toggleTheme, addWorkout, claimLevelUp,
      markNotificationRead, markAllRead, updateUser,
      purchaseAccessory, equipAccessory,
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

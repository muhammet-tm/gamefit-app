// Mock data for GameFit app

export const MOCK_USER = {
  id: 'user-001',
  first_name: 'Alex',
  last_name: 'Chen',
  email: 'alex.chen@gamefit.app',
  age: 27,
  height_cm: 175,
  weight_kg: 72,
  bmi: 23.5,
  account_type: 'regular',
  joined_at: '2024-01-15T00:00:00Z',
  total_xp: 3200,
  current_level: 4,
  coins: 245,
  current_streak: 5,
  best_streak: 12,
  weekly_workout_count: 3,
  avatar_style: 'warrior',
  avatar_tier: 2,
  fitness_goal: 'Build muscle mass',
  fitness_level: 'Intermediate',
  gender: 'male',
  weight_kg: 75,
  height_cm: 175,
  bmi: 24.5,
  avatar_config: { gender: 'male', skin: 'light', outfit: 'blue', hair: 'brown' },
  connected_apps: [],
  onboarding_complete: true,
  ai_requests_this_month: 4,
  theme_preference: 'dark',
};

export const MOCK_WORKOUTS = [
  {
    id: 'w1',
    user_id: 'user-001',
    exercise_type: 'Weight Training',
    duration_min: 60,
    intensity_level: 'High',
    notes: 'Upper body focus',
    logged_at: '2024-06-04T18:30:00Z',
    xp_earned: 120,
    coins_earned: 12,
  },
  {
    id: 'w2',
    user_id: 'user-001',
    exercise_type: 'Running',
    duration_min: 30,
    intensity_level: 'Medium',
    notes: '',
    logged_at: '2024-06-03T07:15:00Z',
    xp_earned: 90,
    coins_earned: 9,
  },
  {
    id: 'w3',
    user_id: 'user-001',
    exercise_type: 'HIIT',
    duration_min: 45,
    intensity_level: 'High',
    notes: 'Tabata intervals',
    logged_at: '2024-06-02T19:00:00Z',
    xp_earned: 180,
    coins_earned: 18,
  },
  {
    id: 'w4',
    user_id: 'user-001',
    exercise_type: 'Yoga',
    duration_min: 45,
    intensity_level: 'Low',
    notes: 'Evening flow',
    logged_at: '2024-06-01T20:00:00Z',
    xp_earned: 90,
    coins_earned: 9,
  },
];

export const MOCK_LEADERBOARD = [
  { user_id: 'u1', display_name: 'FitKing99', total_xp: 48200, current_level: 10, avatar_style: 'warrior', avatar_tier: 5, rank: 1 },
  { user_id: 'u2', display_name: 'IronMage', total_xp: 41500, current_level: 9, avatar_style: 'mage', avatar_tier: 4, rank: 2 },
  { user_id: 'u3', display_name: 'ShadowNinja', total_xp: 38900, current_level: 9, avatar_style: 'ninja', avatar_tier: 4, rank: 3 },
  { user_id: 'u4', display_name: 'ArrowKing', total_xp: 29800, current_level: 8, avatar_style: 'archer', avatar_tier: 4, rank: 4 },
  { user_id: 'u5', display_name: 'StealthK', total_xp: 24500, current_level: 7, avatar_style: 'knight', avatar_tier: 4, rank: 5 },
  { user_id: 'u6', display_name: 'GainzGuru', total_xp: 19200, current_level: 6, avatar_style: 'warrior', avatar_tier: 3, rank: 6 },
  { user_id: 'u7', display_name: 'MysticFit', total_xp: 15600, current_level: 6, avatar_style: 'mage', avatar_tier: 3, rank: 7 },
  { user_id: 'u8', display_name: 'QuickFire', total_xp: 12300, current_level: 5, avatar_style: 'archer', avatar_tier: 3, rank: 8 },
  { user_id: 'u9', display_name: 'IronGuard', total_xp: 9800, current_level: 5, avatar_style: 'knight', avatar_tier: 3, rank: 9 },
  { user_id: 'u10', display_name: 'SwiftBlade', total_xp: 7200, current_level: 4, avatar_style: 'ninja', avatar_tier: 2, rank: 10 },
  { user_id: 'user-001', display_name: 'Alex C.', total_xp: 3200, current_level: 4, avatar_style: 'warrior', avatar_tier: 2, rank: 14 },
];

export const MOCK_REWARDS = [
  { id: 'r1', reward_name: 'Neon Warrior Skin', description: 'Unlock a glowing neon variant for your Warrior avatar', cost_coins: 150, reward_type: 'AvatarItem', image_url: null, is_premium_only: false, is_active: true },
  { id: 'r2', reward_name: 'Sports Brand 20% Off', description: 'Get 20% off your next sportswear purchase', cost_coins: 200, reward_type: 'DiscountCode', image_url: null, is_premium_only: false, is_active: true },
  { id: 'r3', reward_name: 'Shadow Mage Skin', description: 'Unlock a dark shadow variant for your Mage avatar', cost_coins: 180, reward_type: 'AvatarItem', image_url: null, is_premium_only: false, is_active: true },
  { id: 'r4', reward_name: 'Protein Supplement 15% Off', description: 'Discount code for a premium protein supplement brand', cost_coins: 300, reward_type: 'DiscountCode', image_url: null, is_premium_only: true, is_active: true },
  { id: 'r5', reward_name: 'Golden Knight Skin', description: 'Legendary golden armor variant for Knight avatar', cost_coins: 500, reward_type: 'AvatarItem', image_url: null, is_premium_only: true, is_active: true },
  { id: 'r6', reward_name: 'Gym Membership 10% Off', description: 'Save on your gym membership renewal', cost_coins: 400, reward_type: 'DiscountCode', image_url: null, is_premium_only: false, is_active: true },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Streak at Risk! 🔥', body: 'Your 5-day streak is at risk! Log a workout to keep it alive.', type: 'streak_risk', is_read: false, created_at: '2024-06-05T09:00:00Z' },
  { id: 'n2', title: 'Level Up! 🎮', body: 'You reached Level 4! Check your new avatar evolution.', type: 'level_up', is_read: true, created_at: '2024-06-03T20:00:00Z' },
  { id: 'n3', title: 'Coach G Has Tips 🤖', body: 'Coach G has a new personalized recommendation for you.', type: 'ai_tip', is_read: false, created_at: '2024-06-02T14:30:00Z' },
  { id: 'n4', title: 'Weekly Summary 📊', body: 'Last week: 3 workouts, 390 XP earned. Keep it up!', type: 'weekly_summary', is_read: true, created_at: '2024-06-01T09:00:00Z' },
];

export const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5500, 8000, 12000, 18000, 26000, 35000];

export const AVATAR_TIER_LEVELS = { 1: [1,2], 2: [3,4], 3: [5,6], 4: [7,8,9], 5: [10] };

export const LEVEL_TITLES = {
  1: 'Recruit', 2: 'Recruit',
  3: 'Warrior', 4: 'Warrior',
  5: 'Champion', 6: 'Champion',
  7: 'Legend', 8: 'Legend', 9: 'Legend',
  10: 'Titan'
};

export function calcXP(duration_min, intensity_level) {
  const baseXP = duration_min * 2;
  const multipliers = { Low: 1.0, Medium: 1.5, High: 2.0 };
  return Math.round(baseXP * (multipliers[intensity_level] || 1.0));
}

export function calcCoins(xp) {
  return Math.floor(xp / 10);
}

export function getLevelForXP(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

export function getAvatarTier(level) {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 6) return 3;
  if (level <= 9) return 4;
  return 5;
}

export function getNextLevelXP(level) {
  return LEVEL_THRESHOLDS[level] || 35000;
}

export function getCurrentLevelXP(level) {
  return LEVEL_THRESHOLDS[level - 1] || 0;
}
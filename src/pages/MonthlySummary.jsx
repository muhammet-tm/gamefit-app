import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Flame, Dumbbell, Calendar } from 'lucide-react';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import { base44 } from '@/api/base44Client';
import { useGameFit } from '@/lib/GameFitContext';
import BottomNav from '@/components/gamefit/BottomNav';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlySummary() {
  const navigate = useNavigate();
  const { user } = useGameFit();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('getMonthlyStats', { month, year });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch monthly stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month, year]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
      <ScreenHeader 
        title="Monthly Summary"
        subtitle={`${MONTHS[month - 1]} ${year}`}
      />

        {/* Month selector */}
        <div className="flex items-center justify-center gap-4 px-5 py-3">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg transition">
            <ChevronLeft size={20} color="var(--gf-text-secondary)" />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-lg transition"
            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}>
            <ChevronRight size={20} color="var(--gf-text-secondary)" />
          </button>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--gf-green)' }} />
        </div>
      ) : !stats || stats.stats.totalWorkouts === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
            No workouts logged in {MONTHS[month - 1]} {year}. Start training to build your summary!
          </p>
        </div>
      ) : (
        <div className="px-5 pt-6 space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} color="var(--gf-green)" />
                <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gf-text-secondary)' }}>XP Earned</p>
              </div>
              <p className="font-heading font-black text-3xl" style={{ color: 'var(--gf-text-primary)' }}>
                {stats.stats.totalXP.toLocaleString()}
              </p>
            </motion.div>

            <motion.div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={18} color="var(--gf-amber)" />
                <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gf-text-secondary)' }}>Calories Burned</p>
              </div>
              <p className="font-heading font-black text-3xl" style={{ color: 'var(--gf-text-primary)' }}>
                {stats.stats.totalCaloriesBurned.toLocaleString()}
              </p>
            </motion.div>

            <motion.div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell size={18} color="#EF4444" />
                <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gf-text-secondary)' }}>Weight Lifted</p>
              </div>
              <p className="font-heading font-black text-3xl" style={{ color: 'var(--gf-text-primary)' }}>
                {stats.stats.totalWeightLifted.toLocaleString()}
                <span className="text-base font-body ml-1" style={{ color: 'var(--gf-text-secondary)' }}>kg</span>
              </p>
            </motion.div>

            <motion.div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} color="#4FC3F7" />
                <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gf-text-secondary)' }}>Workouts</p>
              </div>
              <p className="font-heading font-black text-3xl" style={{ color: 'var(--gf-text-primary)' }}>
                {stats.stats.totalWorkouts}
              </p>
            </motion.div>
          </div>

          {/* Key Metrics */}
          <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
            <h3 className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>Key Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Total Duration</span>
                <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>
                  {stats.stats.totalDuration} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Avg Duration / Workout</span>
                <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>
                  {Math.round(stats.stats.totalDuration / stats.stats.totalWorkouts)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Total Meal Calories</span>
                <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>
                  {stats.stats.totalMealCalories.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Avg Daily Calories</span>
                <span className="font-heading font-black" style={{ color: 'var(--gf-text-primary)' }}>
                  {stats.stats.averageCaloriesPerDay}
                </span>
              </div>
            </div>
          </div>

          {/* Exercise Breakdown */}
          {Object.keys(stats.breakdown).length > 0 && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
              <h3 className="font-heading font-black text-base mb-3" style={{ color: 'var(--gf-text-primary)' }}>Exercise Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(stats.breakdown).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
                    <div className="flex-1">
                      <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{type}</p>
                      <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                        {data.count} sessions · {data.duration} min
                      </p>
                    </div>
                    <span className="font-heading font-black text-base" style={{ color: 'var(--gf-green)' }}>
                      +{data.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Day */}
          {stats.bestDay && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'linear-gradient(135deg, rgba(200,255,0,0.1), rgba(124,58,237,0.1))', border: '1px solid var(--gf-border)' }}>
              <h3 className="font-heading font-black text-base mb-2" style={{ color: 'var(--gf-text-primary)' }}>🔥 Best Day of the Month</h3>
              <div className="space-y-1">
                <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
                  {new Date(stats.bestDay.date).toLocaleDateString()} · {stats.bestDay.exercise}
                </p>
                <p className="font-heading font-black text-2xl" style={{ color: 'var(--gf-green)' }}>
                  +{stats.bestDay.xp} XP
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                  {stats.bestDay.duration} minutes
                </p>
              </div>
            </div>
          )}
        </div>
        )}
        </ScreenTransition>

        <BottomNav />
        </div>
        );
        }
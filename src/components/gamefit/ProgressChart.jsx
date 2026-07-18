import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/api/supabase';
import { useGameFit } from '@/lib/GameFitContext';

// Daily XP over the last 14 days — the "is my effort trending up?" glance.
export default function ProgressChart() {
  const { user } = useGameFit();
  const [data, setData] = useState([]);
  const [total14, setTotal14] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);
      const { data: rows } = await supabase
        .from('workouts')
        .select('created_at, xp_earned')
        .gte('created_at', since.toISOString())
        .limit(300);
      if (!alive) return;

      const byDay = new Map();
      for (let i = 0; i < 14; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        byDay.set(d.toDateString(), {
          label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          xp: 0,
        });
      }
      let sum = 0;
      for (const w of rows || []) {
        const key = new Date(w.created_at).toDateString();
        if (byDay.has(key)) {
          byDay.get(key).xp += w.xp_earned || 0;
          sum += w.xp_earned || 0;
        }
      }
      setData([...byDay.values()]);
      setTotal14(sum);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user.total_xp]);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 h-44 animate-pulse"
        style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }} />
    );
  }

  return (
    <div className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>
          XP · Last 14 Days
        </h3>
        <span className="font-heading font-black text-sm" style={{ color: 'var(--gf-green)' }}>
          {total14.toLocaleString()} XP
        </span>
      </div>
      {total14 === 0 ? (
        <p className="font-body text-sm py-8 text-center" style={{ color: 'var(--gf-text-secondary)' }}>
          Log a workout to start your graph 📈
        </p>
      ) : (
        <div style={{ width: '100%', height: 150 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C8FF00" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" interval={3} tickLine={false} axisLine={false}
                tick={{ fill: 'var(--gf-text-secondary)', fontSize: 10, fontFamily: 'DM Sans' }} />
              <YAxis tickLine={false} axisLine={false} width={38} allowDecimals={false}
                tick={{ fill: 'var(--gf-text-secondary)', fontSize: 10, fontFamily: 'DM Sans' }} />
              <Tooltip
                cursor={{ stroke: 'var(--gf-border)' }}
                contentStyle={{
                  backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)',
                  borderRadius: 12, fontFamily: 'DM Sans', fontSize: 12,
                }}
                labelStyle={{ color: 'var(--gf-text-secondary)' }}
                itemStyle={{ color: 'var(--gf-green)' }}
                formatter={(v) => [`${v} XP`, null]}
              />
              <Area type="monotone" dataKey="xp" stroke="#C8FF00" strokeWidth={2}
                fill="url(#xpFill)" dot={false} activeDot={{ r: 4, fill: '#C8FF00' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

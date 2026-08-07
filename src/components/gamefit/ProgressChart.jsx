import React, { useState, useEffect } from 'react';
import { AreaChart, Area } from '@/components/charts/area-chart';
import { Grid } from '@/components/charts/grid';
import { XAxis } from '@/components/charts/x-axis';
import { ChartTooltip } from '@/components/charts/tooltip';
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
        // The chart is a time series — it needs a real Date on the x axis and
        // formats the tick labels itself.
        byDay.set(d.toDateString(), { date: d, xp: 0 });
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
        <AreaChart
          aspectRatio="auto"
          data={data}
          margin={{ top: 12, right: 12, bottom: 30, left: 12 }}
          style={{ height: 170 }}
          xDataKey="date"
        >
          <Grid horizontal numTicksRows={4} vertical={false} />
          <Area
            dataKey="xp"
            fill="var(--gf-green)"
            fillOpacity={0.35}
            gradientToOpacity={0.02}
            strokeWidth={2}
          />
          <XAxis numTicks={4} />
          <ChartTooltip
            rows={(point) => [
              { label: 'XP', value: point.xp, color: 'var(--gf-green)' },
            ]}
          />
        </AreaChart>
      )}
    </div>
  );
}

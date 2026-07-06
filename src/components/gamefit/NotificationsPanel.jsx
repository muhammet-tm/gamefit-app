import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCheck } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META = {
  streak_risk: { icon: '🔥', label: 'Streak Risk' },
  level_up: { icon: '🎮', label: 'Level Up' },
  ai_tip: { icon: '🤖', label: 'Coach G' },
  reward_expiry: { icon: '🪙', label: 'Reward' },
  weekly_summary: { icon: '📊', label: 'Summary' },
};

export default function NotificationsPanel({ onClose }) {
  const { notifications, markNotificationRead, markAllRead } = useGameFit();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--gf-bg-primary)' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        <div>
          <h2 className="font-heading font-black text-2xl" style={{ color: 'var(--gf-text-primary)' }}>Notifications</h2>
          <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
            {notifications.filter(n => !n.is_read).length} unread
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium"
            style={{ backgroundColor: 'var(--gf-bg-elevated)', color: 'var(--gf-text-secondary)' }}>
            <CheckCheck size={14} /> All read
          </button>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            <X size={18} color="var(--gf-text-secondary)" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {notifications.map((n) => {
          const meta = TYPE_META[n.type] || { icon: '🔔', label: 'Notification' };
          return (
            <motion.button key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className="w-full text-left rounded-2xl p-4 flex gap-3 transition-all"
              style={{
                backgroundColor: n.is_read ? 'var(--gf-bg-surface)' : 'var(--gf-bg-elevated)',
                border: `1px solid ${n.is_read ? 'var(--gf-border)' : 'rgba(200,255,0,0.2)'}`,
              }}
              whileTap={{ scale: 0.98 }}>
              <span className="text-2xl mt-0.5">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--gf-text-primary)' }}>{n.title}</p>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full ml-2 flex-shrink-0" style={{ backgroundColor: 'var(--gf-green)' }} />
                  )}
                </div>
                <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--gf-text-secondary)' }}>{n.body}</p>
                <p className="font-body text-[10px] mt-1" style={{ color: 'var(--gf-text-secondary)', opacity: 0.6 }}>
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
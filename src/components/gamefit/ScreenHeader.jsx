import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScreenHeader({ 
  title, 
  subtitle, 
  showBackButton = true,
  rightAction,
  onBack,
  variant = 'default' // 'default', 'minimal'
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRootPage = ['/', '/dashboard', '/train', '/coach', '/leaderboard', '/marketplace', '/avatar', '/profile'].includes(location.pathname);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="px-5 pb-3 flex items-center gap-3"
        style={{ 
          backgroundColor: 'var(--gf-bg-surface)', 
          borderBottom: '1px solid var(--gf-border)',
          paddingTop: 'calc(1rem + env(safe-area-inset-top))'
        }}>
        {showBackButton && !isRootPage && (
          <button onClick={handleBack} className="p-1.5 rounded-lg transition-all active:scale-90"
            style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--gf-text-primary)' }} />
          </button>
        )}
        <div className="flex-1">
          {title && <h2 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>{title}</h2>}
        </div>
        {rightAction}
      </div>
    );
  }

  return (
    <motion.div 
      className="px-5 pb-4"
      style={{ 
        backgroundColor: 'var(--gf-bg-surface)',
        paddingTop: 'calc(2rem + env(safe-area-inset-top))'
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton && !isRootPage && (
            <button onClick={handleBack} className="p-1.5 rounded-lg transition-all active:scale-90 flex-shrink-0"
              style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
              <ChevronLeft size={20} style={{ color: 'var(--gf-text-primary)' }} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {title && <h1 className="font-heading font-black text-2xl truncate" style={{ color: 'var(--gf-text-primary)' }}>{title}</h1>}
            {subtitle && <p className="font-body text-xs mt-1" style={{ color: 'var(--gf-text-secondary)' }}>{subtitle}</p>}
          </div>
        </div>
        {rightAction && <div className="flex-shrink-0 ml-3">{rightAction}</div>}
      </div>
    </motion.div>
  );
}
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Bot, User, Shield } from 'lucide-react';
import { useTabStack } from '@/lib/TabStackNavigation';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home', tab: 'dashboard' },
  { path: '/train', icon: Dumbbell, label: 'Train', tab: 'train' },
  { path: '/coach', icon: Bot, label: 'Coach', tab: 'coach' },
  { path: '/avatar', icon: Shield, label: 'Avatar', tab: 'avatar' },
  { path: '/profile', icon: User, label: 'Profile', tab: 'profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTab, switchTab, getTabLocation } = useTabStack();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gf"
      style={{ backgroundColor: 'var(--gf-bg-surface)', borderColor: 'var(--gf-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label, tab }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={path}
              onClick={() => {
                switchTab(tab);
                const tabLocation = getTabLocation(tab);
                navigate(tabLocation);
              }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all select-none"
            >
              <Icon
                size={22}
                style={{ color: isActive ? 'var(--gf-green)' : 'var(--gf-text-secondary)' }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className="text-[10px] font-medium font-body"
                style={{ color: isActive ? 'var(--gf-green)' : 'var(--gf-text-secondary)' }}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--gf-green)' }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
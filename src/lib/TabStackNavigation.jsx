import React, { createContext, useContext, useState, useCallback } from 'react';

const TabStackContext = createContext();

// Transient routes that don't affect tab history
const TRANSIENT_ROUTES = [
  '/strava/callback',
  '/premium',
  '/monthly-summary',
  '/avatar-coach',
  '/leaderboard', // Full leaderboard is a modal-like experience
];

export function TabStackProvider({ children }) {
  // Each tab maintains independent scroll position and location
  const [tabStack, setTabStack] = useState({
    dashboard: { location: '/dashboard', scrollPos: 0 },
    train: { location: '/train', scrollPos: 0 },
    coach: { location: '/coach', scrollPos: 0 },
    leaderboard: { location: '/leaderboard', scrollPos: 0 },
    avatar: { location: '/avatar', scrollPos: 0 },
    profile: { location: '/profile', scrollPos: 0 },
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [scrollContainers, setScrollContainers] = useState({});

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const navigateInTab = useCallback((tab, location) => {
    // Don't record transient routes in tab history
    if (TRANSIENT_ROUTES.includes(location)) return;
    
    setTabStack(prev => ({
      ...prev,
      [tab]: { ...prev[tab], location }
    }));
  }, []);

  const saveScrollPosition = useCallback((tab, scrollPos) => {
    setTabStack(prev => ({
      ...prev,
      [tab]: { ...prev[tab], scrollPos }
    }));
  }, []);

  const registerScrollContainer = useCallback((tab, ref) => {
    setScrollContainers(prev => ({
      ...prev,
      [tab]: ref
    }));
  }, []);

  const getTabLocation = useCallback((tab) => {
    return tabStack[tab]?.location || `/${tab}`;
  }, [tabStack]);

  const getTabScrollPos = useCallback((tab) => {
    return tabStack[tab]?.scrollPos || 0;
  }, [tabStack]);

  const isTransientRoute = useCallback((location) => {
    return TRANSIENT_ROUTES.includes(location);
  }, []);

  const value = {
    activeTab,
    tabStack,
    switchTab,
    navigateInTab,
    saveScrollPosition,
    registerScrollContainer,
    getTabLocation,
    getTabScrollPos,
    scrollContainers,
    isTransientRoute,
  };

  return (
    <TabStackContext.Provider value={value}>
      {children}
    </TabStackContext.Provider>
  );
}

export function useTabStack() {
  const context = useContext(TabStackContext);
  if (!context) {
    throw new Error('useTabStack must be used within TabStackProvider');
  }
  return context;
}
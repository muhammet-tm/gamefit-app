import React, { createContext, useContext, useState, useCallback } from 'react';

const TabNavigationContext = createContext();

export function TabNavigationProvider({ children }) {
  // Each tab maintains its own route history
  const [tabHistories, setTabHistories] = useState({
    dashboard: ['/dashboard'],
    train: ['/train'],
    coach: ['/coach'],
    leaderboard: ['/leaderboard'],
    avatar: ['/avatar'],
    profile: ['/profile'],
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const pushRoute = useCallback((tab, route) => {
    setTabHistories(prev => ({
      ...prev,
      [tab]: [...prev[tab], route]
    }));
    setActiveTab(tab);
  }, []);

  const popRoute = useCallback((tab) => {
    setTabHistories(prev => ({
      ...prev,
      [tab]: prev[tab].length > 1 ? prev[tab].slice(0, -1) : prev[tab]
    }));
  }, []);

  const setTabRoot = useCallback((tab) => {
    setTabHistories(prev => ({
      ...prev,
      [tab]: [prev[tab][0]]
    }));
  }, []);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const getCurrentRoute = useCallback(() => {
    const history = tabHistories[activeTab];
    return history?.[history.length - 1] || '/dashboard';
  }, [activeTab, tabHistories]);

  const value = {
    tabHistories,
    activeTab,
    pushRoute,
    popRoute,
    setTabRoot,
    switchTab,
    getCurrentRoute,
  };

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabNavigationProvider');
  }
  return context;
}
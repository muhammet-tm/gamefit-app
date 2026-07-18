import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GameFitProvider } from '@/lib/GameFitContext';
import { AuthProvider } from '@/lib/AuthContext';
import { TabStackProvider } from '@/lib/TabStackNavigation';

// Pages
import Splash from '@/pages/Splash';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Train from '@/pages/Train';
import Coach from '@/pages/Coach';
import Leaderboard from '@/pages/Leaderboard';
import Marketplace from '@/pages/Marketplace';
import AvatarScreen from '@/pages/AvatarScreen';
import Profile from '@/pages/Profile';
import MonthlySummary from '@/pages/MonthlySummary';
import Admin from '@/pages/Admin';
import Premium from '@/pages/Premium';
import StravaCallback from '@/pages/StravaCallback';
import AvatarCoach from '@/pages/AvatarCoach';
import AdminRoute from '@/components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
      <GameFitProvider>
        <QueryClientProvider client={queryClientInstance}>
          <TabStackProvider>
            <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/train" element={<Train />} />
            <Route path="/train/*" element={<Train />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/coach/*" element={<Coach />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/leaderboard/*" element={<Leaderboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/*" element={<Marketplace />} />
            <Route path="/avatar" element={<AvatarScreen />} />
            <Route path="/avatar/*" element={<AvatarScreen />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/monthly-summary" element={<MonthlySummary />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="/premium" element={<Premium />} />
            <Route path="/strava/callback" element={<StravaCallback />} />
            <Route path="/avatar-coach" element={<AvatarCoach />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TabStackProvider>
        </QueryClientProvider>
      </GameFitProvider>
      </AuthProvider>
      <Toaster />
    </Router>
  )
}

export default App
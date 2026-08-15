import React, { Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GameFitProvider } from '@/lib/GameFitContext';
import { AuthProvider } from '@/lib/AuthContext';
import { TabStackProvider } from '@/lib/TabStackNavigation';
import RouteMeta from '@/lib/RouteMeta';
import AdminRoute from '@/components/AdminRoute';

// Splash is the first paint, so it stays in the main chunk — lazy-loading the
// very first screen would only add a round trip before anything appears.
import Splash from '@/pages/Splash';

// Every other screen is fetched on demand. Before this, opening the login page
// downloaded the chart library, the marketplace, the avatar editor and the
// admin console as well — one 1.8 MB file for a screen with two inputs on it.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Train = lazy(() => import('@/pages/Train'));
const Coach = lazy(() => import('@/pages/Coach'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const AvatarScreen = lazy(() => import('@/pages/AvatarScreen'));
const Profile = lazy(() => import('@/pages/Profile'));
const MonthlySummary = lazy(() => import('@/pages/MonthlySummary'));
const Admin = lazy(() => import('@/pages/Admin'));
const Premium = lazy(() => import('@/pages/Premium'));
const StravaCallback = lazy(() => import('@/pages/StravaCallback'));
const AvatarCoach = lazy(() => import('@/pages/AvatarCoach'));
const AvatarGallery = lazy(() => import('@/pages/AvatarGallery'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));
const DeleteAccount = lazy(() => import('@/pages/legal/DeleteAccount'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/** Shown while a route chunk is in flight. Matches the app ground, so a fast
 *  connection reads as an instant transition rather than a white flash. */
function RouteFallback() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'var(--gf-bg-primary)' }}
      role="status"
      aria-label="Loading"
    >
      <div
        className="w-8 h-8 border-4 rounded-full animate-spin"
        style={{ borderColor: 'var(--gf-border)', borderTopColor: 'var(--gf-gold)' }}
      />
    </div>
  );
}

function App() {
  return (
    // reducedMotion="user" makes every framer animation in the app honour the
    // OS setting. There are 111 <motion.*> elements across 27 files and none
    // of them checked it individually; only the vendored chart components did.
    // Transforms and layout movement are dropped, opacity and colour survive,
    // so feedback that confirms an action stays legible.
    <MotionConfig reducedMotion="user">
    <Router>
      <AuthProvider>
      <GameFitProvider>
        <QueryClientProvider client={queryClientInstance}>
          <TabStackProvider>
            <RouteMeta />
            <Suspense fallback={<RouteFallback />}>
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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/strava/callback" element={<StravaCallback />} />
            <Route path="/avatar-coach" element={<AvatarCoach />} />
            {import.meta.env.DEV && (
              <Route path="/avatar-gallery" element={<AvatarGallery />} />
            )}
            {/* Was: <Navigate to="/" replace />. A mistyped URL silently became
                the home page, so nobody learned they had a bad link and every
                wrong address looked like a real page to a crawler. */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </TabStackProvider>
        </QueryClientProvider>
      </GameFitProvider>
      </AuthProvider>
      <Toaster />
    </Router>
    </MotionConfig>
  )
}

export default App

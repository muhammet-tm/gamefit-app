import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useGameFit } from '@/lib/GameFitContext';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';

export default function StravaCallback() {
  const navigate = useNavigate();
  const { updateUser } = useGameFit();
  const [status, setStatus] = useState('Connecting to Strava...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      setStatus('Connection cancelled.');
      setTimeout(() => navigate('/avatar'), 2000);
      return;
    }

    const exchange = async () => {
      try {
        setStatus('Exchanging tokens...');
        const res = await base44.functions.invoke('stravaAuth', { action: 'exchange', code });
        const { athlete } = res.data;

        // Tokens are persisted server-side; just update local state with athlete info
        await updateUser({
          connected_apps: ['strava'],
          strava_athlete: athlete,
        });

        setStatus(`Connected as ${athlete.firstname} ${athlete.lastname}! 🎉`);
        setTimeout(() => navigate('/avatar'), 1500);
      } catch (err) {
        console.error('Strava exchange error:', err);
        setStatus('Connection failed. Please try again.');
        setTimeout(() => navigate('/avatar'), 2500);
      }
    };

    exchange();
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
        <ScreenHeader 
          title="Connecting Strava"
          subtitle="Syncing your fitness data"
        />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
          <div className="text-5xl mb-4">🏃</div>
          <p className="font-heading font-black text-2xl mb-2" style={{ color: 'var(--gf-text-primary)' }}>
            {status}
          </p>
          <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>
            Redirecting you back to GameFit...
          </p>
          {/* Spinner */}
          <div className="mt-6 w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: 'var(--gf-border)', borderTopColor: 'var(--gf-green)' }} />
        </div>
      </ScreenTransition>
    </div>
  );
}
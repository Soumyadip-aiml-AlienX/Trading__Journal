'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import OnboardingWizard from '@/components/shared/OnboardingWizard';

interface OnboardingWrapperProps {
  initialShow: boolean;
}

export default function OnboardingWrapper({ initialShow }: OnboardingWrapperProps) {
  // Don't eagerly show based on server hint — wait for client-side auth verification
  const [show, setShow] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndSettings = async () => {
      const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');
      if (isAuthPage) {
        setIsAuthVerified(false);
        setShow(false);
        return;
      }

      try {
        // Step 1: Verify user is actually authenticated
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          setIsAuthVerified(false);
          setShow(false);
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          setIsAuthVerified(false);
          setShow(false);
          return;
        }

        // Step 2: User is authenticated — check settings
        setIsAuthVerified(true);
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings && settings.onboardingDone) {
            // Already completed onboarding
            setShow(false);
            return;
          }
        }

        // Step 3: onboardingDone is false — check if user has existing trades
        // If they do, they're an existing user and we should auto-complete onboarding
        try {
          const tradesRes = await fetch('/api/trades?limit=1');
          if (tradesRes.ok) {
            const trades = await tradesRes.json();
            if (Array.isArray(trades) && trades.length > 0) {
              // Existing user with trades — auto-mark onboarding as done
              setShow(false);
              // Silently update settings in background
              fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accountSize: 100000,
                  currentPhase: 'Phase 1',
                  riskPerTrade: 1,
                  maxTradesPerDay: 2,
                }),
              }).catch(() => {});
              return;
            }
          }
        } catch {
          // If trades check fails, fall through to show onboarding
        }

        // Truly new user — show onboarding
        setShow(true);
      } catch (err) {
        console.error('Failed to verify session for onboarding:', err);
        setIsAuthVerified(false);
        setShow(false);
      }
    };

    checkAuthAndSettings();
  }, [pathname]);

  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  if (!show || isAuthPage || !isAuthVerified) return null;

  return (
    <OnboardingWizard
      onComplete={() => {
        setShow(false);
        window.location.reload();
      }}
      onSkip={() => {
        setShow(false);
        window.location.reload();
      }}
    />
  );
}

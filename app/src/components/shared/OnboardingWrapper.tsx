'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import OnboardingWizard from '@/components/shared/OnboardingWizard';

interface OnboardingWrapperProps {
  initialShow: boolean;
}

export default function OnboardingWrapper({ initialShow }: OnboardingWrapperProps) {
  const [show, setShow] = useState(initialShow);
  const [isAuthVerified, setIsAuthVerified] = useState(initialShow);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndSettings = async () => {
      const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');
      if (isAuthPage) {
        setIsAuthVerified(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const settingsRes = await fetch('/api/settings');
            if (settingsRes.ok) {
              const settings = await settingsRes.json();
              setShow(!settings || !settings.onboardingDone);
            } else {
              setShow(true);
            }
            setIsAuthVerified(true);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to verify session for onboarding:', err);
      }
      setIsAuthVerified(false);
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
    />
  );
}

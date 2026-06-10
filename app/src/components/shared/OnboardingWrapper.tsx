'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import OnboardingWizard from '@/components/shared/OnboardingWizard';

interface OnboardingWrapperProps {
  initialShow: boolean;
}

export default function OnboardingWrapper({ initialShow }: OnboardingWrapperProps) {
  const [show, setShow] = useState(initialShow);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const loggedIn = localStorage.getItem('maven_logged_in') === 'true';
    setIsAuthenticated(loggedIn);
  }, [pathname]);

  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  if (!show || isAuthPage || !isAuthenticated) return null;

  return (
    <OnboardingWizard
      onComplete={() => {
        setShow(false);
        window.location.reload();
      }}
    />
  );
}

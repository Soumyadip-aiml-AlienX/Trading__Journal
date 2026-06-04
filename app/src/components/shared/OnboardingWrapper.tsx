'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import OnboardingWizard from '@/components/shared/OnboardingWizard';

interface OnboardingWrapperProps {
  initialShow: boolean;
}

export default function OnboardingWrapper({ initialShow }: OnboardingWrapperProps) {
  const [show, setShow] = useState(initialShow);
  const pathname = usePathname();

  if (!show || pathname === '/login') return null;

  return (
    <OnboardingWizard
      onComplete={() => {
        setShow(false);
        // Refresh the page to load initial settings properly
        window.location.reload();
      }}
    />
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Psychology Check-in',
  description: 'Pre-session psychological readiness assessment and mindset tracking for disciplined trading.',
};

export default function PsychologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

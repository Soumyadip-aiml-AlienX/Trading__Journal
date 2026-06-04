import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance Analytics',
  description: 'Detailed performance metrics, equity curves, win rates, and trading statistics.',
};

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

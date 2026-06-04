import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Monitor',
  description: 'Real-time risk management dashboard with position sizing, drawdown tracking, and lot calculators.',
};

export default function RiskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

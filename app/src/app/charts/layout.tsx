import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Charts',
  description: 'Analyze live market price action and indicators using advanced TradingView charting tools.',
};

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

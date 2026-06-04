import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alerts Log',
  description: 'TradingView webhook alerts log. View, convert, and manage incoming trade signals.',
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

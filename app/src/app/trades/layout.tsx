import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Log',
  description: 'View, filter, and manage all your trading history. Track P&L, sessions, and trade outcomes.',
};

export default function TradesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

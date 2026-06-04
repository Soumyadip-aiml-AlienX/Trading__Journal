import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Reflection',
  description: 'End-of-day trading reflection and journaling. Review trades, record lessons, and plan improvements.',
};

export default function ReflectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

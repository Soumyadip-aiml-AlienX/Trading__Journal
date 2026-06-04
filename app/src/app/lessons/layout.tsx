import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lessons Database',
  description: 'Searchable database of trading lessons, patterns, and insights collected from your journal.',
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

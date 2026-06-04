import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Export',
  description: 'Generate and export professional daily trading recap PDFs with performance summaries.',
};

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

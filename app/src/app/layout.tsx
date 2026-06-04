import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import OnboardingWrapper from '@/components/shared/OnboardingWrapper';
import prisma from '@/lib/prisma';
import { ToastProvider } from '@/components/shared/Toast';
import { DrawdownProvider } from '@/context/DrawdownContext';
import LayoutShell from '@/components/layout/LayoutShell';
import QuickEntryModal from '@/components/shared/QuickEntryModal';
import KeyboardShortcutHelper from '@/components/shared/KeyboardShortcutHelper';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Maven Trading Journal | SMC + ICT Hybrid',
    template: '%s | Maven Trading Journal',
  },
  description:
    'Professional-grade trading journal for Maven Prop Firm. Track trades, analyze performance, monitor risk, and export daily PDFs with TradingView integration.',
  keywords: ['trading journal', 'prop firm', 'SMC', 'ICT', 'forex', 'trading log', 'risk management'],
  openGraph: {
    title: 'Maven Trading Journal',
    description: 'Professional-grade trading journal for prop firm traders. Track, analyze, and optimize your trading performance.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Maven Trading Journal',
  },
  twitter: {
    card: 'summary',
    title: 'Maven Trading Journal',
    description: 'Professional-grade trading journal for prop firm traders.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromRequest();
  let initialShowOnboarding = false;
  if (user) {
    try {
      const settings = await prisma.settings.findUnique({
        where: { userId: user.id }
      });
      initialShowOnboarding = !settings || !settings.onboardingDone;
    } catch (err) {
      console.error('Failed to load settings in layout:', err);
    }
  }

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://s3.tradingview.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        {/* JSON-LD Structured Data (S2) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Maven Trading Journal',
              description: 'Professional-grade trading journal for Maven Prop Firm traders using SMC + ICT strategies.',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Windows, macOS, Linux',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
        <ToastProvider>
          <DrawdownProvider>
            {/* Onboarding Flow */}
            <OnboardingWrapper initialShow={initialShowOnboarding} />

            {/* Layout Shell */}
            <LayoutShell>{children}</LayoutShell>

            {/* Global Keyboard Shortcut Dialog */}
            <QuickEntryModal />

            {/* Keyboard Shortcut Helper (CO5) */}
            <KeyboardShortcutHelper />
          </DrawdownProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

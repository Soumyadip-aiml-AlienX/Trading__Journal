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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F1A2E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Maven Journal" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const VERCEL_API_HOST = 'https://trading-journal-7aak6mnss-soumyadip-aiml-alienxs-projects.vercel.app';
                const isCapacitor = window.location.origin.startsWith('file://') || 
                                    window.location.origin.startsWith('capacitor://') ||
                                    (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'));
                
                if (isCapacitor) {
                  const originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      return originalFetch(VERCEL_API_HOST + input, init);
                    }
                    return originalFetch(input, init);
                  };
                }
              })();
            `,
          }}
        />
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

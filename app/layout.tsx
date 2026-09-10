import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseGuard - Enterprise Bug & Security Monitoring',
  description: 'Real-time bug monitoring and security threat detection for your applications.',
  keywords: 'monitoring, security, bug tracking, SaaS, threat detection',
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  metadataBase: new URL('https://pulseguardhq.xyz'),
  openGraph: {
    type: 'website',
    url: 'https://pulseguardhq.xyz',
    title: 'PulseGuard',
    description: 'Real-time bug monitoring and security threat detection',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PulseGuard'
      }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* DNS Prefetch for external services */}
        <link rel="dns-prefetch" href="https://YOUR_AUTH0_DOMAIN.auth0.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://sentry.io" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <Providers>
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}

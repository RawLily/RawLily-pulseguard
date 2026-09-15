import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from '@/app/providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'PulseGuard - Enterprise Bug & Security Monitoring',
  description: 'Real-time threat detection and bug monitoring for modern applications. Monitor security threats, track bugs, and get instant alerts with enterprise-grade reliability.',
  keywords: 'monitoring, security, bug tracking, SaaS, threat detection, enterprise, alerting',
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
  
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pulseguardhq.xyz'),
  
  openGraph: {
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://pulseguardhq.xyz',
    title: 'PulseGuard - Enterprise Bug & Security Monitoring',
    description: 'Real-time threat detection and bug monitoring for modern applications',
    siteName: 'PulseGuard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PulseGuard - Enterprise Monitoring',
        type: 'image/png'
      }
    ]
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
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
        <link rel="preconnect" href="https://auth0.auth0.com" />
        <link rel="preconnect" href="https://api.stripe.com" />
        <link rel="preconnect" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://sentry.io" />

        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body className="antialiased bg-white text-slate-900">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 mt-4">Loading...</p>
              </div>
            </div>
          }
        >
          <Providers>
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}

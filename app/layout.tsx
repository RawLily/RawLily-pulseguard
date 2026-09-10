import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseGuard - Enterprise Bug & Security Monitoring',
  description: 'Real-time bug monitoring and security threat detection for your applications.',
  keywords: 'monitoring, security, bug tracking, SaaS, threat detection',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
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

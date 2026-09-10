import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseGuard - Enterprise Bug & Security Monitoring',
  description: 'Real-time bug monitoring and security threat detection for your applications.',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}

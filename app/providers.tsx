'use client';

import { SessionProvider } from '@auth0/nextjs-auth0/client';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </SessionProvider>
  );
}

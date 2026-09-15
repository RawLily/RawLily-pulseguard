'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Suspense, useEffect } from 'react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 text-white border-r border-gray-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/dashboard" className="text-xl font-bold hover:text-blue-400 transition">
            🛡️ PulseGuard
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            📊 Overview
          </Link>
          <Link href="/dashboard/events" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            🐛 Events
          </Link>
          <Link href="/dashboard/analytics" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            📈 Analytics
          </Link>
          <Link href="/dashboard/integrations" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            🔗 Integrations
          </Link>
          <Link href="/dashboard/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            ⚙️ Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <a 
            href="/api/auth/logout" 
            className="block text-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
          >
            Sign Out
          </a>
        </div>
      </aside>

      <main className="md:ml-64">
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
          <Link href="/" className="text-lg font-bold text-blue-600">
            🛡️ PulseGuard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 max-w-xs truncate">{user?.name || 'User'}</span>
            <a href="/api/auth/logout" className="text-sm text-red-600 hover:text-red-700 font-medium">
              Logout
            </a>
          </div>
        </div>

        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <div className="p-6 md:p-8">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
}

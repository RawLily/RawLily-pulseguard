'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/api/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            🛡️ PulseGuard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <a 
              href="/api/auth/logout" 
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              Logout
            </a>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome, {user.name || user.email}
        </h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <p className="text-gray-600 mt-2">Active Monitors</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-gray-600 mt-2">Events This Month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <p className="text-gray-600 mt-2">Threats Detected</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">99.9%</div>
            <p className="text-gray-600 mt-2">Uptime</p>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">API Key</h2>
          <p className="text-gray-600 mb-4">
            Use this key to integrate PulseGuard with your applications.
          </p>
          <div className="bg-gray-100 p-4 rounded border border-gray-300 mb-4 font-mono text-sm break-all">
            pg_key_demo_1234567890abcdef
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Generate New Key
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600">No recent activity. Start by adding your first monitor.</p>
          <Link 
            href="/dashboard/monitors" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Monitor
          </Link>
        </div>
      </div>
    </div>
  );
}

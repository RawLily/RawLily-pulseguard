'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

interface Stats {
  activeMonitors: number;
  eventsThisMonth: number;
  threatsDetected: number;
  uptime: number;
  recentEvents: Array<{
    id: string;
    type: 'bug' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    createdAt: string;
  }>;
}

interface ApiKey {
  id: string;
  key: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [user, userLoading, router]);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setError(null);

        const response = await fetch('/api/stats');

        if (!response.ok) {
          throw new Error(`Stats fetch failed: ${response.status}`);
        }

        const data: Stats = await response.json();
        setStats(data);

        Sentry.addBreadcrumb({
          category: 'dashboard',
          message: 'Stats fetched successfully',
          level: 'info',
          data: {
            activeMonitors: data.activeMonitors,
            eventsThisMonth: data.eventsThisMonth,
          },
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load stats. Please try again.');

        Sentry.captureException(err, {
          tags: { page: 'dashboard' },
          level: 'error',
        });
      } finally {
        setStatsLoading(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Fetch API key
  useEffect(() => {
    async function fetchApiKey() {
      try {
        setApiKeyLoading(true);

        const response = await fetch('/api/api-keys');

        if (!response.ok) {
          // No API key yet is not an error
          if (response.status === 404) {
            setApiKey(null);
            return;
          }
          throw new Error(`API key fetch failed: ${response.status}`);
        }

        const data = await response.json();
        setApiKey(data);
      } catch (err) {
        console.error('Failed to fetch API key:', err);
        // Don't set error, just leave apiKey as null
      } finally {
        setApiKeyLoading(false);
      }
    }

    if (user) {
      fetchApiKey();
    }
  }, [user]);

  const handleGenerateNewKey = async () => {
    try {
      setGeneratingKey(true);

      const response = await fetch('/api/api-keys', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate API key: ${response.status}`);
      }

      const data = await response.json();
      setApiKey(data);
      setShowApiKey(true);

      Sentry.addBreadcrumb({
        category: 'dashboard',
        message: 'New API key generated',
        level: 'info',
      });
    } catch (err) {
      console.error('Failed to generate API key:', err);
      alert('Failed to generate API key. Please try again.');

      Sentry.captureException(err, {
        tags: { action: 'generate-api-key' },
      });
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey?.key) {
      navigator.clipboard.writeText(apiKey.key);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'security':
        return '🔒';
      case 'performance':
        return '⚡';
      default:
        return '📌';
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user?.name || user?.email}</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <div className="text-slate-400 text-sm font-medium mb-2">Active Monitors</div>
          <div className="text-3xl font-bold text-green-400">
            {statsLoading ? '...' : stats?.activeMonitors || 0}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <div className="text-slate-400 text-sm font-medium mb-2">Events This Month</div>
          <div className="text-3xl font-bold text-blue-400">
            {statsLoading ? '...' : stats?.eventsThisMonth || 0}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <div className="text-slate-400 text-sm font-medium mb-2">Threats Detected</div>
          <div className="text-3xl font-bold text-red-400">
            {statsLoading ? '...' : stats?.threatsDetected || 0}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <div className="text-slate-400 text-sm font-medium mb-2">Uptime</div>
          <div className="text-3xl font-bold text-green-400">
            {statsLoading ? '...' : `${stats?.uptime || 0}%`}
          </div>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">API Key</h2>
          <button
            onClick={handleGenerateNewKey}
            disabled={generatingKey}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingKey ? 'Generating...' : 'Generate New Key'}
          </button>
        </div>

        {apiKeyLoading ? (
          <div className="text-slate-400">Loading API key...</div>
        ) : apiKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-800 rounded p-3 font-mono text-sm">
              <span className="text-slate-400">
                {showApiKey
                  ? apiKey.key
                  : `${apiKey.key.slice(0, 10)}...${apiKey.key.slice(-10)}`}
              </span>
              <button
                onClick={handleCopyApiKey}
                className="ml-auto px-3 py-1 bg-slate-600 rounded hover:bg-slate-500 text-xs transition"
              >
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-sm text-green-400 hover:text-green-300"
            >
              {showApiKey ? 'Hide' : 'Show'} full key
            </button>
            <div className="text-xs text-slate-400">
              Created: {new Date(apiKey.createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <p className="text-slate-400">
            No API key generated yet. Click "Generate New Key" to create one.
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

        {statsLoading ? (
          <div className="text-slate-400">Loading recent events...</div>
        ) : stats?.recentEvents && stats.recentEvents.length > 0 ? (
          <div className="space-y-3">
            {stats.recentEvents.map((event) => (
              <div key={event.id} className="bg-slate-800 rounded p-4 flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{getTypeIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm capitalize">{event.type}</span>
                    <span className={`text-xs font-medium ${getSeverityColor(event.severity)} uppercase`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm break-words">{event.message}</p>
                  <p className="text-slate-500 text-xs mt-2">
                    {new Date(event.createdAt).toLocaleDateString()} at{' '}
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No recent activity yet. Start sending events using your API key.</p>
        )}
      </div>
    </div>
  );
}

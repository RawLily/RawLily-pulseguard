'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Home() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('[Checkout] Error:', data.error);
        Sentry.captureException(new Error(data.error), {
          tags: { component: 'homepage-checkout' },
        });
        alert('Failed to start checkout. Please try again.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('[Checkout] Error:', error);
      Sentry.captureException(error, {
        tags: { component: 'homepage-checkout' },
      });
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Heartbeat Logo */}
          <div className="w-8 h-8 relative">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-green-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h2l2-4 2 4h2l2-4 2 4h2l2-4 2 4h3" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-green-400">PulseGuard</span>
        </div>

        <div className="space-x-4">
          {user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-white hover:text-green-400 transition">
                Dashboard
              </Link>
              <a href="/api/auth/logout" className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 transition">
                Logout
              </a>
            </>
          ) : (
            <>
              <a href="/api/auth/login" className="px-4 py-2 text-white hover:text-green-400 transition">
                Login
              </a>
              <a href="/api/auth/login" className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition font-semibold">
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">AI-Powered Bug & Threat Monitoring</h1>
        <p className="text-xl text-slate-300 mb-8">
          Detect bugs and security threats in your application automatically. Get daily reports and instant alerts.
        </p>

        {/* Security Badges */}
        <div className="flex justify-center gap-8 mb-8 flex-wrap">
          <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/50">
            <span className="text-green-400">✓</span>
            <span className="text-sm">SSL A+</span>
          </div>
          <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/50">
            <span className="text-green-400">✓</span>
            <span className="text-sm">Security A</span>
          </div>
          <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/50">
            <span className="text-green-400">✓</span>
            <span className="text-sm">Rate Limited</span>
          </div>
        </div>

        <div className="space-x-4">
          <a href="/api/auth/login" className="px-8 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700 inline-block transition">
            Get Started Free
          </a>
          <a href="#pricing" className="px-8 py-3 border border-slate-400 rounded-lg font-semibold hover:border-white inline-block transition">
            View Pricing
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-700/50 rounded-lg p-8 border border-slate-600">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-bold mb-2">Instant Alerts</h3>
            <p className="text-slate-300">Get notified immediately when critical threats are detected in your application.</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-8 border border-slate-600">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Daily Reports</h3>
            <p className="text-slate-300">Receive comprehensive daily digests of all bugs, errors, and security issues.</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-8 border border-slate-600">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">AI Detection</h3>
            <p className="text-slate-300">Advanced algorithms detect SQL injection, XSS, DDoS, and other threats automatically.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-slate-700/50 rounded-lg p-8 border border-slate-600">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-4 text-green-400">$0</div>
            <p className="text-slate-300 mb-8">50 events/month</p>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Daily email reports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Threat detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Priority support
              </li>
            </ul>
            <button 
              onClick={() => window.location.href = '/api/auth/login'}
              className="w-full px-4 py-2 bg-slate-600 rounded hover:bg-slate-500 transition font-semibold"
            >
              Get Started
            </button>
          </div>

          {/* Monthly Tier - MOST POPULAR */}
          <div className="bg-gradient-to-b from-green-900 to-slate-800 rounded-lg p-8 border-2 border-green-500 transform scale-105 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-green-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">MOST POPULAR</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 mt-4">Monthly</h3>
            <div className="text-4xl font-bold mb-2 text-green-400">$29.99</div>
            <div className="text-sm text-slate-300 mb-4">per month • Unlimited events</div>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Unlimited events
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Daily reports + instant alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Email support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> API access
              </li>
            </ul>
            <button 
              onClick={() => handleCheckout('monthly')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </button>
          </div>

          {/* Yearly Tier - BEST VALUE */}
          <div className="bg-slate-700/50 rounded-lg p-8 border border-slate-600">
            <div className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold mb-2 inline-block">
              BEST VALUE
            </div>
            <h3 className="text-2xl font-bold mb-2">Yearly</h3>
            <div className="text-4xl font-bold mb-2 text-green-400">$299.99</div>
            <div className="text-sm text-slate-300 mb-4">per year • Unlimited events • Save 17%</div>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Unlimited events
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Priority alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Email + phone support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> API access + webhooks
              </li>
            </ul>
            <button 
              onClick={() => handleCheckout('yearly')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#pricing" className="hover:text-green-400 transition">Pricing</a></li>
                <li><a href="https://docs.pulseguardhq.xyz" className="hover:text-green-400 transition">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/terms" className="hover:text-green-400 transition">Terms</a></li>
                <li><a href="/privacy" className="hover:text-green-400 transition">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/security" className="hover:text-green-400 transition">Security</a></li>
                <li><a href="/status" className="hover:text-green-400 transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="mailto:support@pulseguardhq.xyz" className="hover:text-green-400 transition">Support</a></li>
                <li><a href="mailto:hello@pulseguardhq.xyz" className="hover:text-green-400 transition">Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
            <p>&copy; 2026 PulseGuard. All rights reserved. By JLR AI Software Company.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

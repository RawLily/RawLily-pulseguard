'use client';

import { useSession, signIn } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-brand-600">
            🛡️ PulseGuard
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Welcome, {user.name || 'User'}
                </span>
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                >
                  Dashboard
                </Link>
                <a 
                  href="/api/auth/logout" 
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
                >
                  Logout
                </a>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Real-Time Bug & Security Monitoring
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Monitor application bugs and security threats in real-time. Get instant alerts and comprehensive analytics.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {!user && (
              <>
                <button
                  onClick={() => signIn()}
                  className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium"
                >
                  Get Started Free
                </button>
                <Link 
                  href="#pricing" 
                  className="px-8 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:border-gray-400 transition font-medium"
                >
                  View Pricing
                </Link>
              </>
            )}
            {user && (
              <Link 
                href="/dashboard" 
                className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white rounded-lg my-12">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Real-Time Monitoring</h3>
            <p className="text-gray-600">Instant bug and security alerts as they happen</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Analytics & Insights</h3>
            <p className="text-gray-600">Comprehensive dashboards and trend analysis</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
            <p className="text-gray-600">Military-grade encryption and compliance</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">API Integration</h3>
            <p className="text-gray-600">Easy integration with your applications</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-2">Smart Notifications</h3>
            <p className="text-gray-600">Customizable alerts via email and webhooks</p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">Fast & Reliable</h3>
            <p className="text-gray-600">99.9% uptime SLA with lightning-fast response</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-3xl font-bold text-brand-600 mb-4">$29<span className="text-sm text-gray-600">/month</span></p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>✓ Up to 10,000 events/month</li>
              <li>✓ Basic analytics</li>
              <li>✓ Email support</li>
              <li>✓ 1 team member</li>
            </ul>
            {!user ? (
              <button 
                onClick={() => signIn()} 
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Get Started
              </button>
            ) : (
              <Link 
                href="/checkout?plan=starter" 
                className="block text-center py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Subscribe
              </Link>
            )}
          </div>

          <div className="p-8 border-2 border-brand-600 rounded-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Professional</h3>
            <p className="text-3xl font-bold text-brand-600 mb-4">$99<span className="text-sm text-gray-600">/month</span></p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>✓ Up to 100,000 events/month</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority email support</li>
              <li>✓ 5 team members</li>
              <li>✓ Custom integrations</li>
            </ul>
            {!user ? (
              <button 
                onClick={() => signIn()} 
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Get Started
              </button>
            ) : (
              <Link 
                href="/checkout?plan=professional" 
                className="block text-center py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Subscribe
              </Link>
            )}
          </div>

          <div className="p-8 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-3xl font-bold text-brand-600 mb-4">Custom</p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>✓ Unlimited events</li>
              <li>✓ Full analytics suite</li>
              <li>✓ 24/7 phone support</li>
              <li>✓ Unlimited team members</li>
              <li>✓ Custom SLA</li>
            </ul>
            <a 
              href="mailto:sales@pulseguardhq.xyz" 
              className="block text-center py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">PulseGuard</h4>
              <p className="text-sm">Enterprise bug and security monitoring for modern applications.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                {/* Remove /docs link until page is created */}
                {/* <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li> */}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@pulseguardhq.xyz" className="hover:text-white transition">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 PulseGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-8 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-blue-400">PulseGuard</div>
        <div className="space-x-4">
          {user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-white">
                Dashboard
              </Link>
              <a href="/api/auth/logout" className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-700">
                Logout
              </a>
            </>
          ) : (
            <>
              <a href="/api/auth/login" className="px-4 py-2 text-white">
                Login
              </a>
              <a href="/api/auth/login" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
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
        <div className="space-x-4">
          <a href="/api/auth/login" className="px-8 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 inline-block">
            Get Started Free
          </a>
          <a href="#pricing" className="px-8 py-3 border border-slate-400 rounded-lg font-semibold hover:border-white inline-block">
            View Pricing
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-700 rounded-lg p-8">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-bold mb-2">Instant Alerts</h3>
            <p className="text-slate-300">Get notified immediately when critical threats are detected in your application.</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Daily Reports</h3>
            <p className="text-slate-300">Receive comprehensive daily digests of all bugs, errors, and security issues.</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-8">
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
          <div className="bg-slate-700 rounded-lg p-8 border border-slate-600">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-4 text-blue-400">$0</div>
            <p className="text-slate-300 mb-8">50 events/month</p>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li>✓ Daily email reports</li>
              <li>✓ Threat detection</li>
              <li>✗ Priority support</li>
            </ul>
            <button className="w-full px-4 py-2 bg-slate-600 rounded hover:bg-slate-700">Get Started</button>
          </div>

          {/* Starter Tier */}
          <div className="bg-blue-900 rounded-lg p-8 border border-blue-600 transform scale-105">
            <div className="text-sm font-bold text-blue-300 mb-2">MOST POPULAR</div>
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <div className="text-4xl font-bold mb-2 text-blue-400">$29.99</div>
            <div className="text-sm text-slate-300 mb-4">per month (5,000 events)</div>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li>✓ 5,000 events/month</li>
              <li>✓ Daily reports + instant alerts</li>
              <li>✓ Email support</li>
            </ul>
            <CheckoutButton priceId="price_1QaKpLHWcpsCOmkxBMxL5lnV" />
          </div>

          {/* Pro Tier */}
          <div className="bg-slate-700 rounded-lg p-8 border border-slate-600">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-2 text-blue-400">$299.99</div>
            <div className="text-sm text-slate-300 mb-4">per year (50,000 events)</div>
            <ul className="space-y-2 mb-8 text-slate-300">
              <li>✓ 50,000 events/month</li>
              <li>✓ Priority alerts</li>
              <li>✓ Phone support</li>
            </ul>
            <CheckoutButton priceId="price_1QaKpLHWcpsCOmkxCXxZ6mOp" />
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
                <li><Link href="#pricing">Pricing</Link></li>
                <li><a href="https://docs.pulseguardhq.xyz">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/terms">Terms</a></li>
                <li><a href="/privacy">Privacy</a></li>
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

function CheckoutButton({ priceId }: { priceId: string }) {
  const handleCheckout = async () => {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    if (!stripe) return;

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  };

  return (
    <button
      onClick={handleCheckout}
      className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-semibold"
    >
      Start Free Trial
    </button>
  );
}

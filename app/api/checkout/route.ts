import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  timeout: 30000
});

const limiter = rateLimit(20, 60000); // 20 requests per minute

interface CheckoutPayload {
  plan: 'starter' | 'professional' | 'enterprise';
  billingPeriod: 'monthly' | 'yearly';
}

const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY_STARTER || '',
    yearly: process.env.STRIPE_PRICE_ID_YEARLY_STARTER || ''
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ID_YEARLY || ''
  }
};

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  try {
    // Rate limiting
    if (!limiter.check(ip)) {
      return NextResponse.json(
        { error: 'Too many checkout attempts' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const checkoutPayload = payload as Record<string, unknown>;
    const plan = String(checkoutPayload.plan || '').toLowerCase();
    const billingPeriod = String(checkoutPayload.billingPeriod || 'monthly').toLowerCase();

    // Validate plan
    if (!['starter', 'professional'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      );
    }

    // Get price ID
    const priceId = PRICE_IDS[plan][billingPeriod as 'monthly' | 'yearly'];
    if (!priceId) {
      Sentry.captureMessage(`Price not configured for ${plan}/${billingPeriod}`, 'warning');
      return NextResponse.json(
        { error: 'Price not configured' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?checkout=cancelled`,
        customer_email: session.user.email,
        metadata: {
          userId: session.user.sub,
          plan,
          billingPeriod
        },
        subscription_data: {
          metadata: {
            userId: session.user.sub,
            plan
          }
        }
      });

      return NextResponse.json(
        {
          sessionId: checkoutSession.id,
          url: checkoutSession.url
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    } catch (stripeError) {
      Sentry.captureException(stripeError, {
        tags: {
          component: 'checkout-api',
          operation: 'stripe-session-creation',
          plan,
          billingPeriod
        }
      });

      console.error('[Checkout] Stripe error:', stripeError);

      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'checkout-api',
        severity: 'high'
      }
    });

    console.error('[Checkout] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

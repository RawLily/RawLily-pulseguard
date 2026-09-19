import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe-client';
import * as Sentry from '@sentry/nextjs';

const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = CheckoutSchema.parse(body);

    // Get price ID based on plan
    const priceId = STRIPE_PRICES[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Get current host for redirect URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

    // Create Stripe checkout session
    const result = await createCheckoutSession({
      priceId,
      email: session.user.email || '',
      userId: session.user.sub || '',
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    });

    if (result.error) {
      console.error('[Checkout] Stripe session creation failed:', result.error);

      Sentry.captureException(new Error(result.error), {
        tags: { component: 'checkout-api' },
        extra: { plan, userId: session.user.sub },
      });

      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 400 }
      );
    }

    // Log successful checkout session
    Sentry.addBreadcrumb({
      message: 'Checkout session created',
      category: 'checkout',
      level: 'info',
      data: {
        sessionId: result.sessionId,
        plan,
        userId: session.user.sub,
      },
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: result.sessionId,
        url: result.url,
        plan,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid checkout data' },
        { status: 400 }
      );
    }

    console.error('[Checkout API] Error:', error);

    Sentry.captureException(error, {
      tags: { component: 'checkout-api' },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@neondatabase/serverless';
import * as Sentry from '@sentry/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  timeout: 30000
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
  console.error('[Stripe Webhook] Missing configuration');
}

export async function POST(req: NextRequest) {
  try {
    // Get webhook signature
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      console.warn('[Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.text();

    // Verify signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      Sentry.captureException(err, { tags: { component: 'stripe-webhook', operation: 'verify' } });
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      );
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json(
      { received: true, eventId: event.id },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'stripe-webhook',
        severity: 'high'
      }
    });

    console.error('[Webhook] Error:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ✅ FIXED: Wrapped in transaction for atomicity
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      console.error('[Webhook] Missing userId or plan in metadata');
      Sentry.captureMessage('Missing checkout metadata', 'warning');
      return;
    }

    if (!['starter', 'professional', 'enterprise'].includes(plan)) {
      console.error('[Webhook] Invalid plan:', plan);
      return;
    }

    // ✅ FIXED: Use transaction for atomicity
    await sql.begin(async (client) => {
      // Update user subscription
      const result = await client`
        UPDATE users
        SET subscription_status = 'active',
            subscription_plan = ${plan},
            stripe_customer_id = ${String(session.customer)},
            stripe_subscription_id = ${String(session.subscription)},
            subscription_updated_at = NOW(),
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id;
      `;

      if (!result.rows || result.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      // Log subscription event for audit
      await client`
        INSERT INTO subscription_events (
          user_id,
          event_type,
          plan,
          stripe_customer_id,
          stripe_session_id,
          metadata,
          created_at
        ) VALUES (
          ${userId},
          'checkout_completed',
          ${plan},
          ${String(session.customer)},
          ${session.id},
          ${JSON.stringify({ checkout_session: session.id })},
          NOW()
        );
      `;

      console.log(`[Webhook] Subscription activated for user ${userId} on plan ${plan}`);
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        webhook_event: 'checkout.session.completed',
        severity: 'high'
      }
    });
    console.error('[Webhook] Error handling checkout completion:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.warn('[Webhook] Missing userId in subscription');
      return;
    }

    const status = subscription.status === 'active' ? 'active' : 'inactive';

    await sql`
      UPDATE users
      SET subscription_status = ${status},
          subscription_updated_at = NOW(),
          updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id};
    `;

    console.log(`[Webhook] Subscription updated: ${subscription.id} to ${status}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        webhook_event: 'customer.subscription.updated',
        severity: 'high'
      }
    });
    console.error('[Webhook] Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await sql`
      UPDATE users
      SET subscription_status = 'cancelled',
          subscription_cancelled_at = NOW(),
          subscription_updated_at = NOW(),
          updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.id};
    `;

    console.log(`[Webhook] Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        webhook_event: 'customer.subscription.deleted',
        severity: 'high'
      }
    });
    console.error('[Webhook] Error handling subscription deletion:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) {
      console.warn('[Webhook] No subscription in failed invoice');
      return;
    }

    await sql`
      INSERT INTO payment_failures (
        stripe_subscription_id,
        stripe_invoice_id,
        amount,
        currency,
        reason,
        attempted_at,
        created_at
      ) VALUES (
        ${String(invoice.subscription)},
        ${invoice.id},
        ${invoice.amount_due},
        ${invoice.currency},
        'payment_failed',
        ${new Date(invoice.attempt_count ? invoice.created * 1000 : Date.now()).toISOString()},
        NOW()
      );
    `;

    console.log(`[Webhook] Payment failed recorded for invoice: ${invoice.id}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        webhook_event: 'invoice.payment_failed',
        severity: 'high'
      }
    });
    console.error('[Webhook] Error handling payment failure:', error);
  }
}

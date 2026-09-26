import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe-client';
import * as Sentry from '@sentry/nextjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  // Verify webhook signature
  const event = verifyWebhookSignature(body, signature);

  if (!event) {
    console.error('[Stripe Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    Sentry.addBreadcrumb({
      message: `Stripe webhook received: ${event.type}`,
      category: 'stripe-webhook',
      level: 'info',
      data: { eventId: event.id },
    });

    // Handle subscription events
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    }

    // Handle payment events
    if (event.type === 'invoice.payment_succeeded') {
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
    }

    if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);

    Sentry.captureException(error, {
      tags: { component: 'stripe-webhook' },
      extra: { eventType: event.type, eventId: event.id },
    });

    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

/**
 * Handle subscription created/updated events
 * Updates user subscription status in database
 */
async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.warn('[Webhook] Subscription missing userId metadata:', subscription.id);
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const status = subscription.status;

    console.log('[Webhook] Updating subscription:', {
      userId,
      subscriptionId: subscription.id,
      status,
      priceId,
    });

    // Update user subscription in database
    await db.query(
      `UPDATE subscriptions 
       SET stripe_subscription_id = $1, status = $2, price_id = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [subscription.id, status, priceId, userId]
    );

    Sentry.addBreadcrumb({
      message: 'Subscription updated in database',
      category: 'stripe-webhook',
      level: 'info',
      data: { userId, subscriptionId: subscription.id, status },
    });
  } catch (error) {
    console.error('[Webhook] Failed to handle subscription event:', error);
    Sentry.captureException(error, {
      tags: { component: 'webhook-subscription' },
    });
    throw error;
  }
}

/**
 * Handle subscription deleted event
 * Marks subscription as canceled in database
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.warn('[Webhook] Subscription missing userId metadata:', subscription.id);
      return;
    }

    console.log('[Webhook] Deleting subscription:', {
      userId,
      subscriptionId: subscription.id,
    });

    // Mark subscription as canceled
    await db.query(
      `UPDATE subscriptions 
       SET status = 'canceled', canceled_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    Sentry.addBreadcrumb({
      message: 'Subscription canceled',
      category: 'stripe-webhook',
      level: 'info',
      data: { userId, subscriptionId: subscription.id },
    });
  } catch (error) {
    console.error('[Webhook] Failed to handle subscription deletion:', error);
    Sentry.captureException(error, {
      tags: { component: 'webhook-subscription-delete' },
    });
    throw error;
  }
}

/**
 * Handle successful payment
 * Logs payment and sends receipt email
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const amount = invoice.amount_paid / 100; // Convert cents to dollars
    const email = invoice.customer_email || '';

    console.log('[Webhook] Payment succeeded:', {
      invoiceId: invoice.id,
      customerId,
      amount,
      email,
    });

    // Update invoice status in database
    await db.query(
      `INSERT INTO payments (stripe_invoice_id, stripe_customer_id, amount, status, email, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (stripe_invoice_id) 
       DO UPDATE SET status = 'succeeded', updated_at = NOW()`,
      [invoice.id, customerId, amount, 'succeeded', email]
    );

    Sentry.addBreadcrumb({
      message: 'Payment succeeded recorded',
      category: 'stripe-webhook',
      level: 'info',
      data: { invoiceId: invoice.id, amount },
    });
  } catch (error) {
    console.error('[Webhook] Failed to handle payment succeeded:', error);
    Sentry.captureException(error, {
      tags: { component: 'webhook-payment-success' },
    });
    throw error;
  }
}

/**
 * Handle failed payment
 * Logs failure and sends alert email
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const amount = invoice.amount_due / 100; // Convert cents to dollars
    const email = invoice.customer_email || '';

    console.error('[Webhook] Payment failed:', {
      invoiceId: invoice.id,
      customerId,
      amount,
      email,
    });

    // Update invoice status in database
    await db.query(
      `INSERT INTO payments (stripe_invoice_id, stripe_customer_id, amount, status, email, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (stripe_invoice_id) 
       DO UPDATE SET status = 'failed', updated_at = NOW()`,
      [invoice.id, customerId, amount, 'failed', email]
    );

    Sentry.captureMessage(`Payment failed: ${invoice.id}`, 'warning');

    Sentry.addBreadcrumb({
      message: 'Payment failed recorded',
      category: 'stripe-webhook',
      level: 'warning',
      data: { invoiceId: invoice.id, amount },
    });
  } catch (error) {
    console.error('[Webhook] Failed to handle payment failed:', error);
    Sentry.captureException(error, {
      tags: { component: 'webhook-payment-failed' },
    });
    throw error;
  }
}

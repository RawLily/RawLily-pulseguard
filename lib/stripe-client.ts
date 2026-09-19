import Stripe from 'stripe';
import { z } from 'zod';

// Validate Stripe keys
const StripeSecretKeySchema = z.string().startsWith('sk_');
const stripePriceMonthlySchema = z.string().startsWith('price_');
const stripePriceYearlySchema = z.string().startsWith('price_');

const stripeSecretKey = StripeSecretKeySchema.parse(process.env.STRIPE_SECRET_KEY);
const stripePriceMonthly = stripePriceMonthlySchema.parse(
  process.env.STRIPE_PRICE_ID_MONTHLY
);
const stripePriceYearly = stripePriceYearlySchema.parse(
  process.env.STRIPE_PRICE_ID_YEARLY
);
const stripeWebhookSecret = z
  .string()
  .startsWith('whsec_')
  .parse(process.env.STRIPE_WEBHOOK_SECRET);

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
});

export const STRIPE_PRICES = {
  monthly: stripePriceMonthly,
  yearly: stripePriceYearly,
};

export const ALLOWED_PRICES = [stripePriceMonthly, stripePriceYearly];

export interface CheckoutSessionData {
  priceId: string;
  email: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  data: CheckoutSessionData
): Promise<{ sessionId: string; url: string | null; error?: string }> {
  try {
    if (!ALLOWED_PRICES.includes(data.priceId)) {
      return { sessionId: '', url: null, error: 'Invalid price ID' };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      customer_email: data.email,
      metadata: {
        userId: data.userId,
        email: data.email,
      },
    });

    console.log('[Stripe] Checkout session created:', {
      sessionId: session.id,
      userId: data.userId,
      priceId: data.priceId,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('[Stripe] Failed to create checkout session:', error);
    return {
      sessionId: '',
      url: null,
      error: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve subscription:', error);
    return null;
  }
}

export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    return subscriptions.data;
  } catch (error) {
    console.error('[Stripe] Failed to list subscriptions:', error);
    return [];
  }
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.subscriptions.del(subscriptionId);
    console.log('[Stripe] Subscription cancelled:', subscriptionId);
    return { success: true };
  } catch (error) {
    console.error('[Stripe] Failed to cancel subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

export async function updateSubscription(
  subscriptionId: string,
  data: { items?: Array<{ id: string; price: string }> }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.items) {
      return { success: false, error: 'No items to update' };
    }

    await stripe.subscriptions.update(subscriptionId, {
      items: data.items,
    });

    console.log('[Stripe] Subscription updated:', subscriptionId);
    return { success: true };
  } catch (error) {
    console.error('[Stripe] Failed to update subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}

export async function getInvoice(
  invoiceId: string
): Promise<Stripe.Invoice | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve invoice:', error);
    return null;
  }
}

export async function listInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  } catch (error) {
    console.error('[Stripe] Failed to list invoices:', error);
    return [];
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
    return event;
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error);
    return null;
  }
}

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Stripe] Subscription created:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id,
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Stripe] Subscription updated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Stripe] Subscription deleted:', {
    subscriptionId: subscription.id,
  });
}

export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[Stripe] Payment succeeded:', {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    customer: invoice.customer,
  });
}

export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.error('[Stripe] Payment failed:', {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    customer: invoice.customer,
  });
}

export async function refundCharge(
  chargeId: string,
  amount?: number
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount,
    });

    console.log('[Stripe] Refund created:', {
      refundId: refund.id,
      chargeId,
      amount: refund.amount,
    });

    return { success: true, refundId: refund.id };
  } catch (error) {
    console.error('[Stripe] Failed to create refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund',
    };
  }
}

import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

const PRICING_CONFIG = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_default',
  yearly: process.env.STRIPE_PRICE_ID_YEARLY || 'price_yearly_default'
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const checkout = CheckoutSchema.parse(body);

    const priceId = PRICING_CONFIG[checkout.plan];
    const sessionId = `cs_${Date.now()}`;

    return NextResponse.json(
      { 
        success: true, 
        sessionId,
        plan: checkout.plan,
        priceId,
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

    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

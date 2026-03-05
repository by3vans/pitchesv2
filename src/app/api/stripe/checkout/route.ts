import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { PLANS, Plan } from '@/lib/stripe/plans';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json() as { plan: Plan };
    const planConfig = PLANS[plan];

    if (!planConfig.priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
      allow_promotion_codes: true,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe/checkout]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
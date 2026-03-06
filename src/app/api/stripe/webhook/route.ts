import { NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendUpgradeEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from '@/lib/email/send';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// CRÍTICO: desabilita o body parser do Next.js
// O Stripe precisa do body raw para validar a assinatura
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature invalid:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        const { userId, plan } = session.metadata!;

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // Send welcome or upgrade email
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
          const {
            data: { user },
          } = await supabase.auth.admin.getUserById(userId);
          const name = profile?.full_name ?? 'there';
          const email = user?.email ?? '';
          if (email) {
            if (plan === 'pro' || plan === 'business') {
              await sendUpgradeEmail(email, name, plan.charAt(0).toUpperCase() + plan.slice(1));
            } else {
              await sendWelcomeEmail(email, name);
            }
          }
        } catch (emailErr) {
          console.error('[webhook] Email error on checkout:', emailErr);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const planItem = sub.items.data[0];
        const priceId = planItem?.price?.id;

        // Descobre o plano pelo price ID
        const plan =
          priceId === process.env.STRIPE_PRICE_PRO
            ? 'pro'
            : priceId === process.env.STRIPE_PRICE_BUSINESS
              ? 'business'
              : 'free';

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string);
        // Send payment failed email
        try {
          const customerId = invoice.customer as string;
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();
          if (sub?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', sub.user_id)
              .single();
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(sub.user_id);
            if (user?.email)
              await sendPaymentFailedEmail(user.email, profile?.full_name ?? 'there');
          }
        } catch (emailErr) {
          console.error('[webhook] Email error on payment failed:', emailErr);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        // Send cancellation email
        try {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single();
          if (subscription?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', subscription.user_id)
              .single();
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(subscription.user_id);
            if (user?.email) await sendCancellationEmail(user.email, profile?.full_name ?? 'there');
          }
        } catch (emailErr) {
          console.error('[webhook] Email error on cancellation:', emailErr);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

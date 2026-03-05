'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, Plan } from '@/lib/stripe/plans';

interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Usage {
  pitches: number;
  contacts: number;
  templates: number;
  reminders: number;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>({ pitches: 0, contacts: 0, templates: 0, reminders: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [subResult, pitchCount, contactCount, templateCount, reminderCount] = await Promise.all([
          supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
          supabase.from('pitches').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('templates').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', false),
        ]);

        setSubscription(subResult.data);
        setUsage({
          pitches: pitchCount.count ?? 0,
          contacts: contactCount.count ?? 0,
          templates: templateCount.count ?? 0,
          reminders: reminderCount.count ?? 0,
        });
      } catch (err) {
        console.error('[useSubscription]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [supabase]);

  const plan = (subscription?.plan ?? 'free') as Plan;
  const limits = PLANS[plan].limits;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return {
    subscription,
    plan,
    limits,
    usage,
    loading,
    isActive,
    isFree: plan === 'free',
    isPro: plan === 'pro',
    isBusiness: plan === 'business',
  };
}
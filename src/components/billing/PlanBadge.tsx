'use client';

import { useSubscription } from '@/hooks/useSubscription';

export default function PlanBadge() {
  const { plan, loading } = useSubscription();

  if (loading || plan === 'free') return null;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        background: plan === 'pro' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
        color: plan === 'pro' ? '#60a5fa' : '#a78bfa',
        border: plan === 'pro' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(139,92,246,0.3)',
      }}
    >
      {plan === 'pro' ? 'PRO' : 'BUSINESS'}
    </span>
  );
}
'use client';

import { useSubscription } from '@/hooks/useSubscription';

export default function PlanBadge() {
  const { plan, loading } = useSubscription();

  if (loading || plan === 'free') return null;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        fontFamily: 'Azeret Mono, monospace',
        background: plan === 'pro' ? 'rgba(72,108,227,0.12)' : 'rgba(184,98,42,0.12)',
        color:      plan === 'pro' ? 'var(--blue)'            : 'var(--orange)',
        border:     plan === 'pro' ? '1px solid rgba(72,108,227,0.3)' : '1px solid rgba(184,98,42,0.3)',
      }}
    >
      {plan === 'pro' ? 'PRO' : 'BUSINESS'}
    </span>
  );
}
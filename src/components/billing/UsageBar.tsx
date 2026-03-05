'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/plans';

export default function UsageBar() {
  const { plan, usage, limits, loading } = useSubscription();

  if (loading || plan !== 'free') return null;

  const items = [
    { label: 'Pitches', used: usage.pitches, limit: limits.pitches },
    { label: 'Contatos', used: usage.contacts, limit: limits.contacts },
  ];

  return (
    <div
      className="mx-3 mb-3 p-3 rounded-xl"
      style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
          Uso do plano Free
        </p>
        
          href="/settings/billing"
          className="text-xs font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          Upgrade →
        </a>
      </div>
      <div className="space-y-2">
        {items.map(({ label, used, limit }) => {
          const pct = Math.min((used / limit) * 100, 100);
          const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : 'var(--color-primary)';
          return (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                <span>{label}</span>
                <span>{used} / {limit}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
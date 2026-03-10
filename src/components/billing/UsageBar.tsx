'use client';

import { useSubscription } from '@/hooks/useSubscription';

export default function UsageBar() {
  const { plan, usage, limits, loading } = useSubscription();

  if (loading || plan !== 'free') return null;

  const items = [
    { label: 'Pitches',  used: usage.pitches,  limit: limits.pitches  as number },
    { label: 'Contatos', used: usage.contacts, limit: limits.contacts as number },
  ];

  return (
    <div
      className="mx-3 mb-3 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-xs font-semibold"
          style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}
        >
          Plano Free
        </p>
        <a
          href="/settings/billing"
          className="text-xs font-semibold"
          style={{ color: 'var(--blue)', fontFamily: 'Epilogue, sans-serif' }}
        >
          Upgrade →
        </a>
      </div>
      <div className="space-y-2">
        {items.map(({ label, used, limit }) => {
          const pct   = Math.min((used / limit) * 100, 100);
          const color = pct > 80 ? 'var(--crimson)' : pct > 50 ? 'var(--orange)' : 'var(--blue)';
          return (
            <div key={label}>
              <div
                className="flex justify-between text-xs mb-1"
                style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}
              >
                <span>{label}</span>
                <span>{used} / {limit}</span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--cream)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
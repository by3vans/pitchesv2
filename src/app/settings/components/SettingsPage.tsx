'use client';

import { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/plans';

export default function BillingPage() {
  const { plan, usage, limits, loading } = useSubscription();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleUpgrade = async (targetPlan: 'pro' | 'business') => {
    setLoadingCheckout(targetPlan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Header */}
          <div className="pm-panel">
            <p className="pm-kicker">Assinatura</p>
            <h1 className="pm-h1">Billing</h1>
          </div>

          {/* Plano atual */}
          <div className="pm-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="pm-kicker mb-0">Plano atual</p>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>
                    {PLANS[plan].name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: plan === 'free' ? 'var(--color-muted)' : plan === 'pro' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      color: plan === 'free' ? 'var(--color-muted-foreground)' : plan === 'pro' ? '#60a5fa' : '#a78bfa',
                    }}>
                    {plan === 'free' ? 'Gratuito' : plan === 'pro' ? 'Pro' : 'Business'}
                  </span>
                </div>
              </div>
              {plan !== 'free' && (
                <button
                  onClick={handlePortal}
                  disabled={loadingPortal}
                  className="pm-btn"
                  style={{ color: 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                  {loadingPortal ? 'Carregando...' : 'Gerenciar assinatura'}
                </button>
              )}
            </div>

            {/* Barras de uso */}
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-6 rounded" style={{ background: 'var(--color-muted)' }} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {([
                  { label: 'Pitches', used: usage.pitches, limit: limits.pitches },
                  { label: 'Contatos', used: usage.contacts, limit: limits.contacts },
                  { label: 'Templates', used: usage.templates, limit: limits.templates },
                  { label: 'Lembretes', used: usage.reminders, limit: limits.reminders },
                ] as const).map(({ label, used, limit }) => {
                  const pct = limit === Infinity ? 5 : Math.min((used / limit) * 100, 100);
                  const color = limit === Infinity ? '#10b981' : pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : 'var(--color-primary)';
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1"
                        style={{ color: 'var(--color-muted-foreground)' }}>
                        <span>{label}</span>
                        <span>{limit === Infinity ? `${used} / ∞` : `${used} / ${limit}`}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cards de planos */}
          <div className="pm-panel">
            <p className="pm-kicker mb-4">
              {plan === 'free' ? 'Fazer upgrade' : 'Planos disponíveis'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['free', 'pro', 'business'] as const).map((p) => (
                <div key={p}
                  className="rounded-xl p-4"
                  style={{
                    border: p === plan
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    background: p === plan
                      ? 'rgba(59,130,246,0.05)'
                      : 'var(--color-muted)',
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {PLANS[p].name}
                    </h4>
                    {p === plan && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold mb-3" style={{ color: 'var(--color-foreground)' }}>
                    {PLANS[p].price === 0 ? 'Grátis' : `$${PLANS[p].price}`}
                    {PLANS[p].price > 0 && (
                      <span className="text-xs font-normal" style={{ color: 'var(--color-muted-foreground)' }}>/mês</span>
                    )}
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {PLANS[p].features.map((f) => (
                      <li key={f} className="text-xs flex items-start gap-1.5"
                        style={{ color: 'var(--color-muted-foreground)' }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p !== 'free' && p !== plan && (
                    <button
                      onClick={() => handleUpgrade(p)}
                      disabled={loadingCheckout === p}
                      className="pm-btn-primary w-full justify-center">
                      {loadingCheckout === p ? 'Carregando...' : PLANS[p].cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
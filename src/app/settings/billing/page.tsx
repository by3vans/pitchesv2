'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/plans';

export default function BillingPage() {
  const { plan, usage, limits, subscription, loading } = useSubscription();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Billing</h1>
      <p className="text-gray-400 mb-8">Gerencie seu plano e assinatura.</p>

      {/* Plano atual */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Plano atual</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{PLANS[plan].name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                plan === 'free' ? 'bg-gray-800 text-gray-400' :
                plan === 'pro' ? 'bg-blue-600/20 text-blue-400' :
                'bg-purple-600/20 text-purple-400'
              }`}>
                {plan === 'free' ? 'Gratuito' : plan === 'pro' ? 'Pro' : 'Business'}
              </span>
            </div>
          </div>
          {plan !== 'free' && (
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingPortal ? 'Carregando...' : 'Gerenciar assinatura'}
            </button>
          )}
        </div>

        {/* Barras de uso */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {([
            { label: 'Pitches', used: usage.pitches, limit: limits.pitches },
            { label: 'Contatos', used: usage.contacts, limit: limits.contacts },
            { label: 'Templates', used: usage.templates, limit: limits.templates },
            { label: 'Lembretes', used: usage.reminders, limit: limits.reminders },
          ] as const).map(({ label, used, limit }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{label}</span>
                <span>{limit === Infinity ? `${used} / ∞` : `${used} / ${limit}`}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    limit === Infinity ? 'bg-green-500' :
                    (used / limit) > 0.8 ? 'bg-red-500' :
                    (used / limit) > 0.5 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: limit === Infinity ? '10%' : `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards de planos */}
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
        {plan === 'free' ? 'Fazer upgrade' : 'Outros planos'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['free', 'pro', 'business'] as const).map((p) => (
          <div
            key={p}
            className={`border rounded-xl p-5 ${
              p === plan
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-white/10 bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">{PLANS[p].name}</h4>
              {p === plan && (
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">
                  Atual
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {PLANS[p].price === 0 ? 'Grátis' : `$${PLANS[p].price}`}
              {PLANS[p].price > 0 && <span className="text-sm text-gray-500 font-normal">/mês</span>}
            </p>
            <ul className="mt-3 space-y-1.5 mb-4">
              {PLANS[p].features.map((f) => (
                <li key={f} className="text-xs text-gray-400 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {p !== 'free' && p !== plan && (
              <button
                onClick={() => handleUpgrade(p)}
                disabled={loadingCheckout === p}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                {loadingCheckout === p ? 'Carregando...' : PLANS[p].cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
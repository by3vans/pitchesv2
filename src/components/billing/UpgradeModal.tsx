'use client';

import { useState } from 'react';
import { PLANS } from '@/lib/stripe/plans';

interface UpgradeModalProps {
  trigger: 'pitch_limit' | 'contact_limit' | 'template_limit' | 'reminder_limit';
  onClose: () => void;
}

const TRIGGER_MESSAGES = {
  pitch_limit: {
    title: 'Limite de pitches atingido',
    description: 'Você atingiu o limite do seu plano atual. Faça upgrade para criar mais pitches.',
    icon: '🎵',
  },
  contact_limit: {
    title: 'Limite de contatos atingido',
    description: 'Você atingiu o limite de contatos. Faça upgrade para adicionar mais.',
    icon: '👥',
  },
  template_limit: {
    title: 'Limite de templates atingido',
    description: 'Você atingiu o limite de templates. Faça upgrade para criar mais.',
    icon: '📝',
  },
  reminder_limit: {
    title: 'Limite de lembretes atingido',
    description: 'Você atingiu o limite de lembretes. Faça upgrade para adicionar mais.',
    icon: '⏰',
  },
};

export default function UpgradeModal({ trigger, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const message = TRIGGER_MESSAGES[trigger];

  const handleUpgrade = async (plan: 'pro' | 'business') => {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{message.icon}</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
            {message.title}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {message.description}
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['pro', 'business'] as const).map((p) => (
            <div
              key={p}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-muted)' }}
            >
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-foreground)' }}>
                {PLANS[p].name}
              </p>
              <p className="text-lg font-bold mb-3" style={{ color: 'var(--color-foreground)' }}>
                ${PLANS[p].price}
                <span className="text-xs font-normal" style={{ color: 'var(--color-muted-foreground)' }}>/mês</span>
              </p>
              <ul className="space-y-1 mb-3">
                {PLANS[p].features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs flex items-start gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(p)}
                disabled={loading === p}
                className="pm-btn-primary w-full justify-center text-xs py-1.5"
              >
                {loading === p ? 'Carregando...' : PLANS[p].cta}
              </button>
            </div>
          ))}
        </div>

        {/* Fechar */}
        <button
          onClick={onClose}
          className="w-full text-sm py-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Continuar no plano Free
        </button>
      </div>
    </div>
  );
}
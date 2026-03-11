'use client';
interface StatsBarProps {
  stats: {
    total: number;
    novo: number;
    em_analise: number;
    aprovado: number;
    rejeitado: number;
    pendente: number;
  };
}

const statItems = [
  { key: 'total',      label: 'Total',      bg: 'var(--cream)',              color: 'var(--ink)'     },
  { key: 'novo',       label: 'Novos',      bg: 'rgba(72,108,227,0.12)',     color: 'var(--blue)'        },
  { key: 'em_analise', label: 'Em Análise', bg: 'rgba(184,98,42,0.12)',      color: 'var(--orange)'        },
  { key: 'aprovado',   label: 'Aprovados',  bg: 'rgba(78,94,46,0.12)',       color: 'var(--olive)'        },
  { key: 'rejeitado',  label: 'Rejeitados', bg: 'rgba(194,59,46,0.12)',      color: 'var(--crimson)'        },
  { key: 'pendente',   label: 'Pendentes',  bg: 'rgba(122,116,112,0.12)',    color: 'var(--stone)'        },
] as const;

export default function PitchesStatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {statItems.map(item => (
        <div key={item.key} className="rounded-xl px-3 py-2.5 text-center" style={{ backgroundColor: item.bg }}>
          <p className="text-lg font-bold" style={{ color: item.color, fontFamily: 'Azeret Mono, monospace' }}>
            {stats[item.key]}
          </p>
          <p className="text-xs mt-0.5" style={{ color: item.color, fontFamily: 'Azeret Mono, monospace', opacity: 0.7, letterSpacing: '0.05em' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
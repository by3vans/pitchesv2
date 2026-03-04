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
  { key: 'total', label: 'Total', color: 'text-gray-900', bg: 'bg-gray-100' },
  { key: 'novo', label: 'Novos', color: 'text-blue-700', bg: 'bg-blue-50' },
  { key: 'em_analise', label: 'Em Análise', color: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'aprovado', label: 'Aprovados', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { key: 'rejeitado', label: 'Rejeitados', color: 'text-red-700', bg: 'bg-red-50' },
  { key: 'pendente', label: 'Pendentes', color: 'text-gray-600', bg: 'bg-gray-100' },
] as const;

export default function PitchesStatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {statItems.map(item => (
        <div key={item.key} className={`${item.bg} rounded-xl px-3 py-2.5 text-center`}>
          <p className={`text-lg font-bold font-mono ${item.color}`}>{stats[item.key]}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
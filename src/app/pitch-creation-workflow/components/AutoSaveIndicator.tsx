interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export default function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    saving: { text: 'Salvando rascunho...', color: 'text-amber-600', dot: 'bg-amber-500 animate-pulse' },
    saved: { text: 'Rascunho salvo', color: 'text-emerald-600', dot: 'bg-emerald-500' },
    error: { text: 'Erro ao salvar', color: 'text-red-600', dot: 'bg-red-500' },
  };

  const c = config[status];

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}
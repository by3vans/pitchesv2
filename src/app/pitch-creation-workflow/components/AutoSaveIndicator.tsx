interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export default function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    saving: { text: 'Salvando rascunho...', color: '#B8622A', dot: '#B8622A', pulse: true },
    saved:  { text: 'Rascunho salvo',       color: '#4E5E2E', dot: '#4E5E2E', pulse: false },
    error:  { text: 'Erro ao salvar',       color: '#C23B2E', dot: '#C23B2E', pulse: false },
  };

  const c = config[status];

  return (
    <span
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: c.color, fontFamily: 'var(--font-mono)' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.pulse ? 'animate-pulse' : ''}`}
        style={{ background: c.dot }}
      />
      {c.text}
    </span>
  );
}

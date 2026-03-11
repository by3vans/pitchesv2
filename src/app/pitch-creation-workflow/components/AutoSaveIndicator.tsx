'use client';
interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export default function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    saving: { text: 'Salvando rascunho...', color: 'var(--orange)',  dot: 'var(--orange)',  pulse: true  },
    saved:  { text: 'Rascunho salvo',       color: 'var(--olive)',   dot: 'var(--olive)',   pulse: false },
    error:  { text: 'Erro ao salvar',       color: 'var(--crimson)', dot: 'var(--crimson)', pulse: false },
  };

  const c = config[status];

  return (
    <span
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: c.color, fontFamily: 'Azeret Mono, monospace' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: c.dot }}
      />
      {c.text}
    </span>
  );
}
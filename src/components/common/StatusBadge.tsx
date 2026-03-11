'use client';
import Icon from '@/components/ui/AppIcon';

type StatusType =
  | 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; icon: string; bg: string; color: string; dot: string }
> = {
  novo: {
    label: 'Draft',
    icon: 'SparklesIcon',
    bg: 'rgba(72,108,227,0.08)',
    color: 'var(--blue)',
    dot: 'var(--blue)',
  },
  em_analise: {
    label: 'Ready',
    icon: 'MagnifyingGlassIcon',
    bg: 'rgba(184,98,42,0.08)',
    color: 'var(--orange)',
    dot: 'var(--orange)',
  },
  aprovado: {
    label: 'Placed',
    icon: 'CheckCircleIcon',
    bg: 'rgba(78,94,46,0.08)',
    color: 'var(--olive)',
    dot: 'var(--olive)',
  },
  rejeitado: {
    label: 'Hold',
    icon: 'PauseCircleIcon',
    bg: 'rgba(194,59,46,0.08)',
    color: 'var(--crimson)',
    dot: 'var(--crimson)',
  },
  pendente: {
    label: 'Sent',
    icon: 'PaperAirplaneIcon',
    bg: 'rgba(72,108,227,0.08)',
    color: 'var(--blue)',
    dot: 'var(--blue)',
  },
  arquivado: {
    label: 'Archived',
    icon: 'ArchiveBoxIcon',
    bg: 'rgba(122,116,112,0.1)',
    color: 'var(--stone)',
    dot: 'var(--stone)',
  },
};

const StatusBadge = ({
  status,
  size = 'md',
  showIcon = false,
  className = '',
}: StatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig['pendente'];
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`pm-status-badge ${padding} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: 'Azeret Mono, monospace',
        fontSize: '0.75rem',
      }}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon ? (
        <Icon name={config.icon as any} size={12} variant="outline" />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.dot }}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
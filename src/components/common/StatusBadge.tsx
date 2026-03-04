import Icon from '@/components/ui/AppIcon';

type StatusType =
  | 'novo' |'em_analise' |'aprovado' |'rejeitado' |'pendente' |'arquivado';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; icon: string; bg: string; text: string; dot: string }
> = {
  novo: {
    label: 'Draft',
    icon: 'SparklesIcon',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-600',
  },
  em_analise: {
    label: 'Ready',
    icon: 'MagnifyingGlassIcon',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  aprovado: {
    label: 'Placed',
    icon: 'CheckCircleIcon',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  rejeitado: {
    label: 'Hold',
    icon: 'PauseCircleIcon',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  pendente: {
    label: 'Sent',
    icon: 'PaperAirplaneIcon',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  arquivado: {
    label: 'Archived',
    icon: 'ArchiveBoxIcon',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
};

const StatusBadge = ({
  status,
  size = 'md',
  showIcon = false,
  className = '',
}: StatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig['pendente'];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`pm-status-badge ${config.bg} ${config.text} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon ? (
        <Icon name={config.icon as any} size={12} variant="outline" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} aria-hidden="true" />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
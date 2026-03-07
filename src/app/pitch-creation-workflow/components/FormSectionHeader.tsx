import Icon from '@/components/ui/AppIcon';

interface FormSectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export default function FormSectionHeader({ icon, title, subtitle }: FormSectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(72,108,227,.1)' }}
      >
        <Icon name={icon as any} size={18} variant="outline" style={{ color: '#486CE3' }} />
      </div>
      <div>
        <h2
          className="text-sm font-semibold"
          style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

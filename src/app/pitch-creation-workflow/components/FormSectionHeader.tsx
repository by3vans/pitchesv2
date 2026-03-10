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
        style={{ backgroundColor: 'rgba(72,108,227,0.1)' }}
      >
        <Icon name={icon as any} size={18} variant="outline" style={{ color: 'var(--blue)' }} />
      </div>
      <div>
        <h2
          className="text-sm font-semibold"
          style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
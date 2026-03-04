import Icon from '@/components/ui/AppIcon';

interface FormSectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export default function FormSectionHeader({ icon, title, subtitle }: FormSectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon as any} size={18} variant="outline" className="text-gray-600" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900 font-['Inter']">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
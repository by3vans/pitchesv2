import Icon from '@/components/ui/AppIcon';

interface ExternalLink {
  id: number;
  label: string;
  url: string;
  type: 'portfolio' | 'demo' | 'social' | 'press';
  platform: string;
}

interface ExternalLinksProps {
  links: ExternalLink[];
}

const typeConfig: Record<ExternalLink['type'], { icon: string; color: string }> = {
  portfolio: { icon: 'GlobeAltIcon', color: 'text-blue-600' },
  demo: { icon: 'MusicalNoteIcon', color: 'text-purple-600' },
  social: { icon: 'UserGroupIcon', color: 'text-pink-600' },
  press: { icon: 'NewspaperIcon', color: 'text-amber-600' },
};

export default function ExternalLinks({ links }: ExternalLinksProps) {
  return (
    <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Links Externos</p>
        <span className="text-xs text-muted-foreground">{links.length} links</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link) => {
          const config = typeConfig[link.type];
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-all duration-200 group"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                <Icon name={config.icon as any} size={16} variant="outline" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.platform}</p>
              </div>
              <Icon name="ArrowTopRightOnSquareIcon" size={14} variant="outline" className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
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
  portfolio: { icon: 'GlobeAltIcon',    color: 'var(--blue)' },
  demo:      { icon: 'MusicalNoteIcon', color: 'var(--olive)' },
  social:    { icon: 'UserGroupIcon',   color: 'var(--orange)' },
  press:     { icon: 'NewspaperIcon',   color: 'var(--stone)' },
};

export default function ExternalLinks({ links }: ExternalLinksProps) {
  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: 'var(--ice)', borderColor: 'var(--cream)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
        >
          Links Externos
        </p>
        <span
          className="text-xs"
          style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
        >
          {links.length} links
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link) => {
          const config = typeConfig[link.type];
          return (
            
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group"
              style={{ borderColor: 'var(--cream)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--cream)', color: config.color }}
              >
                <Icon name={config.icon as any} size={16} variant="outline" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
                >
                  {link.label}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                >
                  {link.platform}
                </p>
              </div>
              <Icon
                name="ArrowTopRightOnSquareIcon"
                size={14}
                variant="outline"
                style={{ color: 'var(--stone)' }}
                className="shrink-0"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
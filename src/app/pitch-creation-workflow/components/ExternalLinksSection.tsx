'use client';

import Icon from '@/components/ui/AppIcon';
import FormSectionHeader from './FormSectionHeader';

interface LinkEntry {
  id: string;
  label: string;
  url: string;
  error?: string;
}

interface ExternalLinksSectionProps {
  links: LinkEntry[];
  onChange: (links: LinkEntry[]) => void;
}

const linkPlaceholders = [
  { label: 'Demo / SoundCloud', placeholder: 'https://soundcloud.com/artista/demo' },
  { label: 'Portfólio / Site',  placeholder: 'https://artista.com.br' },
  { label: 'Instagram',         placeholder: 'https://instagram.com/artista' },
  { label: 'YouTube',           placeholder: 'https://youtube.com/@artista' },
  { label: 'Spotify',           placeholder: 'https://open.spotify.com/artist/...' },
];

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-muted)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-foreground)',
  fontFamily: 'var(--font-body)',
};

export default function ExternalLinksSection({ links, onChange }: ExternalLinksSectionProps) {
  const addLink = () => {
    const ph = linkPlaceholders[links.length % linkPlaceholders.length];
    onChange([...links, { id: Date.now().toString(), label: ph.label, url: '' }]);
  };

  const removeLink = (id: string) => onChange(links.filter((l) => l.id !== id));

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    onChange(
      links.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === 'url') {
          updated.error = value && !isValidUrl(value) ? 'URL inválida' : undefined;
        }
        return updated;
      })
    );
  };

  return (
    <div className="pm-panel">
      <FormSectionHeader
        icon="LinkIcon"
        title="Links Externos"
        subtitle="Adicione demos, portfólios e perfis sociais do artista"
      />
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={link.id} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                placeholder="Rótulo (ex: Demo)"
                className="sm:col-span-2 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={inputStyle}
                aria-label={`Rótulo do link ${idx + 1}`}
              />
              <div className="sm:col-span-3">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  placeholder={linkPlaceholders[idx % linkPlaceholders.length].placeholder}
                  className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{
                    ...inputStyle,
                    background: link.error ? 'rgba(194,59,46,.06)' : 'var(--color-muted)',
                    borderColor: link.error ? '#C23B2E' : 'var(--color-border)',
                  }}
                  aria-label={`URL do link ${idx + 1}`}
                />
                {link.error && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#C23B2E', fontFamily: 'var(--font-mono)' }}>
                    <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                    {link.error}
                  </p>
                )}
              </div>
            </div>

            {link.url && isValidUrl(link.url) && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted-foreground)' }}
                aria-label="Abrir link"
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={15} variant="outline" />
              </a>
            )}

            <button
              type="button"
              onClick={() => removeLink(link.id)}
              className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted-foreground)' }}
              aria-label="Remover link"
            >
              <Icon name="TrashIcon" size={15} variant="outline" />
            </button>
          </div>
        ))}

        {links.length === 0 && (
          <p
            className="text-sm text-center py-4 rounded-lg"
            style={{
              color: 'var(--color-muted-foreground)',
              border: '1px dashed var(--color-border)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Nenhum link adicionado ainda
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addLink}
        className="mt-4 flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: '#486CE3', fontFamily: 'var(--font-mono)' }}
      >
        <Icon name="PlusCircleIcon" size={16} variant="outline" />
        Adicionar link
      </button>
    </div>
  );
}

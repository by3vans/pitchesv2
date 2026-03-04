import StatusBadge from '@/components/common/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

interface PitchMetadataProps {
  artist: string;
  genre: string;
  submissionDate: string;
  status: 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';
  tags: string[];
  contact: ContactInfo;
  label: string;
  imageUrl: string;
  imageAlt: string;
}

export default function PitchMetadata({
  artist,
  genre,
  submissionDate,
  status,
  tags,
  contact,
  label,
  imageUrl,
  imageAlt,
}: PitchMetadataProps) {
  return (
    <div className="space-y-5">
      {/* Artist Card */}
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <AppImage src={imageUrl} alt={imageAlt} width={64} height={64} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-semibold text-base text-foreground">{artist}</p>
          <p className="text-sm text-muted-foreground">{genre}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Status Atual</p>
        <StatusBadge status={status} size="md" showIcon />
      </div>

      {/* Details */}
      <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Informações</p>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Icon name="CalendarDaysIcon" size={15} variant="outline" className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Data de Submissão</p>
              <p className="text-sm font-medium text-foreground">{submissionDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Icon name="MusicalNoteIcon" size={15} variant="outline" className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Gênero</p>
              <p className="text-sm font-medium text-foreground">{genre}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Icon name="BuildingOfficeIcon" size={15} variant="outline" className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Gravadora / Agência</p>
              <p className="text-sm font-medium text-foreground">{label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border" style={{ borderColor: 'var(--color-border)' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Contato</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Icon name="PhoneIcon" size={15} variant="outline" className="text-muted-foreground shrink-0" />
            <p className="text-sm text-foreground">{contact.phone}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Icon name="EnvelopeIcon" size={15} variant="outline" className="text-muted-foreground shrink-0" />
            <p className="text-sm text-foreground">{contact.email}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Icon name="MapPinIcon" size={15} variant="outline" className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{contact.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
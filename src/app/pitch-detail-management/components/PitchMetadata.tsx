'use client';
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

const sectionStyle = {
  backgroundColor: 'var(--ice)',
  borderColor: 'var(--cream)',
};

const labelStyle = {
  fontFamily: 'Azeret Mono, monospace',
  color: 'var(--stone)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  fontSize: '0.65rem',
};

const metaLabelStyle = {
  fontFamily: 'Azeret Mono, monospace',
  color: 'var(--stone)',
  fontSize: '0.7rem',
};

const metaValueStyle = {
  fontFamily: 'Epilogue, sans-serif',
  color: 'var(--ink)',
};

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
      <div className="flex items-center gap-4 p-4 rounded-xl border" style={sectionStyle}>
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: imageUrl ? 'transparent' : 'var(--ink)' }}>
          {imageUrl
            ? <AppImage src={imageUrl} alt={imageAlt} width={64} height={64} className="w-full h-full object-cover" fallbackSrc="" />
            : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--ice)' }}>{artist.slice(0,2).toUpperCase()}</span>
          }
        </div>
        <div>
          <p className="font-semibold text-base" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
            {artist}
          </p>
          <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
            {genre}
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
            {label}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 rounded-xl border space-y-3" style={sectionStyle}>
        <p style={labelStyle}>Status Atual</p>
        <StatusBadge status={status} size="md" showIcon />
      </div>

      {/* Details */}
      <div className="p-4 rounded-xl border space-y-3" style={sectionStyle}>
        <p style={labelStyle}>Informações</p>
        <div className="space-y-2.5">
          {[
            { icon: 'CalendarDaysIcon', label: 'Data de Submissão', value: submissionDate },
            { icon: 'MusicalNoteIcon',  label: 'Gênero',            value: genre },
            { icon: 'BuildingOfficeIcon', label: 'Gravadora / Agência', value: label },
          ].map(({ icon, label: fieldLabel, value }) => (
            <div key={fieldLabel} className="flex items-start gap-2.5">
              <Icon name={icon as any} size={15} variant="outline" className="mt-0.5 shrink-0" style={{ color: 'var(--stone)' }} />
              <div>
                <p className="text-xs" style={metaLabelStyle}>{fieldLabel}</p>
                <p className="text-sm font-medium" style={metaValueStyle}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 rounded-xl border space-y-3" style={sectionStyle}>
        <p style={labelStyle}>Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                fontFamily: 'Azeret Mono, monospace',
                backgroundColor: 'var(--cream)',
                borderColor: 'var(--cream)',
                color: 'var(--ink)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="p-4 rounded-xl border space-y-3" style={sectionStyle}>
        <p style={labelStyle}>Contato</p>
        <div className="space-y-2.5">
          {[
            { icon: 'PhoneIcon',    value: contact.phone,   align: 'center' },
            { icon: 'EnvelopeIcon', value: contact.email,   align: 'center' },
            { icon: 'MapPinIcon',   value: contact.address, align: 'start'  },
          ].map(({ icon, value, align }) => (
            <div key={icon} className={`flex items-${align} gap-2.5`}>
              <Icon name={icon as any} size={15} variant="outline" className="shrink-0" style={{ color: 'var(--stone)' }} />
              <p className="text-sm" style={metaValueStyle}>{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
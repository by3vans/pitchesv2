'use client';

import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/common/StatusBadge';
import Icon from '@/components/ui/AppIcon';

interface Pitch {
  id: string;
  title: string;
  artist: string;
  artistImage: string;
  artistImageAlt: string;
  status: 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';
  category: string;
  tags: string[];
  submittedAt: string;
  label: string;
  description: string;
  reminderDate?: string;
}

interface PitchCardProps {
  pitch: Pitch;
  viewMode: 'card' | 'list';
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
  onEdit?: (pitch: Pitch) => void;
}

function ReminderBadge({ date }: { date: string }) {
  const d = new Date(date);
  const now = new Date();
  const isOverdue = d < now;
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: isOverdue ? 'rgba(194,59,46,.1)' : 'rgba(72,108,227,.1)',
        color: isOverdue ? 'var(--crimson)' : 'var(--blue)',
        border: `1px solid ${isOverdue ? 'rgba(194,59,46,.2)' : 'rgba(72,108,227,.2)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
      title={`Follow-up reminder: ${formatted}`}
    >
      <Icon name="ClockIcon" size={10} variant="outline" aria-hidden="true" />
      Follow-up: {formatted}
    </span>
  );
}

export default function PitchCard({ pitch, viewMode, isSelected = false, onToggleSelect, selectionMode = false, onEdit }: PitchCardProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.(pitch.id);
  };

  const handleCheckboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect?.(pitch.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200"
        style={{
          background: isSelected ? 'rgba(72,108,227,.06)' : 'var(--color-surface)',
          border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--color-border)'}`,
        }}
      >
        {/* Checkbox */}
        <div className={`shrink-0 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div
            role="checkbox"
            aria-checked={isSelected}
            aria-label={isSelected ? `Deselect pitch: ${pitch.title}` : `Select pitch: ${pitch.title}`}
            tabIndex={0}
            onClick={handleCheckboxClick}
            onKeyDown={handleCheckboxKeyDown}
            className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all focus:outline-none"
            style={{
              background: isSelected ? 'var(--ink)' : 'transparent',
              border: `2px solid ${isSelected ? 'var(--ink)' : 'var(--color-border)'}`,
            }}
          >
            {isSelected && <Icon name="CheckIcon" size={10} variant="solid" className="text-white" aria-hidden="true" />}
          </div>
        </div>

        <Link href={`/pitches/${pitch.id}`} className="flex-1 flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center shrink-0"
            style={{ background: pitch.artistImage ? 'transparent' : 'var(--ink)' }}>
            {pitch.artistImage
              ? <AppImage src={pitch.artistImage} alt={pitch.artistImageAlt} width={40} height={40} className="w-full h-full object-cover" fallbackSrc="" />
              : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--ice)' }}>{pitch.artist.slice(0,2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>{pitch.title}</p>
              <span style={{ color: 'var(--color-muted-foreground)' }}>·</span>
              <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}>{pitch.artist}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
              >
                {pitch.category}
              </span>
              {pitch.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>#{tag}</span>
              ))}
              {pitch.reminderDate && <ReminderBadge date={pitch.reminderDate} />}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <StatusBadge status={pitch.status} size="sm" />
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>{pitch.submittedAt}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--color-muted-foreground)' }}
              onClick={(e) => { e.preventDefault(); onEdit?.(pitch); }}
              aria-label={`Edit pitch: ${pitch.title}`}
            >
              <Icon name="PencilSquareIcon" size={14} variant="outline" aria-hidden="true" />
            </button>
            <button
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--color-muted-foreground)' }}
              onClick={(e) => e.preventDefault()}
              aria-label={`View details for pitch: ${pitch.title}`}
            >
              <Icon name="ArrowTopRightOnSquareIcon" size={14} variant="outline" aria-hidden="true" />
            </button>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl p-4 transition-all duration-200 h-full flex flex-col"
      style={{
        background: isSelected ? 'rgba(72,108,227,.06)' : 'var(--color-surface)',
        border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--color-border)'}`,
      }}
    >
      {/* Checkbox overlay */}
      <div className={`absolute top-3 left-3 z-10 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={isSelected ? `Deselect pitch: ${pitch.title}` : `Select pitch: ${pitch.title}`}
          tabIndex={0}
          onClick={handleCheckboxClick}
          onKeyDown={handleCheckboxKeyDown}
          className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all focus:outline-none"
          style={{
            background: isSelected ? 'var(--ink)' : 'var(--color-surface)',
            border: `2px solid ${isSelected ? 'var(--ink)' : 'var(--color-border)'}`,
          }}
        >
          {isSelected && <Icon name="CheckIcon" size={10} variant="solid" className="text-white" aria-hidden="true" />}
        </div>
      </div>

      <Link href={`/pitches/${pitch.id}`} className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: pitch.artistImage ? 'transparent' : 'var(--ink)' }}>
              {pitch.artistImage
                ? <AppImage src={pitch.artistImage} alt={pitch.artistImageAlt} width={36} height={36} className="w-full h-full object-cover" fallbackSrc="" />
                : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--ice)' }}>{pitch.artist.slice(0,2).toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}>{pitch.artist}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>{pitch.label}</p>
            </div>
          </div>
          <StatusBadge status={pitch.status} size="sm" />
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold mb-1.5 line-clamp-2 leading-snug"
          style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}
        >
          {pitch.title}
        </h3>
        <p
          className="text-xs line-clamp-2 mb-3 flex-1"
          style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}
        >
          {pitch.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
          >
            {pitch.category}
          </span>
          {pitch.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {pitch.reminderDate && (
          <div className="mb-2">
            <ReminderBadge date={pitch.reminderDate} />
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>{pitch.submittedAt}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--color-muted-foreground)' }}
              onClick={(e) => { e.preventDefault(); onEdit?.(pitch); }}
              aria-label={`Edit pitch: ${pitch.title}`}
            >
              <Icon name="PencilSquareIcon" size={13} variant="outline" aria-hidden="true" />
            </button>
            <button
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--color-muted-foreground)' }}
              onClick={(e) => e.preventDefault()}
              aria-label={`View details for pitch: ${pitch.title}`}
            >
              <Icon name="ArrowTopRightOnSquareIcon" size={13} variant="outline" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

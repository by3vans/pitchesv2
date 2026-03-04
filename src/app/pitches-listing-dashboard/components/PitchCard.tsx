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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isOverdue
          ? 'bg-red-50 text-red-600 border border-red-100' :'bg-blue-50 text-blue-600 border border-blue-100'
      }`}
      style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.01em' }}
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
        className={`group flex items-center gap-3 px-4 py-3.5 bg-white border rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}
      >
        {/* Checkbox */}
        <div
          className={`shrink-0 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <div
            role="checkbox"
            aria-checked={isSelected}
            aria-label={isSelected ? `Deselect pitch: ${pitch.title}` : `Select pitch: ${pitch.title}`}
            tabIndex={0}
            onClick={handleCheckboxClick}
            onKeyDown={handleCheckboxKeyDown}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
              isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
            }`}
          >
            {isSelected && (
              <Icon name="CheckIcon" size={10} variant="solid" className="text-white" aria-hidden="true" />
            )}
          </div>
        </div>

        <Link href={`/pitch-detail-management?id=${pitch.id}`} className="flex-1 flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <AppImage src={pitch.artistImage} alt={pitch.artistImageAlt} width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 truncate">{pitch.title}</p>
              <span className="text-xs text-gray-400">·</span>
              <p className="text-xs text-gray-500 truncate">{pitch.artist}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{pitch.category}</span>
              {pitch.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-xs text-gray-400">#{tag}</span>
              ))}
              {pitch.reminderDate && <ReminderBadge date={pitch.reminderDate} />}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <StatusBadge status={pitch.status} size="sm" />
            <span className="text-xs text-gray-400 font-mono">{pitch.submittedAt}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
              onClick={(e) => { e.preventDefault(); onEdit?.(pitch); }}
              aria-label={`Edit pitch: ${pitch.title}`}
            >
              <Icon name="PencilSquareIcon" size={14} variant="outline" aria-hidden="true" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all" onClick={(e) => e.preventDefault()} aria-label={`View details for pitch: ${pitch.title}`}>
              <Icon name="ArrowTopRightOnSquareIcon" size={14} variant="outline" aria-hidden="true" />
            </button>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={`group relative bg-white border rounded-xl p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 h-full flex flex-col ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}>
      {/* Checkbox overlay */}
      <div
        className={`absolute top-3 left-3 z-10 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={isSelected ? `Deselect pitch: ${pitch.title}` : `Select pitch: ${pitch.title}`}
          tabIndex={0}
          onClick={handleCheckboxClick}
          onKeyDown={handleCheckboxKeyDown}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
            isSelected ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300 hover:border-gray-500'
          }`}
        >
          {isSelected && (
            <Icon name="CheckIcon" size={10} variant="solid" className="text-white" aria-hidden="true" />
          )}
        </div>
      </div>

      <Link href={`/pitch-detail-management?id=${pitch.id}`} className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <AppImage src={pitch.artistImage} alt={pitch.artistImageAlt} width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{pitch.artist}</p>
              <p className="text-xs text-gray-400">{pitch.label}</p>
            </div>
          </div>
          <StatusBadge status={pitch.status} size="sm" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 leading-snug">{pitch.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{pitch.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pitch.category}</span>
          {pitch.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>

        {/* Reminder badge */}
        {pitch.reminderDate && (
          <div className="mb-2">
            <ReminderBadge date={pitch.reminderDate} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400 font-mono">{pitch.submittedAt}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
              onClick={(e) => { e.preventDefault(); onEdit?.(pitch); }}
              aria-label={`Edit pitch: ${pitch.title}`}
            >
              <Icon name="PencilSquareIcon" size={13} variant="outline" aria-hidden="true" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all" onClick={(e) => e.preventDefault()} aria-label={`View details for pitch: ${pitch.title}`}>
              <Icon name="ArrowTopRightOnSquareIcon" size={13} variant="outline" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  hasFilters: boolean;
}

export default function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
      >
        <Icon name="MusicalNoteIcon" size={36} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No pitches found</h3>
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No pitches yet</h3>
          <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Start by creating your first pitch to manage artists and track your progress with labels.</p>
          <Link href="/pitch-creation-workflow" className="pm-btn-primary flex items-center gap-2">
            <Icon name="PlusIcon" size={16} variant="outline" />
            Create Your First Pitch
          </Link>
        </>
      )}
    </div>
  );
}
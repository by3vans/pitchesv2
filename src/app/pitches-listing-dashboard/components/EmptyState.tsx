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
        style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}
      >
        <Icon name="MusicalNoteIcon" size={36} variant="outline" style={{ color: 'var(--stone)' }} />
      </div>

      {hasFilters ? (
        <>
          <h3
            className="text-base font-semibold mb-2"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
          >
            Nenhum pitch encontrado
          </h3>
          <p
            className="text-sm max-w-xs"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}
          >
            Tente ajustar seus filtros ou termos de busca.
          </p>
        </>
      ) : (
        <>
          <h3
            className="text-base font-semibold mb-2"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
          >
            Nenhum pitch ainda
          </h3>
          <p
            className="text-sm max-w-xs mb-6"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}
          >
            Crie seu primeiro pitch para começar a gerenciar artistas e acompanhar seu progresso.
          </p>
          <Link href="/pitch-creation-workflow" className="pm-btn-primary flex items-center gap-2">
            <Icon name="PlusIcon" size={16} variant="outline" />
            Criar Primeiro Pitch
          </Link>
        </>
      )}
    </div>
  );
}
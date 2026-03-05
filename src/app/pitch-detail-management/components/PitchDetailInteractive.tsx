'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Breadcrumb from '@/components/common/Breadcrumb';
import StatusBadge from '@/components/common/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import PitchMetadata from './PitchMetadata';
import NotesSection from './NotesSection';
import ExternalLinks from './ExternalLinks';
import StatusWorkflow from './StatusWorkflow';
import { initStore, pitchRecipientStore, contactStore, artistStore, pitchStore } from '@/lib/store';
import type { Contact, Artist } from '@/lib/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ShortcutsHelpModal from '@/components/ui/ShortcutsHelpModal';
import { useToast } from '@/components/ui/Toast';
import { enqueueAction, useOfflineQueue } from '@/hooks/useOfflineQueue';

type PitchStatus = 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';

interface WorkflowStep {
  status: PitchStatus;
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

interface ExternalLink {
  id: number;
  label: string;
  url: string;
  type: 'portfolio' | 'demo' | 'social' | 'press';
  platform: string;
}

interface Note {
  id: number;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  version: number;
}

interface RecipientEntry {
  contact: Contact;
  artist: Artist | undefined;
  relationshipType: string;
  isPrimary: boolean;
}

interface PitchData {
  id: string;
  title: string;
  artist: string;
  genre: string;
  label: string;
  status: PitchStatus;
  submissionDate: string;
  tags: string[];
  contact: {phone: string;email: string;address: string;};
  imageUrl: string;
  imageAlt: string;
  description: string;
}

const fallbackPitch: PitchData = {
  id: '',
  title: 'Novas Fronteiras',
  artist: 'Marina Cavalcanti',
  genre: 'MPB / Soul',
  label: 'Trópico Records',
  status: 'em_analise' as PitchStatus,
  submissionDate: '14/02/2026',
  tags: ['MPB', 'Soul', 'Feminino', 'Autoral', 'Acústico'],
  contact: {
    phone: '(11) 99876-5432',
    email: 'marina@tropico.com.br',
    address: 'Rua Augusta, 1200, Consolação, São Paulo - SP, 01304-001'
  },
  imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_18514a9a5-1772212833651.png',
  imageAlt: 'Young Brazilian woman with curly dark hair holding a guitar in a warmly lit studio',
  description: `Marina Cavalcanti é uma cantora e compositora paulistana que une a tradição da MPB com influências contemporâneas de soul e R&B. Com mais de 500 mil streams mensais no Spotify e uma base de fãs engajada nas redes sociais, Marina representa uma nova geração de artistas brasileiros que dialogam com o passado sem abrir mão da modernidade.\n\nSeu álbum de estreia "Novas Fronteiras" foi gravado ao vivo no estúdio com uma banda de 7 músicos, capturando a energia e espontaneidade de suas performances ao vivo. O projeto conta com 10 faixas autorais que exploram temas como identidade, pertencimento e transformação pessoal.`
};

const defaultWorkflowSteps: WorkflowStep[] = [
{ status: 'novo', label: 'Recebido', timestamp: '14/02/2026', completed: true, active: false },
{ status: 'em_analise', label: 'Em Análise', timestamp: '18/02/2026', completed: false, active: true },
{ status: 'pendente', label: 'Pendente', completed: false, active: false },
{ status: 'aprovado', label: 'Aprovado', completed: false, active: false }];


const mockLinks: ExternalLink[] = [
{ id: 1, label: 'Spotify - Novas Fronteiras', url: 'https://spotify.com', type: 'demo', platform: 'Spotify' },
{ id: 2, label: 'Site Oficial', url: 'https://marinacavalcanti.com.br', type: 'portfolio', platform: 'Website' },
{ id: 3, label: 'Instagram @marinacavalcanti', url: 'https://instagram.com', type: 'social', platform: 'Instagram' },
{ id: 4, label: 'YouTube - Clipe Oficial', url: 'https://youtube.com', type: 'demo', platform: 'YouTube' },
{ id: 5, label: 'Folha de S.Paulo - Entrevista', url: 'https://folha.uol.com.br', type: 'press', platform: 'Folha de S.Paulo' },
{ id: 6, label: 'SoundCloud - Demos', url: 'https://soundcloud.com', type: 'demo', platform: 'SoundCloud' }];


const mockNotes: Note[] = [
{
  id: 1,
  author: 'Carlos Mendes',
  role: 'A&R Sênior',
  content: 'Voz excepcional com grande controle dinâmico. As composições mostram maturidade acima da média para uma artista estreante. Recomendo fortemente avançar para a próxima etapa de avaliação.',
  timestamp: '18/02/2026 às 14:32',
  version: 1
},
{
  id: 2,
  author: 'Ana Beatriz Lima',
  role: 'Diretora Musical',
  content: 'Ouvi o álbum completo. A produção é limpa e bem executada. O track 3 \'Raízes\' tem potencial para rádio. Precisamos discutir estratégia de lançamento com o time de marketing.',
  timestamp: '20/02/2026 às 09:15',
  version: 2
},
{
  id: 3,
  author: 'Rafael Torres',
  role: 'Supervisor de Licenciamento',
  content: 'Verificado: todos os direitos autorais estão registrados no ECAD. Contrato de exclusividade com a Trópico Records vence em dezembro/2026. Janela favorável para negociação.',
  timestamp: '22/02/2026 às 16:48',
  version: 3
}];


const statusOptions: {value: PitchStatus;label: string;}[] = [
{ value: 'novo', label: 'Novo' },
{ value: 'em_analise', label: 'Em Análise' },
{ value: 'aprovado', label: 'Aprovado' },
{ value: 'rejeitado', label: 'Rejeitado' },
{ value: 'pendente', label: 'Pendente' },
{ value: 'arquivado', label: 'Arquivado' }];


function mapStoreStatusToDisplay(status: string): PitchStatus {
  const map: Record<string, PitchStatus> = {
    draft: 'novo',
    sent: 'em_analise',
    hold: 'pendente',
    placed: 'aprovado'
  };
  return map[status] as PitchStatus || 'novo';
}

// ─── Empty State for Pitch Detail ────────────────────────────────────────────
interface PitchDetailEmptyStateProps {
  reason: 'not-found' | 'load-error';
  pitchId: string | null;
  onRetry: () => void;
}

function PitchDetailEmptyState({ reason, pitchId, onRetry }: PitchDetailEmptyStateProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
            { label: 'Início', path: '/pitches-listing-dashboard' },
            { label: 'Pitches', path: '/pitches-listing-dashboard' },
            { label: 'Pitch Detail' }]
            }
            className="mb-5" />
          
          <div
            className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
            
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              
              <Icon
                name={reason === 'not-found' ? 'DocumentMagnifyingGlassIcon' : 'ExclamationTriangleIcon'}
                size={28}
                variant="outline"
                style={{ color: 'var(--color-destructive)' }} />
              
            </div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              
              {reason === 'not-found' ? 'Pitch Not Found' : 'Load Error'}
            </p>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
              
              {reason === 'not-found' ? 'This pitch doesn\'t exist' : 'Failed to load pitch data'}
            </h2>
            <p
              className="text-sm mb-1 max-w-sm"
              style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              
              {reason === 'not-found' ?
              `No pitch found with ID "${pitchId}". It may have been deleted or the link is incorrect.` :
              'An error occurred while loading this pitch. Please try again.'}
            </p>
            {pitchId &&
            <p
              className="text-xs mb-6"
              style={{ color: 'var(--color-muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
              
                ID: {pitchId}
              </p>
            }
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={onRetry}
                className="pm-btn-primary">
                
                <Icon name="ArrowPathIcon" size={15} variant="outline" />
                Retry
              </button>
              <Link href="/pitches-listing-dashboard" className="pm-btn border" style={{ borderColor: 'var(--color-border)' }}>
                <Icon name="ArrowLeftIcon" size={15} variant="outline" />
                Back to Pitches
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>);

}
// ─────────────────────────────────────────────────────────────────────────────

export default function PitchDetailInteractive() {
  const searchParams = useSearchParams();
  const pitchId = searchParams.get('id');

  const [pitchData, setPitchData] = useState<PitchData>(fallbackPitch);
  const [currentStatus, setCurrentStatus] = useState<PitchStatus>(fallbackPitch.status);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [pitchArtist, setPitchArtist] = useState<Artist | undefined>(undefined);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'metadata' | 'notes' | 'links'>('notes');
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const { showToast } = useToast();

  useOfflineQueue({
    onConnectionRestored: (count) => {
      if (count > 0) showToast(`Connection restored — retrying ${count} queued action${count !== 1 ? 's' : ''}…`, 'info');
    },
    onRetry: async (action) => {
      if (action.type === 'pitch_save') {
        showToast(`Retried: ${action.label}`, 'success');
        return true;
      }
      return false;
    }
  });

  useEffect(() => {
    setLoadState('loading');
    try {
      initStore();

      const resolvedId = pitchId || 'p1';
      const pitch = pitchStore.getById(resolvedId);

      if (pitch) {
        const artist = artistStore.getById(pitch.artistId);
        setPitchArtist(artist);

        const createdDate = new Date(pitch.createdAt).toLocaleDateString('pt-BR');
        const displayStatus = mapStoreStatusToDisplay(pitch.status);

        setPitchData({
          id: pitch.id,
          title: pitch.title,
          artist: artist?.name || 'Artista desconhecido',
          genre: artist?.genre || '—',
          label: '—',
          status: displayStatus,
          submissionDate: createdDate,
          tags: [],
          contact: { phone: '—', email: '—', address: '—' },
          imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_18514a9a5-1772212833651.png',
          imageAlt: `Artist profile image for ${artist?.name || 'unknown artist'}`,
          description: pitch.notes || 'Sem descrição disponível.'
        });
        setCurrentStatus(displayStatus);

        const pitchRecipients = pitchRecipientStore.getByPitch(resolvedId);
        const entries: RecipientEntry[] = pitchRecipients.
        map((pr) => {
          const contact = contactStore.getById(pr.contactId);
          if (!contact) return null;
          return {
            contact,
            artist,
            relationshipType: pr.contactId,
            isPrimary: false
          } as RecipientEntry;
        }).
        filter(Boolean) as RecipientEntry[];
        setRecipients(entries);
        setLoadState('found');
      } else if (pitchId) {
        // Explicit ID provided but pitch not found
        setLoadState('not-found');
      } else {
        // No ID — use fallback (default view)
        const pitchRecipients = pitchRecipientStore.getByPitch('p1');
        const entries: RecipientEntry[] = pitchRecipients.
        map((pr) => {
          const contact = contactStore.getById(pr.contactId);
          if (!contact) return null;
          const fallbackArtist = artistStore.getById('a1');
          return {
            contact,
            artist: fallbackArtist,
            relationshipType: pr.contactId,
            isPrimary: false
          } as RecipientEntry;
        }).
        filter(Boolean) as RecipientEntry[];
        setRecipients(entries);
        setLoadState('found');
      }
    } catch {
      setLoadState('error');
      showToast('Failed to load pitch data. Please retry.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitchId, retryKey]);

  const handleRetry = () => setRetryKey((k) => k + 1);

  const handleStatusChange = (status: PitchStatus) => {
    const resolvedId = pitchId || 'p1';
    if (!navigator.onLine) {
      enqueueAction({ type: 'pitch_save', label: `Update pitch status to ${status}`, payload: { pitchId: resolvedId, status } });
      showToast('Offline — status change queued for retry', 'info');
      setCurrentStatus(status);
      setShowStatusDropdown(false);
      return;
    }
    setCurrentStatus(status);
    setShowStatusDropdown(false);
  };

  const breadcrumbItems = [
  { label: 'Início', path: '/pitches-listing-dashboard' },
  { label: 'Dashboard', path: '/pitches-listing-dashboard' },
  { label: pitchData.title }];


  useKeyboardShortcuts({
    onSearch: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search notes"]');
      if (searchInput) {searchInput.focus();searchInput.select();}
    },
    onFilter: () => {
      const dateInput = document.querySelector<HTMLInputElement>('input[aria-label="Filter notes from date"]');
      if (dateInput) {dateInput.focus();}
    },
    onHelp: () => setShowHelpModal(true)
  });

  // Show empty state when pitch not found or load error
  if (loadState === 'not-found' || loadState === 'error') {
    return (
      <PitchDetailEmptyState
        reason={loadState === 'not-found' ? 'not-found' : 'load-error'}
        pitchId={pitchId}
        onRetry={handleRetry} />);


  }

  // Loading skeleton
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <Sidebar />
        <main className="pt-16 md:pt-0 md:pl-56">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-5" />
            <div className="flex flex-col gap-3 mb-6">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-32 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-16 w-full bg-gray-100 rounded-xl animate-pulse mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>);

  }

  const workflowSteps: WorkflowStep[] = defaultWorkflowSteps.map((step) => ({
    ...step,
    completed: step.status === currentStatus ? false : defaultWorkflowSteps.findIndex((s) => s.status === currentStatus) > defaultWorkflowSteps.findIndex((s) => s.status === step.status),
    active: step.status === currentStatus
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Sidebar />

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-5" />

          {/* Topbar / Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {pitchData.artist}
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {pitchData.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={currentStatus} size="md" showIcon />
                <span className="text-xs text-muted-foreground">Submetido em {pitchData.submissionDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/pitch-creation-workflow" className="pm-btn-ghost text-sm">
                <Icon name="PencilSquareIcon" size={16} variant="outline" />
                Editar
              </Link>

              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="pm-btn-ghost text-sm">
                  <Icon name="ArrowPathIcon" size={16} variant="outline" />
                  Atualizar Status
                  <Icon name="ChevronDownIcon" size={14} variant="outline" />
                </button>
                {showStatusDropdown &&
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border shadow-lg z-50 py-1" style={{ borderColor: 'var(--color-border)' }}>
                    {statusOptions.map((opt) =>
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${currentStatus === opt.value ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {opt.label}
                        {currentStatus === opt.value && <Icon name="CheckIcon" size={14} variant="outline" className="inline ml-2 text-accent" />}
                      </button>
                  )}
                  </div>
                }
              </div>

              {/* Shortcuts help button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="pm-btn-ghost text-sm"
                aria-label="Show keyboard shortcuts (⌘+?)"
                title="Keyboard shortcuts (⌘+?)">
                
                <Icon name="QuestionMarkCircleIcon" size={16} variant="outline" />
              </button>

              <Link href="/pitches-listing-dashboard" className="pm-btn-ghost text-sm">
                <Icon name="ArrowLeftIcon" size={16} variant="outline" />
                Voltar
              </Link>
            </div>
          </div>

          {/* Status Workflow */}
          <div className="mb-6">
            <StatusWorkflow steps={workflowSteps} />
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mobile Tab Bar */}
            <div className="lg:hidden col-span-1">
              <div
                className="flex rounded-xl overflow-hidden border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-muted)' }}
                role="tablist"
                aria-label="Pitch detail sections">
                
                {([
                { key: 'metadata', label: 'Details', icon: 'InformationCircleIcon' },
                { key: 'notes', label: 'Notes', icon: 'ChatBubbleLeftEllipsisIcon' },
                { key: 'links', label: 'Links', icon: 'LinkIcon' }] as
                const).map((tab) =>
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={mobileTab === tab.key}
                  onClick={() => setMobileTab(tab.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    minHeight: '44px',
                    background: mobileTab === tab.key ? 'var(--color-card)' : 'transparent',
                    color: mobileTab === tab.key ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontWeight: mobileTab === tab.key ? 600 : 400,
                    borderBottom: mobileTab === tab.key ? '2px solid var(--color-foreground)' : '2px solid transparent'
                  }}>
                  
                    <span aria-hidden="true" className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.label}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Left Column - Metadata */}
            <div className={`lg:col-span-1 space-y-5 ${mobileTab !== 'metadata' ? 'hidden lg:block' : ''}`}>
              <PitchMetadata
                artist={pitchData.artist}
                genre={pitchData.genre}
                submissionDate={pitchData.submissionDate}
                status={currentStatus}
                tags={pitchData.tags}
                contact={pitchData.contact}
                label={pitchData.label}
                imageUrl={pitchData.imageUrl}
                imageAlt={pitchData.imageAlt} />
            </div>

            {/* Right Column - Notes + Description */}
            <div className={`lg:col-span-2 space-y-5 ${mobileTab === 'metadata' ? 'hidden lg:block' : mobileTab === 'links' ? 'hidden lg:block' : ''}`}>
              {/* Description Panel */}
              <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center justify-between w-full text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Descrição do Pitch</p>
                  <Icon name={showDescription ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} variant="outline" className="text-muted-foreground" />
                </button>
                {showDescription &&
                <div className="mt-3 space-y-3">
                    {pitchData.description.split('\n\n').map((para, i) =>
                  <p key={i} className="text-sm text-foreground leading-relaxed">{para}</p>
                  )}
                  </div>
                }
              </div>

              {/* Recipients Section */}
              <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Recipients
                  </p>
                  {pitchArtist &&
                  <span className="text-xs text-muted-foreground">
                      Artist: <span className="font-medium text-foreground">{pitchArtist.name}</span>
                    </span>
                  }
                </div>

                {recipients.length === 0 ?
                <p className="text-sm text-muted-foreground py-2">No recipients linked to this pitch.</p> :

                <div className="space-y-2">
                    {recipients.map((entry, idx) =>
                  <div
                    key={entry.contact.id + idx}
                    className="flex items-start gap-3 px-3 py-3 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface, #fafafa)' }}>
                    
                        {/* Avatar initial */}
                        <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--color-foreground)' }}>
                      
                          {entry.contact.fullName.charAt(0).toUpperCase()}
                        </div>

                        {/* Contact info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{entry.contact.fullName}</span>
                            <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                          
                              {entry.contact.role}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.contact.company}</p>
                          <p
                        className="text-xs mt-1"
                        style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-muted-foreground)' }}>
                        
                            {entry.contact.email}
                          </p>
                        </div>
                      </div>
                  )}
                  </div>
                }
              </div>

              {/* Notes Section */}
              <NotesSection initialNotes={mockNotes} />
            </div>
          </div>

          {/* External Links - Full Width on desktop, tab on mobile */}
          <div className={`mt-6 ${mobileTab !== 'links' ? 'hidden lg:block' : ''}`}>
            <ExternalLinks links={mockLinks} />
          </div>
        </div>
      </main>

      {/* Click outside to close dropdown */}
      {showStatusDropdown &&
      <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
      }

      {/* Keyboard Shortcuts Help Modal */}
      {showHelpModal &&
      <ShortcutsHelpModal
        onClose={() => setShowHelpModal(false)}
        shortcuts={[
        { keys: ['⌘', '/'], description: 'Focus notes search' },
        { keys: ['⌘', 'F'], description: 'Focus date filter' },
        { keys: ['⌘', '?'], description: 'Show this help' },
        { keys: ['Esc'], description: 'Close modal / clear focus' }]
        } />

      }
    </div>);

}
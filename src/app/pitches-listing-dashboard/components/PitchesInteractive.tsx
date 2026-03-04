'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import Breadcrumb from '@/components/common/Breadcrumb';
import Icon from '@/components/ui/AppIcon';
import PitchesFilterBar from './PitchesFilterBar';
import PitchCard from './PitchCard';
import PitchesStatsBar from './PitchesStatsBar';
import EmptyState from './EmptyState';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ShortcutsHelpModal from '@/components/ui/ShortcutsHelpModal';
import NewPitchModal from '@/components/ui/NewPitchModal';

import { pitchStore, artistStore, initStore } from '@/lib/store';
import type { Pitch as StoredPitch } from '@/lib/types';

type StatusType = 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';

interface Pitch {
  id: string;
  title: string;
  artist: string;
  artistImage: string;
  artistImageAlt: string;
  status: StatusType;
  category: string;
  tags: string[];
  submittedAt: string;
  label: string;
  description: string;
}

const mockPitches: Pitch[] = [
{
  id: '1',
  title: 'Noite de Verão - Single Inédito',
  artist: 'Mariana Luz',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_121a29bbc-1763298634057.png",
  artistImageAlt: 'Young Brazilian woman with long dark hair smiling confidently in studio setting',
  status: 'em_analise',
  category: 'Pop',
  tags: ['verão', 'dançante', 'radio'],
  submittedAt: '28/02/2026',
  label: 'Sony Music Brasil',
  description: 'Single pop com influências tropicais e batida eletrônica. Ideal para playlists de verão e rádios FM.'
},
{
  id: '2',
  title: 'Raízes do Sertão - EP Completo',
  artist: 'Trio Nordestino',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1947763d5-1772439220300.png",
  artistImageAlt: 'Brazilian man with acoustic guitar in rustic countryside setting wearing traditional hat',
  status: 'aprovado',
  category: 'Sertanejo',
  tags: ['sertanejo', 'acústico', 'autoral'],
  submittedAt: '25/02/2026',
  label: 'Universal Music',
  description: 'EP de 5 faixas com sonoridade sertaneja raiz, letras autorais sobre vida no campo e tradições nordestinas.'
},
{
  id: '3',
  title: 'Batidão Carioca Vol. 3',
  artist: 'DJ Favela',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1ed170415-1772267674768.png",
  artistImageAlt: 'Young Black man with headphones around neck in urban Rio de Janeiro street background',
  status: 'novo',
  category: 'Funk',
  tags: ['funk', 'baile', 'carioca'],
  submittedAt: '01/03/2026',
  label: 'Independente',
  description: 'Coletânea de funk carioca com 12 faixas produzidas em estúdio profissional. Artista com 2M de seguidores.'
},
{
  id: '4',
  title: 'Alma Livre - Álbum Conceitual',
  artist: 'Beatriz Santos',
  artistImage: "https://images.unsplash.com/photo-1730177203484-db14757d3a2a",
  artistImageAlt: 'Brazilian woman with natural curly hair in artistic pose against colorful mural background',
  status: 'pendente',
  category: 'MPB',
  tags: ['mpb', 'conceitual', 'poético'],
  submittedAt: '20/02/2026',
  label: 'Warner Music',
  description: 'Álbum conceitual de MPB explorando temas de liberdade e identidade brasileira. 10 faixas com arranjos orquestrais.'
},
{
  id: '5',
  title: 'Frequência 432Hz - Álbum Eletrônico',
  artist: 'Synthwave BR',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_188132e15-1769403212471.png",
  artistImageAlt: 'Young man with electronic music equipment in dark studio with colorful LED lighting',
  status: 'rejeitado',
  category: 'Eletrônica',
  tags: ['eletrônica', 'synthwave', 'instrumental'],
  submittedAt: '15/02/2026',
  label: 'Independente',
  description: 'Álbum instrumental de música eletrônica com influências de synthwave e ambient. Produção 100% autoral.'
},
{
  id: '6',
  title: 'Fé que Move - Coletânea Gospel',
  artist: 'Coral Esperança',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1e23ea9f8-1772439224115.png",
  artistImageAlt: 'Gospel choir group in white robes performing on stage with bright lighting',
  status: 'em_analise',
  category: 'Gospel',
  tags: ['gospel', 'coral', 'louvor'],
  submittedAt: '27/02/2026',
  label: 'MK Music',
  description: 'Coletânea gospel com 8 faixas de louvor e adoração. Coral com 40 vozes e produção de alto nível.'
},
{
  id: '7',
  title: 'Rua Sem Saída - Mixtape',
  artist: 'MC Verdade',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_15be4e7df-1772439222653.png",
  artistImageAlt: 'Young Black Brazilian rapper in streetwear standing in urban São Paulo neighborhood',
  status: 'novo',
  category: 'Hip-Hop',
  tags: ['rap', 'consciente', 'periferia'],
  submittedAt: '02/03/2026',
  label: 'Independente',
  description: 'Mixtape de rap consciente com 15 faixas abordando realidade da periferia paulistana. Artista emergente com potencial.'
},
{
  id: '8',
  title: 'Pedra e Cal - Rock Nacional',
  artist: 'Banda Concreto',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1b80adaa0-1772439222611.png",
  artistImageAlt: 'Rock band of four members posing in industrial warehouse with guitars and drums',
  status: 'arquivado',
  category: 'Rock',
  tags: ['rock', 'nacional', 'alternativo'],
  submittedAt: '10/01/2026',
  label: 'Som Livre',
  description: 'Álbum de rock nacional alternativo com 11 faixas. Banda com 5 anos de carreira e base de fãs consolidada.'
},
{
  id: '9',
  title: 'Lua Cheia - Pagode Romântico',
  artist: 'Grupo Harmonia',
  artistImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1be6e2418-1772439224800.png",
  artistImageAlt: 'Brazilian pagode group of five musicians with traditional instruments in rehearsal space',
  status: 'aprovado',
  category: 'Pop',
  tags: ['pagode', 'romântico', 'samba'],
  submittedAt: '18/02/2026',
  label: 'Universal Music',
  description: 'Single de pagode romântico com potencial para tocar em rádios e plataformas de streaming. Grupo com 500k seguidores.'
}];


interface FilterState {
  search: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const STATUS_OPTIONS: { value: StatusType; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'arquivado', label: 'Arquivado' },
];

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

function PitchCardSkeleton({ viewMode }: { viewMode: 'card' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-200 bg-white animate-pulse">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-5 bg-gray-200 rounded shrink-0" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200" />
      <div className="p-3 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-5 w-12 bg-gray-200 rounded-full" />
          <div className="h-5 w-14 bg-gray-100 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function StatsBarSkeleton() {
  return (
    <div className="flex gap-3 flex-wrap animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-24 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );
}

function Spinner({ size = 13 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function SummaryCard({ icon, label, value, sub, accent }: SummaryCardProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white"
      style={{ borderColor: accent ? 'var(--color-foreground)' : '#e5e7eb' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ? 'var(--color-foreground)' : '#f3f4f6' }}
      >
        <Icon
          name={icon as Parameters<typeof Icon>[0]['name']}
          size={18}
          variant="outline"
          className={accent ? 'text-white' : 'text-gray-500'}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{sub}</p>}
      </div>
    </div>
  );
}

// Helper to convert a stored pitch to the display Pitch format
function storedToDisplay(p: StoredPitch, artistName: string): Pitch {
  const statusMap: Record<string, StatusType> = {
    draft: 'novo',
    sent: 'em_analise',
    hold: 'pendente',
    placed: 'aprovado',
  };
  const d = new Date(p.createdAt);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return {
    id: p.id,
    title: p.title,
    artist: artistName,
    artistImage: '',
    artistImageAlt: `${artistName} artist`,
    status: statusMap[p.status] ?? 'novo',
    category: '',
    tags: [],
    submittedAt: `${day}/${month}/${year}`,
    label: '',
    description: p.notes || '',
  };
}

function loadPitchesFromStore(): Pitch[] {
  initStore();
  const stored = pitchStore.getAll();
  const artists = artistStore.getAll();
  return stored.map((p) => {
    const artist = artists.find((a) => a.id === p.artistId);
    return storedToDisplay(p, artist?.name ?? 'Unknown Artist');
  });
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, isLoading }: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-gray-100">
      {/* Items info + per-page selector — always full width on mobile */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          {isLoading ? (
            <span className="inline-block h-3 w-28 bg-gray-200 rounded animate-pulse" />
          ) : (
            totalItems === 0 ? 'No results' : `${startItem}–${endItem} of ${totalItems}`
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            aria-label="Items per page"
            className="text-xs rounded-lg px-2 py-1.5 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page controls — centered single row on mobile */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap" role="navigation" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Icon name="ChevronLeftIcon" size={13} variant="outline" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-xs text-gray-400" aria-hidden="true">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`min-w-[36px] min-h-[36px] px-2.5 py-2 rounded-lg text-xs border transition-all disabled:cursor-not-allowed ${
                  currentPage === page
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold' :'border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="ChevronRightIcon" size={13} variant="outline" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PitchesInteractive() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    category: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<StatusType>('em_analise');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Keyboard shortcuts state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [editingPitch, setEditingPitch] = useState<StoredPitch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef(filters);

  // Listen for real-time refresh events dispatched by the Header's subscription
  useEffect(() => {
    const handleRealtimeRefresh = () => {
      setPitches(loadPitchesFromStore());
    };
    window.addEventListener('realtime-refresh', handleRealtimeRefresh);
    return () => window.removeEventListener('realtime-refresh', handleRealtimeRefresh);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPitches(loadPitchesFromStore());
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Trigger skeleton on filter/search/sort changes
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.search !== filters.search ||
      prev.status !== filters.status ||
      prev.category !== filters.category ||
      prev.sortBy !== filters.sortBy ||
      prev.sortOrder !== filters.sortOrder;

    if (changed && !isLoading) {
      setIsFilterLoading(true);
      setCurrentPage(1);
      const timer = setTimeout(() => setIsFilterLoading(false), 400);
      prevFiltersRef.current = filters;
      return () => clearTimeout(timer);
    }
    prevFiltersRef.current = filters;
  }, [filters, isLoading]);

  const filteredPitches = useMemo(() => {
    let result = [...pitches];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.artist.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.category) {
      result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === 'artist') cmp = a.artist.localeCompare(b.artist);else
      if (filters.sortBy === 'title') cmp = a.title.localeCompare(b.title);else
      if (filters.sortBy === 'status') cmp = a.status.localeCompare(b.status);else
      {
        const parseDate = (d: string) => {
          const [day, month, year] = d.split('/');
          return new Date(+year, +month - 1, +day).getTime();
        };
        cmp = parseDate(a.submittedAt) - parseDate(b.submittedAt);
      }
      return filters.sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [filters, pitches]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPitches.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPitches = filteredPitches.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => ({
    total: pitches.length,
    novo: pitches.filter((p) => p.status === 'novo').length,
    em_analise: pitches.filter((p) => p.status === 'em_analise').length,
    aprovado: pitches.filter((p) => p.status === 'aprovado').length,
    rejeitado: pitches.filter((p) => p.status === 'rejeitado').length,
    pendente: pitches.filter((p) => p.status === 'pendente').length
  }), [pitches]);

  // Summary card metrics
  const summaryMetrics = useMemo(() => {
    const total = pitches.length;
    const approved = pitches.filter((p) => p.status === 'aprovado').length;
    const reviewed = pitches.filter((p) => ['aprovado', 'rejeitado', 'em_analise'].includes(p.status)).length;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;
    // Average review time: mock calculation based on submission dates (days since submitted)
    const now = new Date();
    const reviewedPitches = pitches.filter((p) => ['aprovado', 'rejeitado'].includes(p.status));
    const avgDays = reviewedPitches.length > 0
      ? Math.round(
          reviewedPitches.reduce((sum, p) => {
            const [day, month, year] = p.submittedAt.split('/');
            const submitted = new Date(+year, +month - 1, +day);
            return sum + Math.max(0, Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)));
          }, 0) / reviewedPitches.length
        )
      : 0;
    // Recent submissions: pitches submitted in last 7 days
    const recentCount = pitches.filter((p) => {
      const [day, month, year] = p.submittedAt.split('/');
      const submitted = new Date(+year, +month - 1, +day);
      return (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    return { total, approvalRate, avgDays, recentCount };
  }, [pitches]);

  const hasActiveFilters = !!(filters.search || filters.status || filters.category);

  // Multi-select handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPitches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPitches.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      selectedIds.forEach((id) => pitchStore.delete(id));
      setPitches(loadPitchesFromStore());
      setSelectedIds(new Set());
      setCurrentPage(1);
    } catch {
      showToast('Failed to delete pitches. Please try again.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setIsBulkUpdating(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      setPitches((prev) =>
        prev.map((p) => selectedIds.has(p.id) ? { ...p, status: bulkStatusValue } : p)
      );
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update pitch statuses. Please try again.', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkExport = () => {
    const selected = pitches.filter((p) => selectedIds.has(p.id));
    const header = 'ID,Title,Artist,Status,Category,Label,Submitted';
    const rows = selected.map((p) =>
      `${p.id},"${p.title}","${p.artist}",${p.status},${p.category},"${p.label}",${p.submittedAt}`
    ).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitches_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  const handleEditPitch = (pitch: Pitch) => {
    const stored = pitchStore.getById(pitch.id);
    if (stored) {
      setEditingPitch(stored);
    } else {
      setEditingPitch({
        id: pitch.id,
        title: pitch.title,
        artistId: '',
        trackUrl: '',
        status: 'draft',
        notes: pitch.description || '',
        createdAt: pitch.submittedAt,
      });
    }
    setIsEditModalOpen(true);
  };

  const showSkeleton = isLoading || isFilterLoading;
  const selectionMode = selectedIds.size > 0;
  const allPageSelected = paginatedPitches.length > 0 && paginatedPitches.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0 && !allPageSelected;
  const isBulkProcessing = isBulkDeleting || isBulkUpdating;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewPitch: () => router.push('/pitch-creation-workflow'),
    onSearch: () => {
      // Focus the search input in the filter bar
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    onFilter: () => setFiltersOpen((prev) => !prev),
    onHelp: () => setShowHelpModal(true),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: 'Início', path: '/pitches-listing-dashboard' }, { label: 'Pitches' }]} className="mb-6" />

          {/* Summary Cards */}
          {!isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" role="region" aria-label="Pitches summary statistics">
              <SummaryCard
                icon="DocumentTextIcon"
                label="Total Pitches"
                value={summaryMetrics.total}
                sub="all time"
                accent
              />
              <SummaryCard
                icon="CheckCircleIcon"
                label="Approval Rate"
                value={`${summaryMetrics.approvalRate}%`}
                sub="of reviewed pitches"
              />
              <SummaryCard
                icon="ClockIcon"
                label="Avg Review Time"
                value={`${summaryMetrics.avgDays}d`}
                sub="days to decision"
              />
              <SummaryCard
                icon="BoltIcon"
                label="Recent (7d)"
                value={summaryMetrics.recentCount}
                sub="new submissions"
              />
            </div>
          )}

          {/* Main Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-[18px] shadow-sm">

            {/* Topbar */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  Gerenciamento
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Pitches
                </h1>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2.5 transition-all ${viewMode === 'card' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    aria-label="Visualização em cards">
                    <Icon name="Squares2X2Icon" size={16} variant="outline" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    aria-label="Visualização em lista">
                    <Icon name="ListBulletIcon" size={16} variant="outline" />
                  </button>
                </div>
                {/* Shortcuts help button */}
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  aria-label="Show keyboard shortcuts (⌘+?)"
                  title="Keyboard shortcuts (⌘+?)"
                >
                  <Icon name="QuestionMarkCircleIcon" size={15} variant="outline" />
                  <span className="hidden lg:inline">Shortcuts</span>
                </button>
                <Link href="/pitch-creation-workflow" className="pm-btn-primary text-sm min-h-[36px] flex items-center gap-1.5">
                  <Icon name="PlusIcon" size={16} variant="outline" />
                  <span className="hidden sm:inline">Novo Pitch</span>
                  <span className="sm:hidden">Novo</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-5">
              {isLoading ? <StatsBarSkeleton /> : <PitchesStatsBar stats={stats} />}
            </div>

            {/* Filters */}
            <div className="mb-5">
              <PitchesFilterBar
                filters={filters}
                onFilterChange={setFilters}
                totalCount={pitches.length}
                filteredCount={filteredPitches.length}
                mobileFiltersOpen={filtersOpen}
                onMobileFiltersToggle={() => setFiltersOpen((prev) => !prev)}
              />
            </div>

            {/* Select-all row */}
            {!showSkeleton && paginatedPitches.length > 0 && (
              <div className="flex items-center gap-3 mb-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    role="checkbox"
                    aria-checked={allPageSelected ? true : someSelected ? 'mixed' : false}
                    aria-label={allPageSelected ? 'Deselect all pitches on this page' : 'Select all pitches on this page'}
                    tabIndex={0}
                    onClick={toggleSelectAll}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSelectAll(); } }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
                      allPageSelected
                        ? 'bg-gray-900 border-gray-900'
                        : someSelected
                        ? 'bg-gray-400 border-gray-400' : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {(allPageSelected || someSelected) && (
                      <Icon name="MinusIcon" size={10} variant="outline" className="text-gray-500" />
                    )}
                    {allPageSelected && (
                      <Icon name="CheckIcon" size={10} variant="outline" className="text-gray-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </span>
                </label>
              </div>
            )}

            {/* Bulk Action Toolbar — touch-friendly on mobile */}
            {selectionMode && (
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 px-3 py-3 rounded-xl border"
                style={{ background: '#1d4ed8', borderColor: '#2563EB' }}
                role="toolbar"
                aria-label={`Bulk actions for ${selectedIds.size} selected pitch${selectedIds.size !== 1 ? 'es' : ''}`}
              >
                {/* Row 1: count + clear */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs font-semibold text-white" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {selectedIds.size} pitch{selectedIds.size !== 1 ? 'es' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    disabled={isBulkProcessing}
                    aria-label="Clear selection"
                    className="sm:hidden flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg hover:bg-blue-700 text-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="XMarkIcon" size={13} variant="outline" aria-hidden="true" />
                    Clear
                  </button>
                </div>

                {/* Row 2: actions */}
                <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                  {/* Status update */}
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <select
                      value={bulkStatusValue}
                      onChange={(e) => setBulkStatusValue(e.target.value as StatusType)}
                      disabled={isBulkProcessing}
                      aria-label="Select new status for bulk update"
                      className="flex-1 sm:flex-none text-xs rounded-lg px-2 py-2 border border-blue-400 bg-blue-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleBulkStatusUpdate}
                      disabled={isBulkProcessing}
                      aria-label={isBulkUpdating ? 'Updating status for selected pitches…' : `Update status of ${selectedIds.size} selected pitch${selectedIds.size !== 1 ? 'es' : ''} to ${bulkStatusValue}`}
                      aria-busy={isBulkUpdating}
                      className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                    >
                      {isBulkUpdating ? <Spinner size={13} /> : <Icon name="ArrowPathIcon" size={13} variant="outline" aria-hidden="true" />}
                      <span>{isBulkUpdating ? 'Updating…' : 'Update'}</span>
                    </button>
                  </div>
                  {/* Export */}
                  <button
                    onClick={handleBulkExport}
                    disabled={isBulkProcessing}
                    aria-label={`Export ${selectedIds.size} selected pitch${selectedIds.size !== 1 ? 'es' : ''} as CSV`}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    <Icon name="ArrowDownTrayIcon" size={13} variant="outline" aria-hidden="true" />
                    <span>Export</span>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkProcessing}
                    aria-label={isBulkDeleting ? 'Deleting selected pitches…' : `Delete ${selectedIds.size} selected pitch${selectedIds.size !== 1 ? 'es' : ''}`}
                    aria-busy={isBulkDeleting}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    {isBulkDeleting ? <Spinner size={13} /> : <Icon name="TrashIcon" size={13} variant="outline" aria-hidden="true" />}
                    <span>{isBulkDeleting ? 'Deleting…' : 'Delete'}</span>
                  </button>
                  {/* Clear — desktop only */}
                  <button
                    onClick={clearSelection}
                    disabled={isBulkProcessing}
                    aria-label="Clear selection"
                    className="hidden sm:flex items-center gap-1 text-xs px-2 py-2 rounded-lg hover:bg-blue-700 text-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    <Icon name="XMarkIcon" size={13} variant="outline" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Pitches Grid / List */}
            <div aria-live="polite" aria-busy={showSkeleton} role="region" aria-label="Pitches list">
              {showSkeleton ? (
                viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: pageSize }).map((_, i) => (
                      <PitchCardSkeleton key={i} viewMode="card" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: pageSize }).map((_, i) => (
                      <PitchCardSkeleton key={i} viewMode="list" />
                    ))}
                  </div>
                )
              ) : filteredPitches.length === 0 ? (
                <EmptyState hasFilters={hasActiveFilters} />
              ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedPitches.map((pitch) => (
                    <PitchCard
                      key={pitch.id}
                      pitch={pitch}
                      viewMode="card"
                      isSelected={selectedIds.has(pitch.id)}
                      onToggleSelect={toggleSelect}
                      selectionMode={selectionMode}
                      onEdit={handleEditPitch}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedPitches.map((pitch) => (
                    <PitchCard
                      key={pitch.id}
                      pitch={pitch}
                      viewMode="list"
                      isSelected={selectedIds.has(pitch.id)}
                      onToggleSelect={toggleSelect}
                      selectionMode={selectionMode}
                      onEdit={handleEditPitch}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!showSkeleton && filteredPitches.length > 0 && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredPitches.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={showSkeleton}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} PitchManager. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/pitches-listing-dashboard" className="hover:text-gray-600 transition-colors">Dashboard</Link>
            <Link href="/pitch-creation-workflow" className="hover:text-gray-600 transition-colors">Novo Pitch</Link>
            <Link href="/pitch-detail-management" className="hover:text-gray-600 transition-colors">Detalhes</Link>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelpModal && (
        <ShortcutsHelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {/* Edit Pitch Modal */}
      <NewPitchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPitch(null);
          setPitches(loadPitchesFromStore());
        }}
        editPitch={editingPitch ?? undefined}
      />
    </div>
  );
}
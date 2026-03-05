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
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ShortcutsHelpModal from '@/components/ui/ShortcutsHelpModal';
import NewPitchModal from '@/components/ui/NewPitchModal';
import { createClient } from '@/lib/supabase/client';

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
  reminderCount?: number;
}

interface EditingPitch {
  id: string;
  title: string;
  artistId: string;
  trackUrl: string;
  status: string;
  notes: string;
  createdAt: string;
}

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

const DB_STATUS_MAP: Record<string, StatusType> = {
  draft: 'novo',
  new: 'novo',
  in_review: 'em_analise',
  sent: 'em_analise',
  hold: 'pendente',
  placed: 'aprovado',
  approved: 'aprovado',
  rejected: 'rejeitado',
  archived: 'arquivado',
  novo: 'novo',
  em_analise: 'em_analise',
  aprovado: 'aprovado',
  rejeitado: 'rejeitado',
  pendente: 'pendente',
  arquivado: 'arquivado',
};

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

function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function EmptyPitchesState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon name="FunnelIcon" size={28} variant="outline" className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No pitches match your filters</h3>
        <p className="text-sm text-gray-400 mb-4 max-w-xs">Try adjusting your search or filter criteria to find what you're looking for.</p>
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-gray-600">
          <Icon name="XCircleIcon" size={14} variant="outline" />
          Clear Filters
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <Icon name="PaperAirplaneIcon" size={28} variant="outline" className="text-blue-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">No pitches yet</h3>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">Start by creating your first pitch to track your music submissions and follow up with labels.</p>
      <Link
        href="/pitch-creation-workflow"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
        <Icon name="PlusIcon" size={16} variant="outline" />
        + New Pitch
      </Link>
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
      aria-hidden="true">
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
      style={{ borderColor: accent ? 'var(--color-foreground)' : '#e5e7eb' }}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ? 'var(--color-foreground)' : '#f3f4f6' }}>
        <Icon
          name={icon as Parameters<typeof Icon>[0]['name']}
          size={18}
          variant="outline"
          className={accent ? 'text-white' : 'text-gray-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{sub}</p>}
      </div>
    </div>
  );
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          {isLoading ? (
            <span className="inline-block h-3 w-28 bg-gray-200 rounded animate-pulse" />
          ) : totalItems === 0 ? 'No results' : `${startItem}–${endItem} of ${totalItems}`}
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            aria-label="Items per page"
            className="text-xs rounded-lg px-2 py-1.5 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap" role="navigation" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
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
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
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
  const supabase = useMemo(() => createClient(), []);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    category: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<StatusType>('em_analise');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<EditingPitch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const prevFiltersRef = useRef(filters);

  // ── Supabase fetch ──────────────────────────────────────────────────────────
  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPitches([]);
        setIsLoading(false);
        return;
      }

      const { data: pitchRows, error: pitchError } = await supabase
        .from('pitches')
        .select('id, title, artist_id, status, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (pitchError) throw pitchError;

      const { data: artistRows } = await supabase
        .from('artists')
        .select('id, name, genre, avatar_url')
        .eq('user_id', user.id);

      const { data: reminderRows } = await supabase
        .from('reminders')
        .select('pitch_id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const artistMap: Record<string, { name: string; genre: string; avatar: string }> = {};
      (artistRows || []).forEach((a) => {
        artistMap[a.id] = { name: a.name, genre: a.genre || '', avatar: a.avatar_url || '' };
      });

      const reminderCountMap: Record<string, number> = {};
      (reminderRows || []).forEach((r) => {
        if (r.pitch_id) {
          reminderCountMap[r.pitch_id] = (reminderCountMap[r.pitch_id] || 0) + 1;
        }
      });

      const mapped: Pitch[] = (pitchRows || []).map((row) => {
        const artist = artistMap[row.artist_id] || { name: 'Unknown Artist', genre: '', avatar: '' };
        const d = new Date(row.created_at);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return {
          id: row.id,
          title: row.title,
          artist: artist.name,
          artistImage: artist.avatar,
          artistImageAlt: `${artist.name} artist photo`,
          status: DB_STATUS_MAP[row.status] ?? 'novo',
          category: artist.genre,
          tags: [],
          submittedAt: `${day}/${month}/${year}`,
          label: '',
          description: row.notes || '',
          reminderCount: reminderCountMap[row.id] || 0,
        };
      });

      setPitches(mapped);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PitchesInteractive] Failed to fetch pitches:', err instanceof Error ? err.message : err);
      }
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPitches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('pitches-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pitches', filter: `user_id=eq.${user.id}` }, () => { fetchPitches(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, () => { fetchPitches(); })
        .subscribe();
    };

    setupRealtime();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleRealtimeRefresh = () => { fetchPitches(); };
    window.addEventListener('realtime-refresh', handleRealtimeRefresh);
    return () => window.removeEventListener('realtime-refresh', handleRealtimeRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.category) result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());

    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === 'artist') cmp = a.artist.localeCompare(b.artist);
      else if (filters.sortBy === 'title') cmp = a.title.localeCompare(b.title);
      else if (filters.sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else {
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

  const totalPages = Math.max(1, Math.ceil(filteredPitches.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPitches = filteredPitches.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => ({
    total: pitches.length,
    novo: pitches.filter((p) => p.status === 'novo').length,
    em_analise: pitches.filter((p) => p.status === 'em_analise').length,
    aprovado: pitches.filter((p) => p.status === 'aprovado').length,
    rejeitado: pitches.filter((p) => p.status === 'rejeitado').length,
    pendente: pitches.filter((p) => p.status === 'pendente').length,
  }), [pitches]);

  const summaryMetrics = useMemo(() => {
    const total = pitches.length;
    const approved = pitches.filter((p) => p.status === 'aprovado').length;
    const reviewed = pitches.filter((p) => ['aprovado', 'rejeitado', 'em_analise'].includes(p.status)).length;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;
    const now = new Date();
    const reviewedPitches = pitches.filter((p) => ['aprovado', 'rejeitado'].includes(p.status));
    const avgDays = reviewedPitches.length > 0
      ? Math.round(reviewedPitches.reduce((sum, p) => {
          const [day, month, year] = p.submittedAt.split('/');
          const submitted = new Date(+year, +month - 1, +day);
          return sum + Math.max(0, Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)));
        }, 0) / reviewedPitches.length)
      : 0;
    const recentCount = pitches.filter((p) => {
      const [day, month, year] = p.submittedAt.split('/');
      const submitted = new Date(+year, +month - 1, +day);
      return (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    return { total, approvalRate, avgDays, recentCount };
  }, [pitches]);

  const hasActiveFilters = !!(filters.search || filters.status || filters.category);

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('pitches').delete().in('id', Array.from(selectedIds)).eq('user_id', user.id);
      }
      await fetchPitches();
      setSelectedIds(new Set());
      setCurrentPage(1);
    } catch {
      if (process.env.NODE_ENV === 'development') console.error('Failed to delete pitches');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setIsBulkUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dbStatusReverseMap: Record<StatusType, string> = {
        novo: 'draft',
        em_analise: 'in_review',
        aprovado: 'approved',
        rejeitado: 'rejected',
        pendente: 'hold',
        arquivado: 'archived',
      };
      if (user) {
        await supabase
          .from('pitches')
          .update({ status: dbStatusReverseMap[bulkStatusValue] })
          .in('id', Array.from(selectedIds))
          .eq('user_id', user.id);
        await fetchPitches();
      }
      setSelectedIds(new Set());
    } catch {
      if (process.env.NODE_ENV === 'development') console.error('Failed to update pitch statuses');
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

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); setSelectedIds(new Set()); };
  const handlePageChange = (page: number) => { setCurrentPage(page); setSelectedIds(new Set()); };

  const handleEditPitch = (pitch: Pitch) => {
    setEditingPitch({
      id: pitch.id,
      title: pitch.title,
      artistId: '',
      trackUrl: '',
      status: 'draft',
      notes: pitch.description || '',
      createdAt: pitch.submittedAt,
    });
    setIsEditModalOpen(true);
  };

  const showSkeleton = isLoading || isFilterLoading;
  const selectionMode = selectedIds.size > 0;
  const allPageSelected = paginatedPitches.length > 0 && paginatedPitches.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0 && !allPageSelected;
  const isBulkProcessing = isBulkDeleting || isBulkUpdating;

  useKeyboardShortcuts({
    onNewPitch: () => router.push('/pitch-creation-workflow'),
    onSearch: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
      if (searchInput) { searchInput.focus(); searchInput.select(); }
    },
    onFilter: () => setFiltersOpen((prev) => !prev),
    onHelp: () => setShowHelpModal(true),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: 'Início', path: '/pitches-listing-dashboard' }, { label: 'Pitches' }]} className="mb-6" />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" role="region" aria-label="Pitches summary statistics">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            ) : (
              <>
                <SummaryCard icon="DocumentTextIcon" label="Total Pitches" value={summaryMetrics.total} sub="all time" accent />
                <SummaryCard icon="CheckCircleIcon" label="Approval Rate" value={`${summaryMetrics.approvalRate}%`} sub="of reviewed pitches" />
                <SummaryCard icon="ClockIcon" label="Avg Review Time" value={`${summaryMetrics.avgDays}d`} sub="days to decision" />
                <SummaryCard icon="BoltIcon" label="Recent (7d)" value={summaryMetrics.recentCount} sub="new submissions" />
              </>
            )}
          </div>

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
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  aria-label="Show keyboard shortcuts (⌘+?)"
                  title="Keyboard shortcuts (⌘+?)">
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
                onMobileFiltersToggle={() => setFiltersOpen((prev) => !prev)} />
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
                      allPageSelected ? 'bg-gray-900 border-gray-900' : someSelected ? 'bg-gray-400 border-gray-400' : 'border-gray-300 hover:border-gray-500'
                    }`}>
                    {(allPageSelected || someSelected) && <Icon name="MinusIcon" size={10} variant="outline" className="text-white" />}
                    {allPageSelected && <Icon name="CheckIcon" size={10} variant="outline" className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </span>
                </label>
              </div>
            )}

            {/* Bulk Action Toolbar */}
            {selectionMode && (
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 px-3 py-3 rounded-xl border"
                style={{ background: '#1d4ed8', borderColor: '#2563EB' }}
                role="toolbar"
                aria-label={`Bulk actions for ${selectedIds.size} selected pitch${selectedIds.size !== 1 ? 'es' : ''}`}>
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs font-semibold text-white" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {selectedIds.size} pitch{selectedIds.size !== 1 ? 'es' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    disabled={isBulkProcessing}
                    aria-label="Clear selection"
                    className="sm:hidden flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg hover:bg-blue-700 text-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Icon name="XMarkIcon" size={13} variant="outline" aria-hidden="true" />
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <select
                      value={bulkStatusValue}
                      onChange={(e) => setBulkStatusValue(e.target.value as StatusType)}
                      disabled={isBulkProcessing}
                      aria-label="Select new status for bulk update"
                      className="flex-1 sm:flex-none text-xs rounded-lg px-2 py-2 border border-blue-400 bg-blue-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button
                      onClick={handleBulkStatusUpdate}
                      disabled={isBulkProcessing}
                      aria-label={isBulkUpdating ? 'Updating status…' : `Update status of ${selectedIds.size} selected`}
                      aria-busy={isBulkUpdating}
                      className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]">
                      {isBulkUpdating ? <Spinner size={13} /> : <Icon name="ArrowPathIcon" size={13} variant="outline" aria-hidden="true" />}
                      <span>{isBulkUpdating ? 'Updating…' : 'Update'}</span>
                    </button>
                  </div>
                  <button
                    onClick={handleBulkExport}
                    disabled={isBulkProcessing}
                    aria-label={`Export ${selectedIds.size} selected pitches as CSV`}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]">
                    <Icon name="ArrowDownTrayIcon" size={13} variant="outline" aria-hidden="true" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkProcessing}
                    aria-label={isBulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size} selected pitches`}
                    aria-busy={isBulkDeleting}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]">
                    {isBulkDeleting ? <Spinner size={13} /> : <Icon name="TrashIcon" size={13} variant="outline" aria-hidden="true" />}
                    <span>{isBulkDeleting ? 'Deleting…' : 'Delete'}</span>
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={isBulkProcessing}
                    aria-label="Clear selection"
                    className="hidden sm:flex items-center gap-1 text-xs px-2 py-2 rounded-lg hover:bg-blue-700 text-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]">
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
                    {Array.from({ length: pageSize }).map((_, i) => <PitchCardSkeleton key={i} viewMode="card" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: pageSize }).map((_, i) => <PitchCardSkeleton key={i} viewMode="list" />)}
                  </div>
                )
              ) : filteredPitches.length === 0 ? (
                <EmptyPitchesState
                  hasFilters={hasActiveFilters}
                  onClearFilters={() => setFilters({ search: '', status: '', category: '', sortBy: 'date', sortOrder: 'desc' })} />
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
                      onEdit={handleEditPitch} />
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
                      onEdit={handleEditPitch} />
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
                isLoading={showSkeleton} />
            )}
          </div>
        </div>
      </main>

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

      {showHelpModal && <ShortcutsHelpModal onClose={() => setShowHelpModal(false)} />}

      <NewPitchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPitch(null);
          fetchPitches();
        }}
        editPitch={editingPitch ?? undefined} />
    </div>
  );
}
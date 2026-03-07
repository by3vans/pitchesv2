'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterState {
  search: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PitchesFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  mobileFiltersOpen?: boolean;
  onMobileFiltersToggle?: () => void;
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'novo', label: 'Novo' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'arquivado', label: 'Arquivado' },
];

const categoryOptions = [
  { value: '', label: 'Todas as Categorias' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'funk', label: 'Funk' },
  { value: 'mpb', label: 'MPB' },
  { value: 'eletronica', label: 'Eletrônica' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'gospel', label: 'Gospel' },
];

const sortOptions = [
  { value: 'date',   label: 'Data' },
  { value: 'artist', label: 'Artista' },
  { value: 'title',  label: 'Título' },
  { value: 'status', label: 'Status' },
];

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-foreground)',
  fontFamily: 'var(--font-body)',
};

export default function PitchesFilterBar({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  mobileFiltersOpen: externalMobileOpen,
  onMobileFiltersToggle,
}: PitchesFilterBarProps) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileFiltersOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;

  const toggleMobileFilters = () => {
    if (onMobileFiltersToggle) onMobileFiltersToggle();
    else setInternalMobileOpen((prev) => !prev);
  };

  const update = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onFilterChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      onFilterChange({ ...filters, sortBy: field, sortOrder: 'desc' });
    }
  };

  const clearFilters = () => {
    onFilterChange({ search: '', status: '', category: '', sortBy: 'date', sortOrder: 'desc' });
  };

  const hasActiveFilters = filters.search || filters.status || filters.category;

  return (
    <div className="space-y-3">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
          <input
            type="text"
            placeholder="Buscar por título, artista ou tag..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all"
            style={{ ...inputStyle, '--tw-ring-color': '#486CE3' } as React.CSSProperties}
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-foreground)' }}>
              <Icon name="XMarkIcon" size={14} variant="outline" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
            style={inputStyle}
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
            style={inputStyle}
          >
            {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 rounded-lg px-1 py-1" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          {sortOptions.map(o => (
            <button
              key={o.value}
              onClick={() => toggleSort(o.value)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all"
              style={{
                background: filters.sortBy === o.value ? '#1A1A18' : 'transparent',
                color: filters.sortBy === o.value ? '#F8F5F0' : 'var(--color-muted-foreground)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {o.label}
              {filters.sortBy === o.value && (
                <Icon name={filters.sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={10} variant="outline" />
              )}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg transition-all"
            style={{ color: '#C23B2E', fontFamily: 'var(--font-mono)' }}
          >
            <Icon name="XCircleIcon" size={14} variant="outline" />
            Limpar
          </button>
        )}

        <span className="ml-auto text-xs whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>
          {filteredCount} de {totalCount} pitches
        </span>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
            <input
              type="text"
              placeholder="Buscar pitches..."
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <button
            onClick={toggleMobileFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg transition-all min-h-[44px]"
            style={{
              background: mobileFiltersOpen || hasActiveFilters ? '#1A1A18' : 'var(--color-surface)',
              color: mobileFiltersOpen || hasActiveFilters ? '#F8F5F0' : 'var(--color-foreground)',
              border: `1px solid ${mobileFiltersOpen || hasActiveFilters ? '#1A1A18' : 'var(--color-border)'}`,
              fontFamily: 'var(--font-mono)',
            }}
            aria-label={mobileFiltersOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={mobileFiltersOpen}
          >
            <Icon name="FunnelIcon" size={16} variant="outline" />
            Filtros
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#486CE3' }} />}
          </button>
        </div>

        {mobileFiltersOpen && (
          <div className="p-3 rounded-xl space-y-2 shadow-sm" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div className="relative">
              <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="w-full appearance-none pl-3 pr-8 py-3 text-sm rounded-lg focus:outline-none min-h-[44px]" style={inputStyle}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
            <div className="relative">
              <select value={filters.category} onChange={(e) => update('category', e.target.value)} className="w-full appearance-none pl-3 pr-8 py-3 text-sm rounded-lg focus:outline-none min-h-[44px]" style={inputStyle}>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
            <div className="pt-1">
              <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>Sort by</p>
              <div className="grid grid-cols-2 gap-1.5">
                {sortOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => toggleSort(o.value)}
                    className="flex items-center justify-between gap-1 px-3 py-2.5 text-xs rounded-lg transition-all min-h-[40px]"
                    style={{
                      background: filters.sortBy === o.value ? '#1A1A18' : 'transparent',
                      color: filters.sortBy === o.value ? '#F8F5F0' : 'var(--color-foreground)',
                      border: `1px solid ${filters.sortBy === o.value ? '#1A1A18' : 'var(--color-border)'}`,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {o.label}
                    {filters.sortBy === o.value && (
                      <Icon name={filters.sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={10} variant="outline" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-lg transition-all min-h-[44px]"
                style={{ color: '#C23B2E', fontFamily: 'var(--font-mono)' }}
              >
                <Icon name="XCircleIcon" size={14} variant="outline" />
                Limpar Filtros
              </button>
            )}
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>
          {filteredCount} de {totalCount} pitches
        </p>
      </div>
    </div>
  );
}

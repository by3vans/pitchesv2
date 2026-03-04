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
  { value: 'date', label: 'Data de Envio' },
  { value: 'artist', label: 'Nome do Artista' },
  { value: 'title', label: 'Título' },
  { value: 'status', label: 'Status' },
];

export default function PitchesFilterBar({ filters, onFilterChange, totalCount, filteredCount, mobileFiltersOpen: externalMobileOpen, onMobileFiltersToggle }: PitchesFilterBarProps) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileFiltersOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const toggleMobileFilters = () => {
    if (onMobileFiltersToggle) {
      onMobileFiltersToggle();
    } else {
      setInternalMobileOpen((prev) => !prev);
    }
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
      {/* Desktop Filter Row */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, artista ou tag..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon name="XMarkIcon" size={14} variant="outline" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-white px-1 py-1">
          {sortOptions.map(o => (
            <button
              key={o.value}
              onClick={() => toggleSort(o.value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all ${filters.sortBy === o.value ? 'bg-gray-900 text-white font-medium' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
            >
              {o.label}
              {filters.sortBy === o.value && (
                <Icon name={filters.sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={10} variant="outline" />
              )}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <Icon name="XCircleIcon" size={14} variant="outline" />
            Limpar
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
          {filteredCount} de {totalCount} pitches
        </span>
      </div>

      {/* Mobile Filter Row */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar pitches..."
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={toggleMobileFilters}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-all min-h-[44px] ${mobileFiltersOpen || hasActiveFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
            aria-label={mobileFiltersOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={mobileFiltersOpen}
          >
            <Icon name="FunnelIcon" size={16} variant="outline" />
            Filtros
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </button>
        </div>

        {mobileFiltersOpen && (
          <div className="p-3 border border-gray-200 rounded-xl bg-white space-y-2 shadow-sm">
            <div className="relative">
              <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="w-full appearance-none pl-3 pr-8 py-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none min-h-[44px]">
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={filters.category} onChange={(e) => update('category', e.target.value)} className="w-full appearance-none pl-3 pr-8 py-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none min-h-[44px]">
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="ChevronDownIcon" size={14} variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {/* Sort options on mobile */}
            <div className="pt-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Sort by</p>
              <div className="grid grid-cols-2 gap-1.5">
                {sortOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => toggleSort(o.value)}
                    className={`flex items-center justify-between gap-1 px-3 py-2.5 text-xs rounded-lg border transition-all min-h-[40px] ${
                      filters.sortBy === o.value ? 'bg-gray-900 text-white border-gray-900 font-medium' : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50'
                    }`}
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
              <button onClick={clearFilters} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[44px]">
                <Icon name="XCircleIcon" size={14} variant="outline" />
                Limpar Filtros
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">{filteredCount} de {totalCount} pitches</p>
      </div>
    </div>
  );
}
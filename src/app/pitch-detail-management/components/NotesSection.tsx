'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { pitchNoteStore } from '@/lib/store';
import type { PitchNote } from '@/lib/store';

interface NotesSectionProps {
  pitchId: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${mins}`;
}

function parseTimestamp(iso: string): Date | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export default function NotesSection({ pitchId }: NotesSectionProps) {
  const [notes, setNotes] = useState<PitchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const data = await pitchNoteStore.getByPitch(pitchId);
    setNotes(data);
    setLoading(false);
  }, [pitchId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim() || saving) return;
    setSaving(true);
    const created = await pitchNoteStore.create(pitchId, newNote.trim());
    if (created) {
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
    }
    setSaving(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    const updated = await pitchNoteStore.update(id, editContent.trim());
    if (updated) {
      setNotes((prev) => prev.map((n) => n.id === id ? updated : n));
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await pitchNoteStore.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || startDate !== '' || endDate !== '';

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!note.content.toLowerCase().includes(q)) return false;
      }
      if (startDate || endDate) {
        const noteDate = parseTimestamp(note.createdAt);
        if (!noteDate) return true;
        if (startDate && noteDate < new Date(startDate + 'T00:00:00')) return false;
        if (endDate && noteDate > new Date(endDate + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [notes, searchQuery, startDate, endDate]);

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{ backgroundColor: 'var(--ice)', borderColor: 'var(--cream)' }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-3" style={{ borderColor: 'var(--cream)' }}>
        {(['notes', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              fontFamily: 'Epilogue, sans-serif',
              backgroundColor: activeTab === tab ? 'var(--cream)' : 'transparent',
              color: activeTab === tab ? 'var(--ink)' : 'var(--stone)',
            }}
          >
            {tab === 'notes' ? 'Notas' : 'Histórico'}
          </button>
        ))}
        <span
          className="ml-auto text-xs"
          style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
        >
          {hasActiveFilters ? `${filteredNotes.length} de ${notes.length}` : `${notes.length}`} nota{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search & Date Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={14}
            variant="outline"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--stone)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas notas..."
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border focus:outline-none transition-all min-h-[44px]"
            style={{
              fontFamily: 'Epilogue, sans-serif',
              backgroundColor: 'var(--ice)',
              borderColor: 'var(--cream)',
              color: 'var(--ink)',
              outlineColor: 'var(--blue)',
            }}
            aria-label="Search notes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
              style={{ color: 'var(--stone)' }}
              aria-label="Clear search"
            >
              <Icon name="XMarkIcon" size={13} variant="outline" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[{ label: 'De', value: startDate, onChange: setStartDate }, { label: 'Até', value: endDate, onChange: setEndDate }].map(({ label, value, onChange }) => (
            <div key={label} className="flex items-center gap-1.5">
              <label
                className="text-xs font-medium shrink-0 w-8"
                style={{
                  fontFamily: 'Azeret Mono, monospace',
                  color: 'var(--stone)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              >
                {label}
              </label>
              <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-all min-h-[44px]"
                style={{
                  backgroundColor: 'var(--ice)',
                  borderColor: 'var(--cream)',
                  color: 'var(--ink)',
                }}
              />
            </div>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              Mostrando {filteredNotes.length} de {notes.length}
            </p>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all min-h-[36px]"
              style={{ borderColor: 'var(--cream)', color: 'var(--stone)' }}
            >
              <Icon name="XMarkIcon" size={12} variant="outline" />
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <svg className="animate-spin h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--stone)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : (
        <>
          {activeTab === 'notes' && (
            <>
              {/* Add Note */}
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                  placeholder="Adicionar uma nota sobre este pitch... (⌘+Enter para salvar)"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border resize-none focus:outline-none transition-all"
                  style={{
                    fontFamily: 'Epilogue, sans-serif',
                    backgroundColor: 'var(--cream)',
                    borderColor: 'var(--cream)',
                    color: 'var(--ink)',
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || saving}
                    className="pm-btn-primary text-sm px-4 py-2 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Icon name="PlusIcon" size={14} variant="outline" />
                    {saving ? 'Salvando...' : 'Adicionar Nota'}
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="DocumentTextIcon" size={32} variant="outline" className="mx-auto mb-2 opacity-40" style={{ color: 'var(--stone)' }} />
                    <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                      {hasActiveFilters ? 'Nenhuma nota encontrada.' : 'Nenhuma nota adicionada ainda.'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-xs underline"
                        style={{ color: 'var(--stone)' }}
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border group"
                      style={{ backgroundColor: 'var(--cream)', borderColor: 'var(--cream)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p
                          className="text-xs"
                          style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                        >
                          {formatTimestamp(note.createdAt)}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--stone)' }}
                            aria-label="Editar nota"
                          >
                            <Icon name="PencilIcon" size={13} variant="outline" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--crimson)' }}
                            aria-label="Excluir nota"
                          >
                            <Icon name="TrashIcon" size={13} variant="outline" />
                          </button>
                        </div>
                      </div>
                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm rounded-lg border resize-none focus:outline-none"
                            style={{
                              fontFamily: 'Epilogue, sans-serif',
                              backgroundColor: 'var(--ice)',
                              borderColor: 'var(--cream)',
                              color: 'var(--ink)',
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="pm-btn-ghost text-xs px-3 py-1.5 min-h-[32px]">Cancelar</button>
                            <button onClick={() => handleSaveEdit(note.id)} className="pm-btn-primary text-xs px-3 py-1.5 min-h-[32px]">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
                        >
                          {note.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="ClockIcon" size={32} variant="outline" className="mx-auto mb-2 opacity-40" style={{ color: 'var(--stone)' }} />
                  <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                    {hasActiveFilters ? 'Nenhum resultado.' : 'Sem histórico ainda.'}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ borderColor: 'var(--cream)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        fontFamily: 'Azeret Mono, monospace',
                        backgroundColor: 'var(--cream)',
                        color: 'var(--stone)',
                      }}
                    >
                      {notes.length - idx}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm line-clamp-2"
                        style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
                      >
                        {note.content}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                      >
                        {formatTimestamp(note.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
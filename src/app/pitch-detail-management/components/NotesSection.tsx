'use client';

import { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Note {
  id: number;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  version: number;
}

interface NotesSectionProps {
  initialNotes: Note[];
}

// Parse a timestamp string like "02/03/2026 14:30" into a Date for comparison
function parseTimestamp(ts: string): Date | null {
  // Try pt-BR format: dd/mm/yyyy hh:mm
  const match = ts.match(/(\d{2})\/(\d{2})\/(\d{4})(?:[,\s]+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = '0', min = '0'] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  }
  // Fallback: native parse
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

export default function NotesSection({ initialNotes }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes');

  // Search & date-range filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now(),
      author: 'Você',
      role: 'A&R Manager',
      content: newNote.trim(),
      timestamp: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      version: notes.length + 1,
    };
    setNotes([note, ...notes]);
    setNewNote('');
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content: editContent } : n));
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || startDate !== '' || endDate !== '';

  // Filtered notes (shared between tabs)
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          note.content.toLowerCase().includes(q) ||
          note.author.toLowerCase().includes(q) ||
          note.role.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Date range
      if (startDate || endDate) {
        const noteDate = parseTimestamp(note.timestamp);
        if (!noteDate) return true;
        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (noteDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          if (noteDate > end) return false;
        }
      }
      return true;
    });
  }, [notes, searchQuery, startDate, endDate]);

  return (
    <div className="p-5 rounded-xl border bg-white space-y-4" style={{ borderColor: 'var(--color-border)' }}>
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
        {(['notes', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab === 'notes' ? 'Notas' : 'Histórico'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {hasActiveFilters ? `${filteredNotes.length} of ${notes.length}` : `${notes.length}`} nota{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Search & Date-Range Filters ── */}
      <div className="space-y-2">
        {/* Search bar */}
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={14}
            variant="outline"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by content, author, or role…"
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent transition-all min-h-[44px]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)',
              fontFamily: 'Inter, sans-serif',
            }}
            aria-label="Search notes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:bg-muted min-h-[32px] min-w-[32px] flex items-center justify-center"
              style={{ color: 'var(--color-muted-foreground)' }}
              aria-label="Clear search"
            >
              <Icon name="XMarkIcon" size={13} variant="outline" />
            </button>
          )}
        </div>

        {/* Date range row — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <label
              className="text-xs font-medium shrink-0 w-8"
              style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent transition-all min-h-[44px]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
              aria-label="Filter notes from date"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label
              className="text-xs font-medium shrink-0 w-8"
              style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent transition-all min-h-[44px]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
              aria-label="Filter notes to date"
            />
          </div>
        </div>

        {/* Clear + active filter indicator row */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>
              Showing {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all hover:bg-muted min-h-[36px]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}
              aria-label="Clear all filters"
            >
              <Icon name="XMarkIcon" size={12} variant="outline" />
              Clear
            </button>
          </div>
        )}
      </div>

      {activeTab === 'notes' && (
        <>
          {/* Add Note */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar uma nota sobre este pitch..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="pm-btn-primary text-sm px-4 py-2 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                <Icon name="PlusIcon" size={14} variant="outline" />
                Adicionar Nota
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredNotes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="DocumentTextIcon" size={32} variant="outline" className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {hasActiveFilters ? 'No notes match your search or date range.' : 'Nenhuma nota adicionada ainda.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs underline"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {filteredNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-lg border bg-muted/20 group" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{note.author}</span>
                    <span className="text-xs text-muted-foreground ml-2">{note.role}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      aria-label="Editar nota"
                    >
                      <Icon name="PencilIcon" size={13} variant="outline" className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      aria-label="Excluir nota"
                    >
                      <Icon name="TrashIcon" size={13} variant="outline" className="text-red-500" />
                    </button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border bg-white text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="pm-btn-ghost text-xs px-3 py-1.5 min-h-[32px]">Cancelar</button>
                      <button onClick={() => handleSaveEdit(note.id)} className="pm-btn-primary text-xs px-3 py-1.5 min-h-[32px]">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{note.timestamp}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="ClockIcon" size={32} variant="outline" className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {hasActiveFilters ? 'No history entries match your search or date range.' : 'No history entries yet.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs underline"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {filteredNotes.map((note) => (
            <div key={note.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                v{note.version}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{note.author} · {note.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
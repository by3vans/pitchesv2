'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { artistStore, contactStore, linkStore, initStore } from '@/lib/store';
import type { Artist, Contact, ArtistRecipientLink } from '@/lib/types';
import { RELATIONSHIP_TYPES } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ShortcutsHelpModal from '@/components/ui/ShortcutsHelpModal';
import SpotifyArtistSearch from '@/components/ui/SpotifyArtistSearch';


interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  onSave: () => void;
}

function ArtistModal({ artist, onClose, onSave }: ArtistModalProps) {
  const [name, setName] = useState(artist?.name ?? '');
  const [notes, setNotes] = useState(artist?.notes ?? '');
  const [error, setError] = useState('');
  const [showSpotify, setShowSpotify] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (artist) {
      artistStore.update(artist.id, { name: name.trim(), notes });
    } else {
      artistStore.create({ name: name.trim(), notes });
    }
    onSave();
    onClose();
  };

  const handleSpotifySelect = (data: any) => {
    if (data?.name) {
      setName(data.name);
      setShowSpotify(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="pm-panel w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="pm-h1 text-lg">{artist ? 'Edit Artist' : 'New Artist'}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSpotify(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: '#1DB954',
                color: 'white',
                border: 'none',
              }}
              title="Fetch artist metadata from Spotify"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Fetch from Spotify
            </button>
            <button onClick={onClose} className="pm-btn" aria-label="Close">
              <Icon name="XMarkIcon" size={18} variant="outline" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="pm-label">Name <span className="text-red-500">*</span></label>
            <input
              className="pm-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Artist name"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="pm-label">Notes</label>
            <textarea
              className="pm-input resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="pm-btn">Cancel</button>
            <button type="submit" className="pm-btn-primary">Save</button>
          </div>
        </form>
      </div>
      {showSpotify && (
        <SpotifyArtistSearch
          initialQuery={name}
          onSelect={handleSpotifySelect}
          onClose={() => setShowSpotify(false)}
        />
      )}
    </div>
  );
}

interface LinkModalProps {
  artistId: string;
  existingContactIds: string[];
  onClose: () => void;
  onSave: () => void;
}

function LinkModal({ artistId, existingContactIds, onClose, onSave }: LinkModalProps) {
  const [contacts] = useState<Contact[]>(() => contactStore.getAll());
  const [contactId, setContactId] = useState('');
  const [relType, setRelType] = useState<string>(RELATIONSHIP_TYPES[0]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');

  const available = contacts.filter((c) => !existingContactIds.includes(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) { setError('Select a contact'); return; }
    linkStore.create({ artistId, contactId, relationshipType: relType, isPrimary });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="pm-panel w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="pm-h1 text-lg">Add Recipient</h2>
          <button onClick={onClose} className="pm-btn" aria-label="Close">
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>
        {available.length === 0 ? (
          <p className="pm-muted text-sm">All contacts are already linked. Add more contacts first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pm-label">Contact <span className="text-red-500">*</span></label>
              <select className="pm-input" value={contactId} onChange={(e) => { setContactId(e.target.value); setError(''); }}>
                <option value="">Select contact...</option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} — {c.role} @ {c.company}</option>
                ))}
              </select>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <div>
              <label className="pm-label">Relationship Type</label>
              <select className="pm-input" value={relType} onChange={(e) => setRelType(e.target.value)}>
                {RELATIONSHIP_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" />
              <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>Primary contact</span>
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="pm-btn">Cancel</button>
              <button type="submit" className="pm-btn-primary">Add</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface ArtistDetailProps {
  artist: Artist;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

function ArtistDetail({ artist, onEdit, onDelete, onBack }: ArtistDetailProps) {
  const [links, setLinks] = useState<ArtistRecipientLink[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [confirmRemoveLink, setConfirmRemoveLink] = useState<{ linkId: string; contactName: string } | null>(null);

  const refresh = () => {
    setLinks(linkStore.getByArtist(artist.id));
    setContacts(contactStore.getAll());
  };

  useEffect(() => { refresh(); }, [artist.id]);

  const linkedContactIds = links.map((l) => l.contactId);
  const getContact = (cid: string) => contacts.find((c) => c.id === cid);

  return (
    <div>
      <button onClick={onBack} className="pm-btn mb-4 flex items-center gap-1">
        <Icon name="ArrowLeftIcon" size={15} variant="outline" />
        Back
      </button>

      <div className="pm-panel mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pm-kicker">Artist</p>
            <h2 className="pm-h1">{artist.name}</h2>
            {artist.notes && <p className="pm-muted text-sm mt-1">{artist.notes}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="pm-btn flex items-center gap-1">
              <Icon name="PencilSquareIcon" size={15} variant="outline" />
              Edit
            </button>
            <button onClick={onDelete} className="pm-btn flex items-center gap-1" style={{ color: 'var(--color-destructive)' }}>
              <Icon name="TrashIcon" size={15} variant="outline" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="pm-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="pm-kicker">Linked</p>
            <h3 className="font-semibold text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>Recipients</h3>
          </div>
          <button onClick={() => setShowLinkModal(true)} className="pm-btn-primary flex items-center gap-1 text-sm px-3 py-2">
            <Icon name="PlusIcon" size={15} variant="outline" />
            Add
          </button>
        </div>

        {links.length === 0 ? (
          <p className="pm-muted text-sm">No recipients linked yet.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => {
              const contact = getContact(link.contactId);
              if (!contact) return null;
              return (
                <div key={link.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{contact.fullName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>{link.relationshipType}</span>
                      {link.isPrimary && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}>Primary</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{contact.role} @ {contact.company}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { linkStore.update(link.id, { isPrimary: !link.isPrimary }); refresh(); }}
                      className="pm-btn p-1.5"
                      title={link.isPrimary ? 'Remove primary' : 'Set primary'}
                    >
                      <Icon name="StarIcon" size={14} variant={link.isPrimary ? 'solid' : 'outline'} />
                    </button>
                    <button
                      onClick={() => {
                        const contact = getContact(link.contactId);
                        setConfirmRemoveLink({ linkId: link.id, contactName: contact?.fullName ?? 'this recipient' });
                      }}
                      className="pm-btn p-1.5"
                      style={{ color: 'var(--color-destructive)' }}
                      aria-label="Remove link"
                    >
                      <Icon name="XMarkIcon" size={14} variant="outline" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLinkModal && (
        <LinkModal
          artistId={artist.id}
          existingContactIds={linkedContactIds}
          onClose={() => setShowLinkModal(false)}
          onSave={refresh}
        />
      )}

      {confirmRemoveLink && (
        <ConfirmModal
          title="Remove Recipient"
          message={`Remove <strong>${confirmRemoveLink.contactName}</strong> from this artist's recipients? This won't delete the contact.`}
          confirmLabel="Remove"
          onConfirm={() => { linkStore.delete(confirmRemoveLink.linkId); refresh(); setConfirmRemoveLink(null); }}
          onCancel={() => setConfirmRemoveLink(null)}
        />
      )}
    </div>
  );
}

function ArtistRowSkeleton() {
  return (
    <div className="pm-panel flex items-center justify-between gap-4 animate-pulse">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-2/5" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 bg-gray-200 rounded-lg" />
        <div className="h-7 w-7 bg-gray-200 rounded-lg" />
        <div className="h-4 w-4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

const ARTIST_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface ArtistPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

function ArtistPagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, isLoading }: ArtistPaginationProps) {
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      {/* Items info + per-page selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          {isLoading ? (
            <span className="inline-block h-3 w-28 bg-gray-200 rounded animate-pulse" />
          ) : (
            totalItems === 0 ? 'No results' : `${startItem}–${endItem} of ${totalItems}`
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            aria-label="Items per page"
            className="pm-input text-xs py-1 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {ARTIST_PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            aria-label="Previous page"
            className="pm-btn flex items-center gap-1 text-xs px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronLeftIcon" size={13} variant="outline" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs border transition-all disabled:cursor-not-allowed ${
                  currentPage === page
                    ? 'font-semibold text-white' :'pm-btn'
                }`}
                style={currentPage === page ? { background: 'var(--color-foreground)', borderColor: 'var(--color-foreground)', color: 'white' } : {}}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            aria-label="Next page"
            className="pm-btn flex items-center gap-1 text-xs px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="ChevronRightIcon" size={13} variant="outline" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selected, setSelected] = useState<Artist | null>(null);
  const [editTarget, setEditTarget] = useState<Artist | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const { showToast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Keyboard shortcuts state
  const [showHelpModal, setShowHelpModal] = useState(false);

  const prevSearchRef = useRef(search);

  const refresh = () => setArtists(artistStore.getAll());

  useEffect(() => {
    initStore();
    refresh();
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Trigger skeleton on search change
  useEffect(() => {
    if (prevSearchRef.current !== search && !isLoading) {
      setIsSearchLoading(true);
      setCurrentPage(1);
      const timer = setTimeout(() => setIsSearchLoading(false), 350);
      prevSearchRef.current = search;
      return () => clearTimeout(timer);
    }
    prevSearchRef.current = search;
  }, [search, isLoading]);

  const filtered = artists.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArtists = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleEdit = (artist: Artist) => { setEditTarget(artist); setShowModal(true); };
  const handleNew = () => { setEditTarget(null); setShowModal(true); };
  const handleDelete = (a: Artist) => {
    setDeleteTarget(a);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    artistStore.delete(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    refresh();
    showToast(`Artist "${deleteTarget.name}" deleted`, 'info');
    setDeleteTarget(null);
  };

  // Multi-select handlers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedArtists.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedArtists.map((a) => a.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    selectedIds.forEach((id) => {
      artistStore.delete(id);
      if (selected?.id === id) setSelected(null);
    });
    refresh();
    showToast(`${selectedIds.size} artist${selectedIds.size !== 1 ? 's' : ''} deleted`, 'info');
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    setIsBulkDeleting(false);
    setCurrentPage(1);
  };

  const handleBulkExport = () => {
    const selectedArtists = artists.filter((a) => selectedIds.has(a.id));
    const header = 'ID,Name,Genre,Location,Notes,Created';
    const rows = selectedArtists.map((a) =>
      `${a.id},"${a.name}","${a.genre ?? ''}","${a.location ?? ''}","${(a.notes ?? '').replace(/"/g, "''")}",${new Date(a.createdAt).toLocaleDateString()}`
    ).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artists_export_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const showSkeleton = isLoading || isSearchLoading;
  const selectionMode = selectedIds.size > 0;
  const allPageSelected = paginatedArtists.length > 0 && paginatedArtists.every((a) => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0 && !allPageSelected;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewPitch: () => { setEditTarget(null); setShowModal(true); },
    onSearch: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search artists"]');
      if (searchInput) { searchInput.focus(); searchInput.select(); }
    },
    onHelp: () => setShowHelpModal(true),
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selected ? (
            <ArtistDetail
              artist={selected}
              onEdit={() => handleEdit(selected)}
              onDelete={() => handleDelete(selected)}
              onBack={() => setSelected(null)}
            />
          ) : (
            <>
              <div className="pm-panel mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="pm-kicker">Roster</p>
                    <h1 className="pm-h1">Artists</h1>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-foreground)' }} />
                      <input className="pm-input pl-9 w-full sm:w-56 min-h-[40px]" placeholder="Search artists..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search artists" />
                    </div>
                    {/* Shortcuts help button */}
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="pm-btn p-2.5 min-h-[40px]"
                      aria-label="Show keyboard shortcuts (⌘+?)"
                      title="Keyboard shortcuts (⌘+?)"
                    >
                      <Icon name="QuestionMarkCircleIcon" size={16} variant="outline" />
                    </button>
                    <button onClick={handleNew} className="pm-btn-primary flex items-center gap-1 min-h-[40px]">
                      <Icon name="PlusIcon" size={16} variant="outline" />
                      New Artist
                    </button>
                  </div>
                </div>
              </div>

              {showSkeleton ? (
                <div className="space-y-2" aria-busy="true" aria-label="Loading artists">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <ArtistRowSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="pm-panel flex flex-col items-center justify-center py-20 text-center"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                  >
                    <Icon name="UserGroupIcon" size={36} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
                  </div>
                  {search ? (
                    <>
                      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No artists found</h3>
                      <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>No artists match your search. Try a different name.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No artists yet</h3>
                      <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Build your roster by adding your first artist and linking them to contacts and pitches.</p>
                      <button onClick={handleNew} className="pm-btn-primary flex items-center gap-2">
                        <Icon name="PlusIcon" size={16} variant="outline" />
                        Add Your First Artist
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="pm-panel">
                  {/* Select-all row */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        role="checkbox"
                        aria-checked={allPageSelected ? true : someSelected ? 'mixed' : false}
                        aria-label={allPageSelected ? 'Deselect all artists on this page' : 'Select all artists on this page'}
                        tabIndex={0}
                        onClick={toggleSelectAll}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSelectAll(); } }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
                          allPageSelected
                            ? 'bg-gray-900 border-gray-900'
                            : someSelected
                            ? 'bg-gray-400 border-gray-400' : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ borderColor: allPageSelected || someSelected ? undefined : 'var(--color-border)' }}
                      >
                        {(allPageSelected || someSelected) && (
                          <Icon name={allPageSelected ? 'CheckIcon' : 'MinusIcon'} size={10} variant="solid" className="text-white" aria-hidden="true" />
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                      </span>
                    </label>
                  </div>

                  {/* Bulk Action Toolbar — touch-friendly on mobile */}
                  {selectionMode && (
                    <div
                      className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 px-3 py-3 rounded-xl"
                      style={{ background: 'var(--color-foreground)', border: '1px solid var(--color-foreground)' }}
                      role="toolbar"
                      aria-label={`Bulk actions for ${selectedIds.size} selected artist${selectedIds.size !== 1 ? 's' : ''}`}
                    >
                      {/* Row 1: count + clear (mobile) */}
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-xs font-semibold text-white" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          {selectedIds.size} artist{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={clearSelection}
                          disabled={isBulkDeleting}
                          aria-label="Clear selection"
                          className="sm:hidden flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon name="XMarkIcon" size={13} variant="outline" aria-hidden="true" />
                          Clear
                        </button>
                      </div>
                      {/* Row 2: actions */}
                      <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                        {/* Export */}
                        <button
                          onClick={handleBulkExport}
                          disabled={isBulkDeleting}
                          aria-label={`Export ${selectedIds.size} selected artist${selectedIds.size !== 1 ? 's' : ''} as CSV`}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                        >
                          <Icon name="ArrowDownTrayIcon" size={13} variant="outline" aria-hidden="true" />
                          <span>Export</span>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setShowBulkDeleteConfirm(true)}
                          disabled={isBulkDeleting}
                          aria-label={isBulkDeleting ? 'Deleting selected artists…' : `Delete ${selectedIds.size} selected artist${selectedIds.size !== 1 ? 's' : ''}`}
                          aria-busy={isBulkDeleting}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                        >
                          {isBulkDeleting ? (
                            <svg className="animate-spin" style={{ width: 13, height: 13 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <Icon name="TrashIcon" size={13} variant="outline" aria-hidden="true" />
                          )}
                          <span>{isBulkDeleting ? 'Deleting…' : 'Delete'}</span>
                        </button>
                        {/* Clear — desktop only */}
                        <button
                          onClick={clearSelection}
                          disabled={isBulkDeleting}
                          aria-label="Clear selection"
                          className="hidden sm:flex items-center gap-1 text-xs px-2 py-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                        >
                          <Icon name="XMarkIcon" size={13} variant="outline" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Artist list */}
                  <div className="space-y-2" aria-live="polite" aria-label="Artists list">
                    {paginatedArtists.map((artist) => (
                      <div
                        key={artist.id}
                        className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-all hover:border-gray-400 ${
                          selectedIds.has(artist.id) ? 'border-gray-900' : ''
                        }`}
                        style={{ borderColor: selectedIds.has(artist.id) ? undefined : 'var(--color-border)', background: 'var(--color-card)' }}
                        onClick={() => setSelected(artist)}
                      >
                        {/* Checkbox */}
                        <div
                          className={`shrink-0 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => toggleSelect(artist.id, e)}
                        >
                          <div
                            role="checkbox"
                            aria-checked={selectedIds.has(artist.id)}
                            aria-label={selectedIds.has(artist.id) ? `Deselect artist: ${artist.name}` : `Select artist: ${artist.name}`}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); toggleSelect(artist.id, e as unknown as React.MouseEvent); } }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
                              selectedIds.has(artist.id)
                                ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                            }`}
                            style={{ borderColor: selectedIds.has(artist.id) ? undefined : 'var(--color-border)' }}
                          >
                            {selectedIds.has(artist.id) && (
                              <Icon name="CheckIcon" size={10} variant="solid" className="text-white" aria-hidden="true" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{artist.name}</p>
                          {artist.notes && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)' }}>{artist.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(artist); }} className="pm-btn p-2 min-h-[36px] min-w-[36px]" aria-label={`Edit artist: ${artist.name}`}>
                            <Icon name="PencilSquareIcon" size={14} variant="outline" aria-hidden="true" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(artist); }} className="pm-btn p-2 min-h-[36px] min-w-[36px]" style={{ color: 'var(--color-destructive)' }} aria-label={`Delete artist: ${artist.name}`}>
                            <Icon name="TrashIcon" size={14} variant="outline" aria-hidden="true" />
                          </button>
                          <Icon name="ChevronRightIcon" size={16} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {filtered.length > 0 && (
                    <ArtistPagination
                      currentPage={safePage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={filtered.length}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      isLoading={showSkeleton}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showModal && (
        <ArtistModal
          artist={editTarget}
          onClose={() => setShowModal(false)}
          onSave={() => {
            refresh();
            showToast(editTarget ? `Artist "${editTarget.name}" updated` : 'Artist added successfully', 'success');
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Artist"
          message={`Permanently delete <strong>${deleteTarget.name}</strong>? This will remove all their linked recipients and cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmModal
          title="Delete Selected Artists"
          message={`Permanently delete <strong>${selectedIds.size} artist${selectedIds.size !== 1 ? 's' : ''}</strong>? This will remove all their linked recipients and cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelpModal && (
        <ShortcutsHelpModal
          onClose={() => setShowHelpModal(false)}
          shortcuts={[
            { keys: ['⌘', 'N'], description: 'New artist' },
            { keys: ['⌘', '/'], description: 'Focus search' },
            { keys: ['⌘', '?'], description: 'Show this help' },
            { keys: ['Esc'], description: 'Close modal / clear focus' },
          ]}
        />
      )}
    </div>
  );
}

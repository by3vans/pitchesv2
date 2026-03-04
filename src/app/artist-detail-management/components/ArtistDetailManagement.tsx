'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { artistStore, contactStore, linkStore, initStore } from '@/lib/store';
import type { Artist, Contact, ArtistRecipientLink } from '@/lib/types';
import { RELATIONSHIP_TYPES } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { enqueueAction, useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useSubmissionProgress } from '@/hooks/useSubmissionProgress';
import SubmissionProgressOverlay from '@/components/ui/SubmissionProgressOverlay';
import SpotifyArtistSearch from '@/components/ui/SpotifyArtistSearch';



// ─── Add Recipient Modal ──────────────────────────────────────────────────────

interface AddRecipientModalProps {
  artistId: string;
  existingContactIds: string[];
  onClose: () => void;
  onSave: () => void;
}

function AddRecipientModal({ artistId, existingContactIds, onClose, onSave }: AddRecipientModalProps) {
  const [allContacts] = useState<Contact[]>(() => contactStore.getAll());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [contactId, setContactId] = useState('');
  const [relType, setRelType] = useState<string>(RELATIONSHIP_TYPES[0]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');

  const available = allContacts.filter((c) => {
    if (existingContactIds.includes(c.id)) return false;
    if (filterRole && c.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) { setError('Please select a contact'); return; }
    linkStore.create({ artistId, contactId, relationshipType: relType, isPrimary });
    onSave();
    onClose();
  };

  const uniqueRoles = Array.from(new Set(allContacts.map((c) => c.role))).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="pm-panel w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <p className="pm-kicker">Link Contact</p>
            <h2 className="pm-h1 text-lg">Add Recipient</h2>
          </div>
          <button onClick={onClose} className="pm-btn p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" aria-label="Close modal">
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Icon
              name="MagnifyingGlassIcon"
              size={14}
              variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <input
              className="pm-input pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <select
            className="pm-input w-36 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All roles</option>
            {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4 space-y-1.5 pr-1">
          {available.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="UsersIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="pm-muted text-sm">
                {existingContactIds.length > 0 && allContacts.length === existingContactIds.length
                  ? 'All contacts are already linked.' :'No contacts match your search.'}
              </p>
            </div>
          ) : (
            available.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setContactId(c.id); setError(''); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: contactId === c.id ? 'var(--color-primary)' : 'var(--color-muted)',
                  border: `1px solid ${contactId === c.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color: contactId === c.id ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: contactId === c.id ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
                      color: contactId === c.id ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                    }}
                  >
                    {c.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.fullName}</p>
                    <p
                      className="text-xs truncate"
                      style={{ color: contactId === c.id ? 'rgba(255,255,255,0.7)' : 'var(--color-muted-foreground)' }}
                    >
                      {c.role} · {c.company} · {c.email}
                    </p>
                  </div>
                  {contactId === c.id && (
                    <Icon name="CheckIcon" size={16} variant="solid" style={{ color: 'var(--color-primary-foreground)' }} />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Config for selected contact */}
        {contactId && (
          <div className="shrink-0 space-y-3 mb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="pm-label">Relationship Type</label>
                <select className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={relType} onChange={(e) => setRelType(e.target.value)}>
                  {RELATIONSHIP_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded w-4 h-4 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Set as primary</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3 shrink-0">{error}</p>}

        <div className="flex gap-2 justify-end shrink-0">
          <button type="button" onClick={onClose} className="pm-btn focus:ring-2 focus:ring-blue-500 focus:outline-none">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit as any}
            className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            disabled={!contactId}
            style={{ opacity: contactId ? 1 : 0.5 }}
          >
            <Icon name="PlusIcon" size={15} variant="outline" />
            Add Recipient
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LinkedRecipient {
  link: ArtistRecipientLink;
  contact: Contact;
}

interface EditForm {
  name: string;
  genre: string;
  location: string;
  notes: string;
}

export default function ArtistDetailManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [artist, setArtist] = useState<Artist | null>(null);
  const [recipients, setRecipients] = useState<LinkedRecipient[]>([]);
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'profile' | 'notes' | 'recipients'>('profile');

  // Create mode
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', genre: '', location: '', notes: '' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createSaving, setCreateSaving] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', genre: '', location: '', notes: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const { progress: submissionProgress, runSteps } = useSubmissionProgress('artist');

  // Notes editing (legacy inline notes — kept for non-edit-mode quick edit)
  const [notesValue, setNotesValue] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ linkId: string; contactName: string } | null>(null);
  const [showSpotify, setShowSpotify] = useState(false);

  // Search / filter for recipients table
  const [tableSearch, setTableSearch] = useState('');
  const [tableRoleFilter, setTableRoleFilter] = useState('');

  const loadArtist = useCallback((id: string) => {
    const a = artistStore.getById(id);
    if (!a) return;
    setArtist(a);
    setNotesValue(a.notes ?? '');
    const links = linkStore.getByArtist(id);
    const contacts = contactStore.getAll();
    const linked: LinkedRecipient[] = links
      .map((l) => {
        const c = contacts.find((x) => x.id === l.contactId);
        return c ? { link: l, contact: c } : null;
      })
      .filter(Boolean) as LinkedRecipient[];
    setRecipients(linked);
  }, []);

  useEffect(() => {
    initStore();
    const all = artistStore.getAll();
    setArtists(all);
    const paramId = searchParams?.get('artistId');
    const mode = searchParams?.get('mode');
    if (mode === 'new') {
      setIsCreateMode(true);
      setSelectedArtistId('');
      return;
    }
    const initial = paramId ?? all[0]?.id ?? '';
    setSelectedArtistId(initial);
    if (initial) loadArtist(initial);
  }, []);

  const handleArtistChange = (id: string) => {
    setSelectedArtistId(id);
    setTableSearch('');
    setTableRoleFilter('');
    setNotesEditing(false);
    setIsEditing(false);
    setIsCreateMode(false);
    loadArtist(id);
  };

  // Create mode handlers
  const handleCreateSave = () => {
    const newErrors: Record<string, string> = {};
    if (!createForm.name.trim()) newErrors.name = 'Artist name is required';
    if (!createForm.genre.trim()) newErrors.genre = 'Genre is required';
    if (Object.keys(newErrors).length > 0) { setCreateErrors(newErrors); return; }

    setCreateSaving(true);
    const newArtist = artistStore.create({
      name: createForm.name.trim(),
      genre: createForm.genre.trim(),
      location: createForm.location.trim(),
      notes: createForm.notes,
    });
    const all = artistStore.getAll();
    setArtists(all);
    setCreateSaving(false);
    setIsCreateMode(false);
    setCreateForm({ name: '', genre: '', location: '', notes: '' });
    setCreateErrors({});
    setSelectedArtistId(newArtist.id);
    loadArtist(newArtist.id);
    showToast(`Artist "${newArtist.name}" created successfully`, 'success');
    router.replace(`/artist-detail-management?artistId=${newArtist.id}`);
  };

  const handleCreateCancel = () => {
    setIsCreateMode(false);
    setCreateForm({ name: '', genre: '', location: '', notes: '' });
    setCreateErrors({});
    router.replace('/artist-detail-management');
  };

  // Edit mode handlers
  const handleStartEdit = () => {
    if (!artist) return;
    setEditForm({
      name: artist.name,
      genre: artist.genre ?? '',
      location: artist.location ?? '',
      notes: artist.notes ?? '',
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ name: '', genre: '', location: '', notes: '' });
    setEditErrors({});
  };

  const validateEditField = (field: string, value: string) => {
    const newErrors = { ...editErrors };
    if (field === 'name') {
      if (!value.trim()) newErrors.name = 'Artist name is required';
      else delete newErrors.name;
    }
    if (field === 'genre') {
      if (!value.trim()) newErrors.genre = 'Genre is required';
      else delete newErrors.genre;
    }
    setEditErrors(newErrors);
  };

  const handleSaveEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editForm.name.trim()) newErrors.name = 'Artist name is required';
    if (!editForm.genre.trim()) newErrors.genre = 'Genre is required';
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }
    if (!artist) return;

    if (!navigator.onLine) {
      enqueueAction({ type: 'artist_save', label: `Save artist "${editForm.name.trim()}"`, payload: { artistId: artist.id, ...editForm } });
      showToast('Offline — artist save queued for retry when connection restores', 'info');
      setIsEditing(false);
      return;
    }

    setEditSaving(true);
    const artistId = artist.id;
    const artistName = editForm.name.trim();
    runSteps(() => {
      artistStore.update(artistId, {
        name: artistName,
        genre: editForm.genre.trim(),
        location: editForm.location.trim(),
        notes: editForm.notes,
      });
      setArtists(artistStore.getAll());
      setEditSaving(false);
      setIsEditing(false);
      setEditErrors({});
      loadArtist(artistId);
      showToast(`Artist "${artistName}" saved successfully`, 'success');
    });
  };

  // Notes auto-save
  const handleNotesChange = (val: string) => {
    setNotesValue(val);
    setNotesSaved(false);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!artist) return;
      setNotesSaving(true);
      artistStore.update(artist.id, { notes: val });
      setTimeout(() => {
        setNotesSaving(false);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }, 400);
    }, 800);
  };

  const handleNotesSave = () => {
    if (!artist) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setNotesSaving(true);
    artistStore.update(artist.id, { notes: notesValue });
    setTimeout(() => {
      setNotesSaving(false);
      setNotesSaved(true);
      setNotesEditing(false);
      setTimeout(() => setNotesSaved(false), 2000);
      showToast('Notes saved', 'success');
    }, 300);
  };

  const handleTogglePrimary = (link: ArtistRecipientLink) => {
    linkStore.update(link.id, { isPrimary: !link.isPrimary });
    if (artist) loadArtist(artist.id);
  };

  const handleRemoveLink = (linkId: string) => {
    const removed = confirmRemove?.contactName;
    linkStore.delete(linkId);
    setConfirmRemove(null);
    if (artist) loadArtist(artist.id);
    if (removed) showToast(`Removed "${removed}" from recipients`, 'info');
  };

  // Filtered recipients
  const filteredRecipients = recipients.filter((r) => {
    if (tableRoleFilter && r.link.relationshipType !== tableRoleFilter) return false;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      return (
        r.contact.fullName.toLowerCase().includes(q) ||
        r.contact.company.toLowerCase().includes(q) ||
        r.contact.email.toLowerCase().includes(q) ||
        r.contact.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueRelTypes = Array.from(new Set(recipients.map((r) => r.link.relationshipType))).filter(Boolean);
  const existingContactIds = recipients.map((r) => r.contact.id);
  const primaryCount = recipients.filter((r) => r.link.isPrimary).length;

  // Offline queue: auto-retry artist saves when connection restores
  useOfflineQueue({
    onConnectionRestored: (count) => {
      if (count > 0) showToast(`Connection restored — retrying ${count} queued action${count !== 1 ? 's' : ''}…`, 'info');
    },
    onRetry: async (action) => {
      if (action.type === 'artist_save') {
        showToast(`Retried: ${action.label}`, 'success');
        return true;
      }
      return false;
    },
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Topbar ── */}
          <div className="pm-panel mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="pm-kicker">Artist Profile</p>
                {isCreateMode ? (
                  <h1 className="pm-h1">New Artist</h1>
                ) : artist ? (
                  <>
                    <h1 className="pm-h1">{artist.name}</h1>
                    <p className="pm-muted text-sm mt-0.5">
                      {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                      {primaryCount > 0 && ` · ${primaryCount} primary`}
                    </p>
                  </>
                ) : (
                  <h1 className="pm-h1">Artist Detail</h1>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Artist selector */}
                {!isCreateMode && (
                <select
                  className="pm-input text-sm w-48"
                  value={selectedArtistId}
                  onChange={(e) => handleArtistChange(e.target.value)}
                  aria-label="Select artist"
                >
                  <option value="">Select artist...</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                )}
                {isCreateMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowSpotify(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
                      style={{ background: '#1DB954', color: 'white', border: 'none' }}
                      title="Fetch artist metadata from Spotify"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.56-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Fetch from Spotify
                    </button>
                    <button
                      onClick={handleCreateCancel}
                      className="pm-btn flex items-center gap-1.5"
                      type="button"
                    >
                      <Icon name="XMarkIcon" size={15} variant="outline" />
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSave}
                      className="pm-btn-primary flex items-center gap-1.5"
                      disabled={createSaving}
                      style={{ opacity: createSaving ? 0.6 : 1 }}
                      type="button"
                    >
                      <Icon name="CheckIcon" size={15} variant="solid" />
                      Create Artist
                    </button>
                  </>
                ) : !isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="pm-btn flex items-center gap-1.5"
                    disabled={!artist}
                    style={{ opacity: !artist ? 0.4 : 1 }}
                  >
                    <Icon name="PencilSquareIcon" size={15} variant="outline" />
                    Edit Artist
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="pm-btn flex items-center gap-1.5"
                    >
                      <Icon name="XMarkIcon" size={15} variant="outline" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="pm-btn-primary flex items-center gap-1.5"
                      disabled={editSaving}
                      style={{ opacity: editSaving ? 0.6 : 1 }}
                    >
                      {editSaving ? (
                        <>
                          <Icon name="ArrowPathIcon" size={15} variant="outline" className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Icon name="CheckIcon" size={15} variant="solid" />
                          Save
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (!artist) return;
                    const rows = recipients.map((r) =>
                      `${r.contact.fullName},${r.contact.role},${r.contact.company},${r.contact.email},${r.link.relationshipType},${r.link.isPrimary ? 'Primary' : ''}`
                    ).join('\n');
                    const csv = `Name,Role,Company,Email,Relationship,Primary\n${rows}`;
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${artist.name.replace(/\s+/g, '_')}_contacts.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="pm-btn flex items-center gap-1.5"
                  disabled={!artist || recipients.length === 0}
                  style={{ opacity: !artist || recipients.length === 0 ? 0.4 : 1 }}
                >
                  <Icon name="ArrowDownTrayIcon" size={15} variant="outline" />
                  Export
                </button>
                {artist && isEditing && (
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  >
                    {(editForm.name || artist.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="pm-kicker mb-0">Editing</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Artist Profile</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSpotify(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
                    style={{ background: '#1DB954', color: 'white', border: 'none' }}
                    title="Fetch artist metadata from Spotify"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Spotify
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>

          {isCreateMode ? (
            /* ── Create Mode Panel ── */
            <div className="pm-panel max-w-lg">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  {createForm.name ? createForm.name.charAt(0).toUpperCase() : '+'}
                </div>
                <div>
                  <p className="pm-kicker mb-0">New Artist</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Fill in the details below to create a new artist profile</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="pm-label">Name <span style={{ color: 'var(--color-destructive)' }}>*</span></label>
                  <input
                    className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${createErrors.name ? ' border-red-400 bg-red-50' : ''}`}
                    value={createForm.name}
                    onChange={(e) => { setCreateForm((f) => ({ ...f, name: e.target.value })); if (createErrors.name && e.target.value.trim()) setCreateErrors((p) => { const x = { ...p }; delete x.name; return x; }); }}
                    placeholder="Artist name"
                    autoFocus
                  />
                  {createErrors.name && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                      {createErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="pm-label">Genre <span style={{ color: 'var(--color-destructive)' }}>*</span></label>
                  <input
                    className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${createErrors.genre ? ' border-red-400 bg-red-50' : ''}`}
                    value={createForm.genre}
                    onChange={(e) => { setCreateForm((f) => ({ ...f, genre: e.target.value })); if (createErrors.genre && e.target.value.trim()) setCreateErrors((p) => { const x = { ...p }; delete x.genre; return x; }); }}
                    placeholder="e.g. Pop, Hip-Hop, R&B"
                  />
                  {createErrors.genre && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                      {createErrors.genre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="pm-label">Location</label>
                  <input
                    className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={createForm.location}
                    onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. São Paulo, SP"
                  />
                </div>

                <div>
                  <label className="pm-label">Notes</label>
                  <textarea
                    className="pm-input resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={4}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Add notes about this artist..."
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCreateCancel}
                    className="pm-btn flex-1 flex items-center justify-center gap-1.5 text-sm"
                    type="button"
                  >
                    <Icon name="XMarkIcon" size={14} variant="outline" />
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSave}
                    className="pm-btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
                    disabled={createSaving}
                    style={{ opacity: createSaving ? 0.6 : 1 }}
                    type="button"
                  >
                    {createSaving ? (
                      <>
                        <Icon name="ArrowPathIcon" size={14} variant="outline" className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Icon name="CheckIcon" size={14} variant="solid" />
                        Create Artist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : !artist ? (
            <div className="pm-panel text-center py-16">
              <Icon name="MusicalNoteIcon" size={40} variant="outline" className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="pm-muted">Select an artist above to view their profile and recipients.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Edit saving overlay */}
              {editSaving && (
                <div
                  className="fixed inset-0 z-[300] flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                  aria-busy="true"
                  aria-label="Saving artist, please wait"
                >
                  <div
                    className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-2xl"
                    style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                  >
                    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Saving artist…</p>
                  </div>
                </div>
              )}

              {/* Mobile Tab Bar */}
              <div className="lg:hidden col-span-1">
                <div
                  className="flex rounded-xl overflow-hidden border mb-4"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-muted)' }}
                  role="tablist"
                  aria-label="Artist detail sections"
                >
                  {([
                    { key: 'profile', label: 'Profile', icon: 'UserCircleIcon' },
                    { key: 'notes', label: 'Notes', icon: 'DocumentTextIcon' },
                    { key: 'recipients', label: 'Recipients', icon: 'UsersIcon' },
                  ] as const).map((tab) => (
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
                        borderBottom: mobileTab === tab.key ? '2px solid var(--color-foreground)' : '2px solid transparent',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Left Column: Artist Profile ── */}
              <div className={`lg:col-span-1 space-y-4 ${mobileTab !== 'profile' && mobileTab !== 'notes' ? 'hidden lg:block' : ''}`}>
                {/* Avatar + Info / Edit Form */}
                <div className={`pm-panel ${mobileTab === 'profile' ? 'hidden lg:block' : ''}`}>
                  {isEditing ? (
                    /* ── Edit Mode ── */
                    <div
                      className="space-y-4"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') handleCancelEdit();
                        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                        >
                          {(editForm.name || artist.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="pm-kicker mb-0">Editing</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Artist Profile</p>
                        </div>
                      </div>

                      <div>
                        <label className="pm-label">Name <span style={{ color: 'var(--color-destructive)' }}>*</span></label>
                        <input
                          className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${editErrors.name ? ' border-red-400 bg-red-50' : ''}`}
                          value={editForm.name}
                          onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); if (editErrors.name && e.target.value.trim()) setEditErrors((p) => { const x = { ...p }; delete x.name; return x; }); }}
                          onBlur={(e) => validateEditField('name', e.target.value)}
                          placeholder="Artist name"
                          autoFocus
                          tabIndex={1}
                          aria-required="true"
                          aria-describedby={editErrors.name ? 'edit-name-error' : undefined}
                        />
                        {editErrors.name && (
                          <p id="edit-name-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                            {editErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="pm-label">Genre <span style={{ color: 'var(--color-destructive)' }}>*</span></label>
                        <input
                          className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${editErrors.genre ? ' border-red-400 bg-red-50' : ''}`}
                          value={editForm.genre}
                          onChange={(e) => { setEditForm((f) => ({ ...f, genre: e.target.value })); if (editErrors.genre && e.target.value.trim()) setEditErrors((p) => { const x = { ...p }; delete x.genre; return x; }); }}
                          onBlur={(e) => validateEditField('genre', e.target.value)}
                          placeholder="e.g. Pop, Hip-Hop, R&B"
                          tabIndex={2}
                          aria-required="true"
                          aria-describedby={editErrors.genre ? 'edit-genre-error' : undefined}
                        />
                        {editErrors.genre && (
                          <p id="edit-genre-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                            {editErrors.genre}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="pm-label">Location</label>
                        <input
                          className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={editForm.location}
                          onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. New York, NY"
                          tabIndex={3}
                        />
                      </div>

                      <div>
                        <label className="pm-label">Notes</label>
                        <textarea
                          className="pm-input resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          rows={4}
                          value={editForm.notes}
                          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Add notes about this artist..."
                          tabIndex={4}
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleCancelEdit}
                          className="pm-btn flex-1 flex items-center justify-center gap-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          tabIndex={5}
                          type="button"
                        >
                          <Icon name="XMarkIcon" size={14} variant="outline" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="pm-btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                          disabled={editSaving}
                          style={{ opacity: editSaving ? 0.6 : 1 }}
                          tabIndex={6}
                          type="button"
                        >
                          {editSaving ? (
                            <>
                              <Icon name="ArrowPathIcon" size={14} variant="outline" className="animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Icon name="CheckIcon" size={14} variant="solid" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View Mode ── */
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                        >
                          {artist.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>
                            {artist.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            {recipients.length} linked recipient{recipients.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {artist.genre && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                            <Icon name="MusicalNoteIcon" size={14} variant="outline" />
                            <span style={{ color: 'var(--color-foreground)' }}>{artist.genre}</span>
                          </div>
                        )}
                        {artist.location && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                            <Icon name="MapPinIcon" size={14} variant="outline" />
                            <span style={{ color: 'var(--color-foreground)' }}>{artist.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          <Icon name="UsersIcon" size={14} variant="outline" />
                          <span>{primaryCount} primary contact{primaryCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          <Icon name="CalendarIcon" size={14} variant="outline" />
                          <span>Added {new Date(artist.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleStartEdit}
                        className="pm-btn w-full flex items-center justify-center gap-1.5 text-sm mt-4"
                      >
                        <Icon name="PencilSquareIcon" size={14} variant="outline" />
                        Edit Artist
                      </button>
                    </>
                  )}
                </div>

                {/* Notes — only shown in view mode (edit mode has notes inline) */}
                {!isEditing && (
                  <div className={`pm-panel ${mobileTab === 'profile' ? 'hidden lg:block' : mobileTab === 'recipients' ? 'hidden' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="pm-label mb-0">Artist Notes</label>
                      <div className="flex items-center gap-1.5">
                        {notesSaving && (
                          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Saving…</span>
                        )}
                        {notesSaved && !notesSaving && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                            <Icon name="CheckIcon" size={12} variant="solid" />
                            Saved
                          </span>
                        )}
                        {!notesEditing ? (
                          <button
                            onClick={() => { setNotesEditing(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                            className="pm-btn p-1.5 text-xs"
                            aria-label="Edit notes"
                          >
                            <Icon name="PencilSquareIcon" size={13} variant="outline" />
                          </button>
                        ) : (
                          <button
                            onClick={handleNotesSave}
                            className="pm-btn p-1.5 text-xs"
                            style={{ color: 'var(--color-accent)' }}
                            aria-label="Save notes"
                          >
                            <Icon name="CheckIcon" size={13} variant="solid" />
                          </button>
                        )}
                      </div>
                    </div>

                    {notesEditing ? (
                      <textarea
                        ref={notesRef}
                        className="pm-input resize-none text-sm"
                        rows={6}
                        value={notesValue}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Add notes about this artist..."
                      />
                    ) : (
                      <div
                        className="text-sm rounded-lg px-3 py-2.5 cursor-text min-h-[80px]"
                        style={{
                          background: 'var(--color-muted)',
                          border: '1px solid var(--color-border)',
                          color: notesValue ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                          fontFamily: 'Source Sans 3, sans-serif',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                        onClick={() => { setNotesEditing(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setNotesEditing(true); setTimeout(() => notesRef.current?.focus(), 50); } }}
                        aria-label="Click to edit notes"
                      >
                        {notesValue || 'Click to add notes...'}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick stats */}
                <div className={`pm-panel ${mobileTab !== 'profile' ? 'hidden lg:block' : ''}`}>
                  <p className="pm-kicker mb-3">Relationship Breakdown</p>
                  {recipients.length === 0 ? (
                    <p className="pm-muted text-sm">No recipients linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(
                        recipients.reduce((acc, r) => {
                          acc.set(r.link.relationshipType, (acc.get(r.link.relationshipType) ?? 0) + 1);
                          return acc;
                        }, new Map<string, number>())
                      ).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{type}</span>
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}
                          >
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Column: Recipients Table ── */}
              <div className={`lg:col-span-2 ${mobileTab !== 'recipients' ? 'hidden lg:block' : ''}`}>
                <div className="pm-panel">
                  {/* Table header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="pm-kicker">Linked Contacts</p>
                      <h2 className="font-semibold text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>
                        Recipients
                        {filteredRecipients.length !== recipients.length && (
                          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-muted-foreground)' }}>
                            ({filteredRecipients.length} of {recipients.length})
                          </span>
                        )}
                        {filteredRecipients.length === recipients.length && recipients.length > 0 && (
                          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-muted-foreground)' }}>
                            ({recipients.length})
                          </span>
                        )}
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="pm-btn-primary flex items-center gap-1.5 text-sm px-4 py-2"
                      style={{ minHeight: 'auto' }}
                    >
                      <Icon name="PlusIcon" size={15} variant="outline" />
                      Add Recipient
                    </button>
                  </div>

                  {/* Table filters */}
                  {recipients.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Icon
                          name="MagnifyingGlassIcon"
                          size={14}
                          variant="outline"
                          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        />
                        <input
                          className="pm-input pl-8 text-sm"
                          placeholder="Search recipients..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                        />
                      </div>
                      {uniqueRelTypes.length > 1 && (
                        <select
                          className="pm-input w-36 text-sm"
                          value={tableRoleFilter}
                          onChange={(e) => setTableRoleFilter(e.target.value)}
                        >
                          <option value="">All types</option>
                          {uniqueRelTypes.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Table */}
                  {recipients.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="UsersIcon" size={36} variant="outline" className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
                      <p className="pm-muted text-sm mb-3">No recipients linked to this artist yet.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="pm-btn-primary text-sm px-4 py-2"
                        style={{ minHeight: 'auto' }}
                      >
                        <Icon name="PlusIcon" size={14} variant="outline" />
                        Add First Recipient
                      </button>
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="pm-muted text-sm">No recipients match your search.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              {['Name', 'Role', 'Company', 'Email', 'Relationship', 'Actions'].map((h) => (
                                <th
                                  key={h}
                                  className="text-left pb-2.5 pr-4 last:pr-0"
                                  style={{
                                    fontFamily: 'IBM Plex Sans, sans-serif',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-muted-foreground)',
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRecipients.map(({ link, contact }, idx) => (
                              <tr
                                key={link.id}
                                className="group transition-colors"
                                style={{
                                  borderBottom: idx < filteredRecipients.length - 1 ? '1px solid var(--color-border)' : 'none',
                                }}
                              >
                                {/* Name */}
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                      style={{
                                        background: 'var(--color-border)',
                                        color: 'var(--color-foreground)',
                                      }}
                                    >
                                      {contact.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                                        {contact.fullName}
                                      </p>
                                      {link.isPrimary && (
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded-full"
                                          style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                                        >
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                {/* Role */}
                                <td className="py-3 pr-4">
                                  <span
                                    className="text-xs px-2 py-1 rounded-full"
                                    style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}
                                  >
                                    {contact.role}
                                  </span>
                                </td>
                                {/* Company */}
                                <td className="py-3 pr-4">
                                  <span style={{ color: 'var(--color-foreground)' }}>{contact.company}</span>
                                </td>
                                {/* Email */}
                                <td className="py-3 pr-4">
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="font-mono text-xs hover:underline"
                                    style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}
                                  >
                                    {contact.email}
                                  </a>
                                </td>
                                {/* Relationship */}
                                <td className="py-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleTogglePrimary(link)}
                                      className="pm-btn p-1.5 transition-all"
                                      title={link.isPrimary ? 'Remove primary status' : 'Set as primary contact'}
                                      aria-label={link.isPrimary ? 'Remove primary status' : 'Set as primary contact'}
                                      style={{
                                        color: link.isPrimary ? '#f59e0b' : 'var(--color-muted-foreground)',
                                        borderColor: link.isPrimary ? '#f59e0b' : 'var(--color-border)',
                                        background: link.isPrimary ? 'rgba(245,158,11,0.08)' : 'transparent',
                                      }}
                                    >
                                      <Icon name="StarIcon" size={14} variant={link.isPrimary ? 'solid' : 'outline'} />
                                    </button>
                                    <button
                                      onClick={() => setConfirmRemove({ linkId: link.id, contactName: contact.fullName })}
                                      className="pm-btn p-1.5"
                                      title="Remove recipient"
                                      aria-label={`Remove ${contact.fullName} from recipients`}
                                      style={{ color: 'var(--color-destructive)' }}
                                    >
                                      <Icon name="XMarkIcon" size={14} variant="outline" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden space-y-3">
                        {filteredRecipients.map(({ link, contact }) => (
                          <div
                            key={link.id}
                            className="rounded-xl p-3"
                            style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                                >
                                  {contact.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                                      {contact.fullName}
                                    </p>
                                    {link.isPrimary && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)' }}>
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                                    {contact.role} · {contact.company}
                                  </p>
                                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    {contact.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleTogglePrimary(link)}
                                  className="pm-btn p-1.5"
                                  aria-label={link.isPrimary ? 'Remove primary' : 'Set primary'}
                                  style={{
                                    color: link.isPrimary ? '#f59e0b' : 'var(--color-muted-foreground)',
                                    borderColor: link.isPrimary ? '#f59e0b' : 'var(--color-border)',
                                    background: link.isPrimary ? 'rgba(245,158,11,0.08)' : 'transparent',
                                  }}
                                >
                                  <Icon name="StarIcon" size={14} variant={link.isPrimary ? 'solid' : 'outline'} />
                                </button>
                                <button
                                  onClick={() => setConfirmRemove({ linkId: link.id, contactName: contact.fullName })}
                                  className="pm-btn p-1.5"
                                  aria-label="Remove"
                                  style={{ color: 'var(--color-destructive)' }}
                                >
                                  <Icon name="XMarkIcon" size={14} variant="outline" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                              >
                                {link.relationshipType}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Recipient Modal */}
      {showAddModal && artist && (
        <AddRecipientModal
          artistId={artist.id}
          existingContactIds={existingContactIds}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            loadArtist(artist.id);
            showToast('Recipient added successfully', 'success');
          }}
        />
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <ConfirmModal
          title="Remove Recipient"
          message={`Remove <strong>${confirmRemove.contactName}</strong> from this artist's recipients? This won't delete the contact.`}
          confirmLabel="Remove"
          onConfirm={() => handleRemoveLink(confirmRemove.linkId)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
      <SubmissionProgressOverlay progress={submissionProgress} title="Saving Artist…" />

      {/* Spotify Artist Search Modal */}
      {showSpotify && (
        <SpotifyArtistSearch
          initialQuery={isCreateMode ? createForm.name : editForm.name}
          onSelect={(data: SpotifyFetchedData) => {
            if (isCreateMode) {
              setCreateForm((f) => ({
                ...f,
                name: data.name || f.name,
                genre: data.genre || f.genre,
              }));
              setCreateErrors((p) => {
                const x = { ...p };
                if (data.name) delete x.name;
                if (data.genre) delete x.genre;
                return x;
              });
            } else {
              setEditForm((f) => ({
                ...f,
                name: data.name,
                genre: data.genre || f.genre,
              }));
              setEditErrors((p) => {
                const x = { ...p };
                if (data.name) delete x.name;
                if (data.genre) delete x.genre;
                return x;
              });
            }
            setShowSpotify(false);
            showToast(`Fetched metadata for "${data.name}" from Spotify`, 'success');
          }}
          onClose={() => setShowSpotify(false)}
        />
      )}
    </div>
  );
}

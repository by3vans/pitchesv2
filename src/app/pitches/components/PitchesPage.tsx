'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { artistStore, contactStore, linkStore, pitchStore, pitchRecipientStore, initStore } from '@/lib/store';
import type { Artist, Contact, Pitch } from '@/lib/types';
import { PITCH_STATUSES } from '@/lib/types';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'var(--color-muted)', text: 'var(--color-muted-foreground)' },
  sent: { bg: '#dbeafe', text: '#1d4ed8' },
  hold: { bg: '#fef3c7', text: '#92400e' },
  placed: { bg: '#d1fae5', text: '#065f46' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface PitchModalProps {
  pitch: Pitch | null;
  onClose: () => void;
  onSave: () => void;
}

function PitchModal({ pitch, onClose, onSave }: PitchModalProps) {
  const [artists] = useState<Artist[]>(() => artistStore.getAll());
  const [allContacts] = useState<Contact[]>(() => contactStore.getAll());

  const [form, setForm] = useState({
    title: pitch?.title ?? '',
    artistId: pitch?.artistId ?? '',
    trackUrl: pitch?.trackUrl ?? '',
    status: (pitch?.status ?? 'draft') as Pitch['status'],
    notes: pitch?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (pitch) {
      const existing = pitchRecipientStore.getByPitch(pitch.id).map((pr) => pr.contactId);
      setSelectedContactIds(existing);
    }
    if (pitch?.artistId) {
      const links = linkStore.getByArtist(pitch.artistId);
      const contacts = links.map((l) => allContacts.find((c) => c.id === l.contactId)).filter(Boolean) as Contact[];
      setLinkedContacts(contacts);
    }
  }, []);

  const handleArtistChange = (artistId: string) => {
    setForm((p) => ({ ...p, artistId }));
    setErrors((p) => { const e = { ...p }; delete e.artistId; return e; });
    if (!artistId) { setLinkedContacts([]); setSelectedContactIds([]); return; }
    const links = linkStore.getByArtist(artistId);
    const contacts = links.map((l) => allContacts.find((c) => c.id === l.contactId)).filter(Boolean) as Contact[];
    setLinkedContacts(contacts);
    setSelectedContactIds(contacts.map((c) => c.id));
  };

  const toggleContact = (cid: string) => {
    setSelectedContactIds((prev) => prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]);
  };

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.artistId) e.artistId = 'Select an artist';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    let savedPitch: Pitch;
    if (pitch) {
      savedPitch = pitchStore.update(pitch.id, form) as Pitch;
    } else {
      savedPitch = pitchStore.create(form);
    }
    pitchRecipientStore.setForPitch(savedPitch.id, selectedContactIds);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="pm-panel w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="pm-h1 text-lg">{pitch ? 'Edit Pitch' : 'New Pitch'}</h2>
          <button onClick={onClose} className="pm-btn" aria-label="Close">
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="pm-label">Title <span className="text-red-500">*</span></label>
            <input className="pm-input" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Pitch title" autoFocus />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="pm-label">Artist <span className="text-red-500">*</span></label>
            <select className="pm-input" value={form.artistId} onChange={(e) => handleArtistChange(e.target.value)}>
              <option value="">Select artist...</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.artistId && <p className="text-xs text-red-500 mt-1">{errors.artistId}</p>}
          </div>

          {form.artistId && (
            <div>
              <label className="pm-label">Recipients</label>
              {linkedContacts.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>No contacts linked to this artist yet. Go to Artists to add recipients.</p>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {linkedContacts.map((c) => {
                    const link = linkStore.getByArtist(form.artistId).find((l) => l.contactId === c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(c.id)}
                          onChange={() => toggleContact(c.id)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{c.fullName}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--color-muted-foreground)' }}>{link?.relationshipType} @ {c.company}</span>
                          {link?.isPrimary && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}>Primary</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="pm-label">Track URL</label>
            <input className="pm-input" value={form.trackUrl} onChange={(e) => update('trackUrl', e.target.value)} placeholder="https://soundcloud.com/..." />
          </div>

          <div>
            <label className="pm-label">Status</label>
            <select className="pm-input" value={form.status} onChange={(e) => update('status', e.target.value as Pitch['status'])}>
              {PITCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="pm-label">Notes</label>
            <textarea className="pm-input resize-none" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="pm-btn">Cancel</button>
            <button type="submit" className="pm-btn-primary">Save Pitch</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PitchRowProps {
  pitch: Pitch;
  artistName: string;
  recipientCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

function PitchRow({ pitch, artistName, recipientCount, onEdit, onDelete }: PitchRowProps) {
  return (
    <div className="pm-panel flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{pitch.title}</p>
          <StatusBadge status={pitch.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{artistName}</span>
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</span>
          {pitch.trackUrl && (
            <>
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
              <a href={pitch.trackUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: 'var(--color-accent)' }} onClick={(e) => e.stopPropagation()}>
                <Icon name="MusicalNoteIcon" size={12} variant="outline" />
                Track
              </a>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="pm-btn p-1.5" aria-label="Edit">
          <Icon name="PencilSquareIcon" size={14} variant="outline" />
        </button>
        <button onClick={onDelete} className="pm-btn p-1.5" style={{ color: 'var(--color-destructive)' }} aria-label="Delete">
          <Icon name="TrashIcon" size={14} variant="outline" />
        </button>
      </div>
    </div>
  );
}

export default function PitchesPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editTarget, setEditTarget] = useState<Pitch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = () => {
    setPitches(pitchStore.getAll());
    setArtists(artistStore.getAll());
  };

  useEffect(() => {
    initStore();
    refresh();
  }, []);

  const getArtistName = (id: string) => artists.find((a) => a.id === id)?.name ?? '—';
  const getRecipientCount = (pitchId: string) => pitchRecipientStore.getByPitch(pitchId).length;

  const filtered = pitches.filter((p) => {
    const q = search.toLowerCase();
    const name = getArtistName(p.artistId).toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || name.includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEdit = (p: Pitch) => { setEditTarget(p); setShowModal(true); };
  const handleNew = () => { setEditTarget(null); setShowModal(true); };
  const handleDelete = (p: Pitch) => {
    if (!confirm(`Delete pitch "${p.title}"?`)) return;
    pitchStore.delete(p.id);
    refresh();
  };

  const stats = PITCH_STATUSES.map((s) => ({ ...s, count: pitches.filter((p) => p.status === s.value).length }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="pm-panel mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="pm-kicker">Submissions</p>
                <h1 className="pm-h1">Pitches</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Icon name="MagnifyingGlassIcon" size={16} variant="outline" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-foreground)' }} />
                  <input className="pm-input pl-9 w-48" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="pm-input w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  {PITCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={handleNew} className="pm-btn-primary flex items-center gap-1">
                  <Icon name="PlusIcon" size={16} variant="outline" />
                  New Pitch
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-4 flex-wrap">
              {stats.map((s) => (
                <div key={s.value} className="flex items-center gap-2">
                  <StatusBadge status={s.value} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="pm-panel text-center py-12">
              <Icon name="PaperAirplaneIcon" size={36} variant="outline" className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="pm-muted">{search || statusFilter ? 'No pitches match your filters.' : 'No pitches yet. Create your first pitch.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <PitchRow
                  key={p.id}
                  pitch={p}
                  artistName={getArtistName(p.artistId)}
                  recipientCount={getRecipientCount(p.id)}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => handleDelete(p)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <PitchModal
          pitch={editTarget}
          onClose={() => setShowModal(false)}
          onSave={refresh}
        />
      )}
    </div>
  );
}

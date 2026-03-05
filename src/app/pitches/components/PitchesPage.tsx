'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const PITCH_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'var(--color-muted)', text: 'var(--color-muted-foreground)' },
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  in_review: { bg: '#fef3c7', text: '#92400e' },
  approved: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  // legacy fallbacks
  sent: { bg: '#dbeafe', text: '#1d4ed8' },
  hold: { bg: '#fef3c7', text: '#92400e' },
  placed: { bg: '#d1fae5', text: '#065f46' },
};

interface SupabasePitch {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  created_at: string;
  artist_id: string | null;
}

interface SupabaseArtist {
  id: string;
  name: string;
  genre: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface PitchModalProps {
  pitch: SupabasePitch | null;
  artists: SupabaseArtist[];
  onClose: () => void;
  onSave: () => void;
}

function PitchModal({ pitch, artists, onClose, onSave }: PitchModalProps) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: pitch?.title ?? '',
    artist_id: pitch?.artist_id ?? '',
    status: pitch?.status ?? 'draft',
    notes: pitch?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.artist_id) e.artist_id = 'Select an artist';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (pitch) {
        console.log('[PitchModal] Updating pitch:', pitch.id, form);
        const { error } = await supabase
          .from('pitches')
          .update({ title: form.title, artist_id: form.artist_id || null, status: form.status, notes: form.notes })
          .eq('id', pitch.id);
        if (error) throw error;
        console.log('[PitchModal] ✅ Pitch updated successfully');
      } else {
        console.log('[PitchModal] Creating new pitch:', form);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('pitches')
          .insert({ title: form.title, artist_id: form.artist_id || null, status: form.status, notes: form.notes, user_id: user?.id });
        if (error) throw error;
        console.log('[PitchModal] ✅ Pitch created successfully');
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error('[PitchModal] ❌ Save error:', err?.message ?? err);
    } finally {
      setSaving(false);
    }
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
            <select className="pm-input" value={form.artist_id} onChange={(e) => update('artist_id', e.target.value)}>
              <option value="">Select artist...</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.artist_id && <p className="text-xs text-red-500 mt-1">{errors.artist_id}</p>}
          </div>

          <div>
            <label className="pm-label">Status</label>
            <select className="pm-input" value={form.status} onChange={(e) => update('status', e.target.value)}>
              {PITCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="pm-label">Notes</label>
            <textarea className="pm-input resize-none" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="pm-btn">Cancel</button>
            <button type="submit" disabled={saving} className="pm-btn-primary">
              {saving ? 'Saving...' : 'Save Pitch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PitchRowProps {
  pitch: SupabasePitch;
  artistName: string;
  onEdit: () => void;
  onDelete: () => void;
}

function PitchRow({ pitch, artistName, onEdit, onDelete }: PitchRowProps) {
  return (
    <div className="pm-panel flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{pitch.title}</p>
          <StatusBadge status={pitch.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{artistName}</span>
          {pitch.notes && (
            <>
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
              <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--color-muted-foreground)' }}>{pitch.notes}</span>
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
  const supabase = createClient();
  const [pitches, setPitches] = useState<SupabasePitch[]>([]);
  const [artists, setArtists] = useState<SupabaseArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<SupabasePitch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    console.log('[PitchesPage] 🔄 Fetching pitches and artists from Supabase...');
    setLoading(true);
    try {
      // Fetch pitches
      console.log('[PitchesPage] Querying pitches table...');
      const { data: pitchData, error: pitchError } = await supabase
        .from('pitches')
        .select('id, title, status, notes, created_at, artist_id')
        .order('created_at', { ascending: false });

      if (pitchError) {
        console.error('[PitchesPage] ❌ Pitches query error:', pitchError.message);
      } else {
        console.log('[PitchesPage] ✅ Pitches fetched:', pitchData?.length ?? 0, 'rows', pitchData);
      }

      // Fetch artists
      console.log('[PitchesPage] Querying artists table...');
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('id, name, genre')
        .order('name', { ascending: true });

      if (artistError) {
        console.error('[PitchesPage] ❌ Artists query error:', artistError.message);
      } else {
        console.log('[PitchesPage] ✅ Artists fetched:', artistData?.length ?? 0, 'rows', artistData);
      }

      setPitches(pitchData ?? []);
      setArtists(artistData ?? []);
    } catch (err: any) {
      console.error('[PitchesPage] ❌ Unexpected error:', err?.message ?? err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getArtistName = (id: string | null) => artists.find((a) => a.id === id)?.name ?? '—';

  const filtered = pitches.filter((p) => {
    const q = search.toLowerCase();
    const name = getArtistName(p.artist_id).toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || name.includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEdit = (p: SupabasePitch) => { setEditTarget(p); setShowModal(true); };
  const handleNew = () => { setEditTarget(null); setShowModal(true); };
  const handleDelete = async (p: SupabasePitch) => {
    if (!confirm(`Delete pitch "${p.title}"?`)) return;
    console.log('[PitchesPage] Deleting pitch:', p.id);
    const { error } = await supabase.from('pitches').delete().eq('id', p.id);
    if (error) {
      console.error('[PitchesPage] ❌ Delete error:', error.message);
    } else {
      console.log('[PitchesPage] ✅ Pitch deleted successfully');
      fetchData();
    }
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

          {loading ? (
            <div className="pm-panel text-center py-12">
              <svg className="animate-spin h-6 w-6 mx-auto mb-3" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted-foreground)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="pm-muted">Loading pitches from Supabase...</p>
            </div>
          ) : filtered.length === 0 ? (
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
                  artistName={getArtistName(p.artist_id)}
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
          artists={artists}
          onClose={() => setShowModal(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}

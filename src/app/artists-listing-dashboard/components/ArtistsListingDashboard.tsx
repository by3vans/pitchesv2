'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import SpotifyArtistSearch from '@/components/ui/SpotifyArtistSearch';

type ArtistStatus = 'active' | 'inactive' | 'archived';

interface Artist {
  id: string; name: string; genre: string; subGenres: string[];
  status: ArtistStatus; avatar: string; avatarAlt: string;
  pitchCount: number; approvedPitches: number; lastActivity: string;
  label: string; location: string; bio: string;
}

const STATUS_CONFIG: Record<ArtistStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: 'Ativo',     color: 'var(--olive)',   bg: 'rgba(78,94,46,0.1)',   dot: 'var(--olive)'   },
  inactive: { label: 'Inativo',   color: 'var(--orange)',  bg: 'rgba(184,98,42,0.1)',  dot: 'var(--orange)'  },
  archived: { label: 'Arquivado', color: 'var(--stone)',   bg: 'rgba(122,116,112,0.1)',dot: 'var(--stone)'   },
};

const GENRE_OPTIONS = ['All Genres','Pop','Rock','Sertanejo','Funk','MPB','Electronic','Hip-Hop','Gospel'];
const SORT_OPTIONS = [
  { value: 'name',     label: 'Nome'       },
  { value: 'genre',    label: 'Gênero'     },
  { value: 'status',   label: 'Status'     },
  { value: 'activity', label: 'Atividade'  },
  { value: 'pitches',  label: 'Pitches'    },
];
const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  fontFamily: 'Epilogue, sans-serif',
  backgroundColor: 'var(--ice)',
  borderColor: 'var(--cream)',
  color: 'var(--ink)',
};
const inputCls = 'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none transition-all';
const labelCls = 'block text-xs font-medium mb-1';

function StatusBadge({ status }: { status: ArtistStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ fontFamily: 'Azeret Mono, monospace', color: cfg.color, backgroundColor: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Edit Artist Modal ─────────────────────────────────────────────────────────

interface EditArtistModalProps {
  artist: Artist;
  onSave: (updated: Artist) => void;
  onClose: () => void;
}

function EditArtistModal({ artist, onSave, onClose }: EditArtistModalProps) {
  const [form, setForm] = useState<Artist>({ ...artist });
  const [subGenresRaw, setSubGenresRaw] = useState(artist.subGenres.join(', '));
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof Artist, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Artist = { ...form, subGenres: subGenresRaw.split(',').map((s) => s.trim()).filter(Boolean) };
    setSaving(true);
    await onSave(updated);
    setSaving(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label={`Editar ${artist.name}`}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--cream)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--cream)' }}>
              <Icon name="PencilSquareIcon" size={18} variant="outline" style={{ color: 'var(--stone)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Editar Artista
              </h2>
              <p className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                {artist.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all focus:outline-none"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Fechar">
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Nome do Artista <span style={{ color: 'var(--crimson)' }}>*</span>
              </label>
              <input type="text" required value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Nome do artista" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Gênero</label>
              <div className="relative">
                <select value={form.genre} onChange={(e) => handleChange('genre', e.target.value)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'} style={inputStyle}>
                  {['Pop','Rock','Sertanejo','Funk','MPB','Electronic','Hip-Hop','Gospel'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <Icon name="ChevronDownIcon" size={13} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Status</label>
              <div className="relative">
                <select value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as ArtistStatus)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'} style={inputStyle}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
                <Icon name="ChevronDownIcon" size={13} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>
            </div>

            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Sub-gêneros <span style={{ color: 'var(--stone)', fontWeight: 400 }}>(separados por vírgula)</span>
              </label>
              <input type="text" value={subGenresRaw} onChange={(e) => setSubGenresRaw(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="ex: tropical, electronic, dance" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Gravadora</label>
              <input type="text" value={form.label} onChange={(e) => handleChange('label', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Nome da gravadora" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Localização</label>
              <input type="text" value={form.location} onChange={(e) => handleChange('location', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Cidade, Estado" />
            </div>

            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Bio</label>
              <textarea rows={3} value={form.bio} onChange={(e) => handleChange('bio', e.target.value)}
                className={inputCls + ' resize-none'} style={inputStyle} placeholder="Biografia curta do artista" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>URL do Avatar</label>
              <input type="text" value={form.avatar} onChange={(e) => handleChange('avatar', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="https://..." />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Alt Text do Avatar</label>
              <input type="text" value={form.avatarAlt} onChange={(e) => handleChange('avatarAlt', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Descreva a imagem" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2"
            style={{ borderTop: '1px solid var(--cream)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', border: '1px solid var(--cream)', backgroundColor: 'transparent' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-60"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--ink)', color: 'var(--ice)' }}>
              {saving ? (
                <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Salvando...</>
              ) : (
                <><Icon name="CheckIcon" size={14} variant="outline" />Salvar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Artist Modal ──────────────────────────────────────────────────────────

interface NewArtistForm {
  name: string; genre: string; subGenres: string;
  status: ArtistStatus; label: string; location: string; bio: string;
}

function AddArtistModal({ onSave, onClose }: {
  onSave: (form: NewArtistForm) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewArtistForm>({
    name: '', genre: 'Pop', subGenres: '', status: 'active', label: '', location: '', bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSpotify, setShowSpotify] = useState(false);

  const handleChange = (field: keyof NewArtistForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    const err = await onSave(form);
    setSaving(false);
    if (err) setSaveError(err);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Adicionar artista">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--cream)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(72,108,227,0.1)' }}>
              <Icon name="PlusIcon" size={18} variant="outline" style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Adicionar Artista
              </h2>
              <p className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Criar novo perfil de artista
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowSpotify(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: '#1DB954', color: 'white' }}>
              Spotify
            </button>
            <button onClick={onClose} className="p-2 rounded-lg transition-all focus:outline-none"
              style={{ color: 'var(--stone)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="Fechar">
              <Icon name="XMarkIcon" size={18} variant="outline" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Nome do Artista <span style={{ color: 'var(--crimson)' }}>*</span>
              </label>
              <input type="text" required value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Nome do artista" autoFocus />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Gênero</label>
              <div className="relative">
                <select value={form.genre} onChange={(e) => handleChange('genre', e.target.value)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'} style={inputStyle}>
                  {['Pop','Rock','Sertanejo','Funk','MPB','Electronic','Hip-Hop','Gospel'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <Icon name="ChevronDownIcon" size={13} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Status</label>
              <div className="relative">
                <select value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as ArtistStatus)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'} style={inputStyle}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
                <Icon name="ChevronDownIcon" size={13} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>
            </div>

            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Sub-gêneros <span style={{ color: 'var(--stone)', fontWeight: 400 }}>(separados por vírgula)</span>
              </label>
              <input type="text" value={form.subGenres} onChange={(e) => handleChange('subGenres', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="ex: tropical, electronic, dance" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Gravadora</label>
              <input type="text" value={form.label} onChange={(e) => handleChange('label', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Nome da gravadora" />
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Localização</label>
              <input type="text" value={form.location} onChange={(e) => handleChange('location', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Cidade, Estado" />
            </div>

            <div className="col-span-2">
              <label className={labelCls} style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Bio</label>
              <textarea value={form.bio} onChange={(e) => handleChange('bio', e.target.value)}
                className={inputCls + ' resize-none'} style={inputStyle} rows={3}
                placeholder="Biografia curta..." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--cream)' }}>
            {saveError && (
              <p className="text-xs mr-auto" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}>
                {saveError}
              </p>
            )}
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-60"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--blue)', color: 'var(--ice)' }}>
              {saving ? (
                <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Salvando...</>
              ) : (
                <><Icon name="PlusIcon" size={15} variant="outline" />Adicionar Artista</>
              )}
            </button>
          </div>
        </form>

        {showSpotify && (
          <SpotifyArtistSearch
            initialQuery={form.name}
            onSelect={(data: any) => {
              if (data.name)     handleChange('name', data.name);
              if (data.genre)    handleChange('genre', data.genre);
              if (data.bio)      handleChange('bio', data.bio);
              if (data.location) handleChange('location', data.location);
              setShowSpotify(false);
            }}
            onClose={() => setShowSpotify(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Card View ─────────────────────────────────────────────────────────────────

function ArtistCardView({ artist, isSelected, onToggleSelect, selectionMode, onEdit }: {
  artist: Artist; isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean; onEdit: (artist: Artist) => void;
}) {
  const approvalRate = artist.pitchCount > 0
    ? Math.round((artist.approvedPitches / artist.pitchCount) * 100) : 0;

  return (
    <div
      className="group relative rounded-xl p-4 transition-all duration-200 flex flex-col cursor-pointer"
      style={{
        backgroundColor: 'var(--ice)',
        border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--cream)'}`,
        boxShadow: isSelected ? '0 0 0 2px rgba(26,26,24,0.15)' : undefined,
      }}
      onDoubleClick={() => onEdit(artist)} title="Double-click para editar">

      {/* Checkbox */}
      <div className={`absolute top-3 left-3 z-10 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div role="checkbox" aria-checked={isSelected}
          aria-label={isSelected ? `Desselecionar ${artist.name}` : `Selecionar ${artist.name}`}
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(artist.id); }}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleSelect(artist.id); } }}
          className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none"
          style={{
            backgroundColor: isSelected ? 'var(--ink)' : 'var(--ice)',
            borderColor: isSelected ? 'var(--ink)' : 'var(--cream)',
          }}>
          {isSelected && <Icon name="CheckIcon" size={10} variant="solid" style={{ color: 'var(--ice)' }} />}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: 'var(--cream)' }}>
            <AppImage src={artist.avatar} alt={artist.avatarAlt} width={48} height={48} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              {artist.name}
            </h3>
            <p className="text-xs truncate" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              {artist.location}
            </p>
          </div>
        </div>
        <StatusBadge status={artist.status} />
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--ink)' }}>
          {artist.genre}
        </span>
        {artist.subGenres.slice(0, 2).map((g) => (
          <span key={g} className="text-xs px-2 py-0.5 rounded-full"
            style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
            #{g}
          </span>
        ))}
      </div>

      {/* Bio */}
      <p className="text-xs line-clamp-2 mb-3 flex-1"
        style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
        {artist.bio}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { value: artist.pitchCount,    label: 'Pitches'   },
          { value: artist.approvedPitches, label: 'Aprovados' },
          { value: `${approvalRate}%`,   label: 'Taxa'      },
        ].map(({ value, label }) => (
          <div key={label} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--cream)' }}>
            <p className="text-base font-bold" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--ink)' }}>{value}</p>
            <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--cream)' }}>
        <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
          {artist.lastActivity}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/artist-detail-management?artistId=${artist.id}`}
            className="p-1.5 rounded-lg transition-all focus:outline-none"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={`Ver perfil de ${artist.name}`}
            onClick={(e) => e.stopPropagation()}>
            <Icon name="UserIcon" size={13} variant="outline" />
          </Link>
          <Link href="/pitches/new"
            className="p-1.5 rounded-lg transition-all focus:outline-none"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={`Criar pitch para ${artist.name}`}
            onClick={(e) => e.stopPropagation()}>
            <Icon name="PaperAirplaneIcon" size={13} variant="outline" />
          </Link>
          <button onClick={(e) => { e.stopPropagation(); onEdit(artist); }}
            className="p-1.5 rounded-lg transition-all focus:outline-none"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={`Editar ${artist.name}`}>
            <Icon name="PencilSquareIcon" size={13} variant="outline" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function ArtistListView({ artist, isSelected, onToggleSelect, selectionMode, onEdit }: {
  artist: Artist; isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean; onEdit: (artist: Artist) => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'var(--ice)',
        border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--cream)'}`,
      }}
      onDoubleClick={() => onEdit(artist)} title="Double-click para editar">

      {/* Checkbox */}
      <div className={`shrink-0 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div role="checkbox" aria-checked={isSelected}
          aria-label={isSelected ? `Desselecionar ${artist.name}` : `Selecionar ${artist.name}`}
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(artist.id); }}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleSelect(artist.id); } }}
          className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none"
          style={{
            backgroundColor: isSelected ? 'var(--ink)' : 'transparent',
            borderColor: isSelected ? 'var(--ink)' : 'var(--cream)',
          }}>
          {isSelected && <Icon name="CheckIcon" size={10} variant="solid" style={{ color: 'var(--ice)' }} />}
        </div>
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: 'var(--cream)' }}>
        <AppImage src={artist.avatar} alt={artist.avatarAlt} width={40} height={40} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
            {artist.name}
          </p>
          <span style={{ color: 'var(--cream)' }}>·</span>
          <p className="text-xs truncate" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
            {artist.location}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
            {artist.genre}
          </span>
          {artist.subGenres.slice(0, 2).map((g) => (
            <span key={g} className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              #{g}
            </span>
          ))}
        </div>
      </div>

      {/* Right stats */}
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--ink)' }}>
            {artist.pitchCount}
          </p>
          <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>pitches</p>
        </div>
        <StatusBadge status={artist.status} />
        <span className="text-xs w-20 text-right" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
          {artist.lastActivity}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link href={`/artist-detail-management?artistId=${artist.id}`}
          className="p-1.5 rounded-lg transition-all focus:outline-none"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={`Ver perfil de ${artist.name}`}
          onClick={(e) => e.stopPropagation()}>
          <Icon name="UserIcon" size={14} variant="outline" />
        </Link>
        <button onClick={(e) => { e.stopPropagation(); onEdit(artist); }}
          className="p-1.5 rounded-lg transition-all focus:outline-none"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={`Editar ${artist.name}`}>
          <Icon name="PencilSquareIcon" size={14} variant="outline" />
        </button>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: {
  currentPage: number; totalPages: number; pageSize: number; totalItems: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
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

  const btnBase: React.CSSProperties = {
    fontFamily: 'Azeret Mono, monospace',
    backgroundColor: 'var(--ice)',
    borderColor: 'var(--cream)',
    color: 'var(--stone)',
  };

  return (
    <div className="flex flex-col gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--cream)' }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
          {totalItems === 0 ? 'Sem resultados' : `${startItem}–${endItem} de ${totalItems}`}
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
            Por página:
          </label>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Itens por página"
            className="text-xs rounded-lg px-2 py-1.5 border focus:outline-none"
            style={btnBase}>
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap" role="navigation" aria-label="Paginação">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            aria-label="Página anterior"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={btnBase}>
            <Icon name="ChevronLeftIcon" size={13} variant="outline" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-xs" style={{ color: 'var(--stone)' }}>…</span>
            ) : (
              <button key={page} onClick={() => onPageChange(page as number)}
                aria-label={`Página ${page}`} aria-current={currentPage === page ? 'page' : undefined}
                className="min-w-[36px] min-h-[36px] px-2.5 py-2 rounded-lg text-xs border transition-all"
                style={{
                  fontFamily: 'Azeret Mono, monospace',
                  backgroundColor: currentPage === page ? 'var(--ink)' : 'var(--ice)',
                  borderColor: currentPage === page ? 'var(--ink)' : 'var(--cream)',
                  color: currentPage === page ? 'var(--ice)' : 'var(--stone)',
                  fontWeight: currentPage === page ? 600 : 400,
                }}>
                {page}
              </button>
            )
          )}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
            aria-label="Próxima página"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
            style={btnBase}>
            <span className="hidden sm:inline">Próxima</span>
            <Icon name="ChevronRightIcon" size={13} variant="outline" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ArtistsListingDashboard() {
  const [viewMode, setViewMode]             = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [genreFilter, setGenreFilter]       = useState('');
  const [sortBy, setSortBy]                 = useState('activity');
  const [sortOrder, setSortOrder]           = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage]       = useState(1);
  const [pageSize, setPageSize]             = useState(6);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]         = useState<ArtistStatus>('inactive');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [artists, setArtists]               = useState<Artist[]>([]);
  const [editingArtist, setEditingArtist]   = useState<Artist | null>(null);
  const [showAddArtist, setShowAddArtist]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const supabase  = useMemo(() => createClient(), []);
  const router    = useRouter();
  const { showToast } = useToast();

  const fetchArtists = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); setIsLoading(false); return; }

      const { data: artistRows, error: artistError } = await supabase
        .from('artists')
        .select('id, name, genre, sub_genres, status, label, location, bio, avatar_url, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false });

      if (artistError) throw artistError;
      if (!artistRows) { setArtists([]); setIsLoading(false); return; }

      const { data: pitchRows } = await supabase
        .from('pitches').select('artist_id, status, updated_at').eq('user_id', user.id);

      const mapped: Artist[] = artistRows.map((row) => {
        const artistPitches = (pitchRows || []).filter((p) => p.artist_id === row.id);
        const approvedPitches = artistPitches.filter((p) => ['approved','placed'].includes(p.status)).length;
        const lastPitch = artistPitches.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
        const lastActivityDate = lastPitch ? new Date(lastPitch.updated_at) : new Date(row.created_at);
        return {
          id: row.id, name: row.name, genre: row.genre || '',
          subGenres: row.sub_genres || [],
          status: (row.status as ArtistStatus) || 'active',
          avatar: row.avatar_url || '', avatarAlt: `${row.name} artist photo`,
          pitchCount: artistPitches.length, approvedPitches,
          lastActivity: lastActivityDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          label: row.label || '', location: row.location || '', bio: row.bio || '',
        };
      });
      setArtists(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar artistas');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase.channel('artists-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'artists', filter: `user_id=eq.${user.id}` }, () => fetchArtists())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pitches', filter: `user_id=eq.${user.id}` }, () => fetchArtists())
        .subscribe();
    };
    setupRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [supabase, fetchArtists]);

  const handleSaveArtist = async (updated: Artist) => {
    try {
      const { error: updateError } = await supabase.from('artists').update({
        name: updated.name, genre: updated.genre, sub_genres: updated.subGenres,
        status: updated.status, label: updated.label, location: updated.location,
        bio: updated.bio, avatar_url: updated.avatar,
      }).eq('id', updated.id);
      if (updateError) throw updateError;
      setArtists((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      showToast('Artista salvo com sucesso', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar artista', 'error');
    }
    setEditingArtist(null);
  };

  const handleAddArtist = async (form: NewArtistForm): Promise<string | null> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return 'Você precisa estar logado para adicionar um artista.';
      const { error: insertError } = await supabase.from('artists').insert({
        user_id: user.id, name: form.name, genre: form.genre,
        sub_genres: form.subGenres.split(',').map((s) => s.trim()).filter(Boolean),
        status: form.status,
        label: form.label || null, location: form.location || null, bio: form.bio || null,
      });
      if (insertError) { showToast(insertError.message || 'Erro ao adicionar artista', 'error'); return insertError.message; }
      setShowAddArtist(false);
      await fetchArtists();
      return null;
    } catch (err: any) {
      showToast(err.message || 'Erro inesperado.', 'error');
      return err.message ?? 'Erro inesperado.';
    }
  };

  const filteredArtists = useMemo(() => {
    let result = [...artists];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q) ||
        a.subGenres.some((g) => g.toLowerCase().includes(q)) ||
        a.label.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (genreFilter && genreFilter !== 'All Genres') result = result.filter((a) => a.genre === genreFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name')     cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'genre')  cmp = a.genre.localeCompare(b.genre);
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'pitches') cmp = a.pitchCount - b.pitchCount;
      else {
        const parseDate = (d: string) => { const [day,month,year] = d.split('/'); return new Date(+year,+month-1,+day).getTime(); };
        cmp = parseDate(a.lastActivity) - parseDate(b.lastActivity);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [artists, search, statusFilter, genreFilter, sortBy, sortOrder]);

  const totalPages     = Math.max(1, Math.ceil(filteredArtists.length / pageSize));
  const safePage       = Math.min(currentPage, totalPages);
  const paginatedArtists = filteredArtists.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => ({
    total:          artists.length,
    active:         artists.filter((a) => a.status === 'active').length,
    inactive:       artists.filter((a) => a.status === 'inactive').length,
    archived:       artists.filter((a) => a.status === 'archived').length,
    totalPitches:   artists.reduce((s, a) => s + a.pitchCount, 0),
    approvedPitches:artists.reduce((s, a) => s + a.approvedPitches, 0),
  }), [artists]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () =>
    selectedIds.size === paginatedArtists.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(paginatedArtists.map((a) => a.id)));

  const handleBulkStatusChange = async () => {
    const ids = Array.from(selectedIds);
    try {
      const { error: bulkError } = await supabase.from('artists').update({ status: bulkStatus }).in('id', ids);
      if (bulkError) throw bulkError;
      setArtists((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a));
      showToast(`Status atualizado para "${bulkStatus}" em ${ids.length} artista(s)`, 'success');
    } catch (err: any) { showToast(err.message || 'Erro ao atualizar status', 'error'); }
    setSelectedIds(new Set());
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    try {
      const { error: archiveError } = await supabase.from('artists').update({ status: 'archived' }).in('id', ids);
      if (archiveError) throw archiveError;
      setArtists((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, status: 'archived' as ArtistStatus } : a));
      showToast(`${ids.length} artista(s) arquivado(s)`, 'success');
    } catch (err: any) { showToast(err.message || 'Erro ao arquivar', 'error'); }
    setSelectedIds(new Set());
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setGenreFilter('');
    setSortBy('activity'); setSortOrder('desc'); setCurrentPage(1);
  };

  const hasActiveFilters = !!(search || statusFilter || (genreFilter && genreFilter !== 'All Genres'));
  const selectionMode    = selectedIds.size > 0;

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setCurrentPage(1);
  };

  // ── shared filter select style ──────────────────────────────────────────────
  const filterSelectStyle: React.CSSProperties = {
    fontFamily: 'Epilogue, sans-serif',
    backgroundColor: 'var(--ice)',
    borderColor: 'var(--cream)',
    color: 'var(--ink)',
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />
      <main className="flex-1 md:ml-56 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Topbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="pm-kicker">Gestão</p>
              <h1 className="pm-h1">Artistas</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center rounded-lg p-1 gap-0.5"
                style={{ border: '1px solid var(--cream)', backgroundColor: 'var(--ice)' }}>
                {(['card','list'] as const).map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    aria-label={mode === 'card' ? 'Visão cards' : 'Visão lista'}
                    className="p-2 rounded-md transition-all"
                    style={{
                      backgroundColor: viewMode === mode ? 'var(--ink)' : 'transparent',
                      color: viewMode === mode ? 'var(--ice)' : 'var(--stone)',
                    }}>
                    <Icon name={mode === 'card' ? 'Squares2X2Icon' : 'ListBulletIcon'} size={18} variant="outline" />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddArtist(true)} className="pm-btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
                <Icon name="PlusIcon" size={16} variant="outline" />
                Adicionar Artista
              </button>
            </div>
          </div>

          {/* Stats cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
                  style={{ borderColor: 'var(--cream)', backgroundColor: 'var(--ice)' }}>
                  <div className="w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: 'var(--cream)' }} />
                  <div className="space-y-2 flex-1">
                    <div className="h-2.5 rounded w-3/4" style={{ backgroundColor: 'var(--cream)' }} />
                    <div className="h-5 rounded w-1/2" style={{ backgroundColor: 'var(--cream)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'rgba(194,59,46,0.06)', border: '1px solid rgba(194,59,46,0.2)', color: 'var(--crimson)' }}>
              <Icon name="ExclamationCircleIcon" size={16} variant="outline" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total',       value: stats.total,           icon: 'MusicalNoteIcon',   accent: true  },
                { label: 'Ativos',      value: stats.active,          icon: 'CheckCircleIcon',   accent: false },
                { label: 'Inativos',    value: stats.inactive,        icon: 'PauseCircleIcon',   accent: false },
                { label: 'Arquivados',  value: stats.archived,        icon: 'ArchiveBoxIcon',    accent: false },
                { label: 'Pitches',     value: stats.totalPitches,    icon: 'PaperAirplaneIcon', accent: false },
                { label: 'Aprovados',   value: stats.approvedPitches, icon: 'TrophyIcon',        accent: false },
              ].map((card) => (
                <div key={card.label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--ice)',
                    borderColor: card.accent ? 'var(--ink)' : 'var(--cream)',
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: card.accent ? 'var(--ink)' : 'var(--cream)' }}>
                    <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={18} variant="outline"
                      style={{ color: card.accent ? 'var(--ice)' : 'var(--stone)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider"
                      style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                      {card.label}
                    </p>
                    <p className="text-xl font-bold leading-tight"
                      style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--ink)' }}>
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desktop filters */}
          <div className="space-y-3">
            <div className="hidden md:flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Icon name="MagnifyingGlassIcon" size={16} variant="outline"
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
                <input ref={searchRef} type="text"
                  placeholder="Buscar por nome, gênero, gravadora..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all"
                  style={filterSelectStyle} />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--stone)' }}>
                    <Icon name="XMarkIcon" size={14} variant="outline" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="relative">
                <select value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none cursor-pointer"
                  style={filterSelectStyle}>
                  <option value="">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
                <Icon name="ChevronDownIcon" size={14} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>

              {/* Genre filter */}
              <div className="relative">
                <select value={genreFilter}
                  onChange={(e) => { setGenreFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none cursor-pointer"
                  style={filterSelectStyle}>
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g === 'All Genres' ? '' : g}>{g}</option>
                  ))}
                </select>
                <Icon name="ChevronDownIcon" size={14} variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--stone)' }} />
              </div>

              {/* Sort tabs */}
              <div className="flex items-center gap-1 rounded-lg px-1 py-1"
                style={{ border: '1px solid var(--cream)', backgroundColor: 'var(--ice)' }}>
                {SORT_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => toggleSort(o.value)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all"
                    style={{
                      fontFamily: 'Epilogue, sans-serif',
                      backgroundColor: sortBy === o.value ? 'var(--ink)' : 'transparent',
                      color: sortBy === o.value ? 'var(--ice)' : 'var(--stone)',
                      fontWeight: sortBy === o.value ? 500 : 400,
                    }}>
                    {o.label}
                    {sortBy === o.value && (
                      <Icon name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={10} variant="outline" />
                    )}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg transition-all"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(194,59,46,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Icon name="XCircleIcon" size={14} variant="outline" />
                  Limpar
                </button>
              )}

              <span className="ml-auto text-xs whitespace-nowrap"
                style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                {filteredArtists.length} de {artists.length} artistas
              </span>
            </div>

            {/* Mobile filters */}
            <div className="md:hidden space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon name="MagnifyingGlassIcon" size={16} variant="outline"
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--stone)' }} />
                  <input type="text" placeholder="Buscar artistas..."
                    value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none"
                    style={filterSelectStyle} />
                </div>
                <button onClick={() => setMobileFiltersOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-all min-h-[44px]"
                  style={{
                    fontFamily: 'Epilogue, sans-serif',
                    backgroundColor: mobileFiltersOpen || hasActiveFilters ? 'var(--ink)' : 'var(--ice)',
                    color: mobileFiltersOpen || hasActiveFilters ? 'var(--ice)' : 'var(--stone)',
                    borderColor: mobileFiltersOpen || hasActiveFilters ? 'var(--ink)' : 'var(--cream)',
                  }}
                  aria-label={mobileFiltersOpen ? 'Fechar filtros' : 'Abrir filtros'}>
                  <Icon name="FunnelIcon" size={16} variant="outline" />
                  Filtros
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--blue)' }} />}
                </button>
              </div>

              {mobileFiltersOpen && (
                <div className="p-3 rounded-xl space-y-2 shadow-sm"
                  style={{ border: '1px solid var(--cream)', backgroundColor: 'var(--ice)' }}>
                  {[
                    { value: statusFilter, onChange: (v: string) => { setStatusFilter(v); setCurrentPage(1); },
                      options: [{ v: '', l: 'Todos os Status' }, { v: 'active', l: 'Ativo' }, { v: 'inactive', l: 'Inativo' }, { v: 'archived', l: 'Arquivado' }] },
                    { value: genreFilter, onChange: (v: string) => { setGenreFilter(v); setCurrentPage(1); },
                      options: GENRE_OPTIONS.map((g) => ({ v: g === 'All Genres' ? '' : g, l: g })) },
                  ].map((sel, i) => (
                    <div key={i} className="relative">
                      <select value={sel.value} onChange={(e) => sel.onChange(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-3 text-sm border rounded-lg focus:outline-none min-h-[44px]"
                        style={filterSelectStyle}>
                        {sel.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                      <Icon name="ChevronDownIcon" size={14} variant="outline"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--stone)' }} />
                    </div>
                  ))}

                  <div className="pt-1">
                    <p className="text-xs font-medium uppercase tracking-wider mb-1.5"
                      style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                      Ordenar por
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SORT_OPTIONS.map((o) => (
                        <button key={o.value} onClick={() => toggleSort(o.value)}
                          className="flex items-center justify-between gap-1 px-3 py-2.5 text-xs rounded-lg border transition-all min-h-[40px]"
                          style={{
                            fontFamily: 'Epilogue, sans-serif',
                            backgroundColor: sortBy === o.value ? 'var(--ink)' : 'var(--ice)',
                            borderColor: sortBy === o.value ? 'var(--ink)' : 'var(--cream)',
                            color: sortBy === o.value ? 'var(--ice)' : 'var(--stone)',
                            fontWeight: sortBy === o.value ? 500 : 400,
                          }}>
                          {o.label}
                          {sortBy === o.value && (
                            <Icon name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={10} variant="outline" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-lg transition-all min-h-[44px]"
                      style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(194,59,46,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Icon name="XCircleIcon" size={14} variant="outline" />
                      Limpar Filtros
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                {filteredArtists.length} de {artists.length} artistas
              </p>
            </div>
          </div>

          {/* Bulk selection bar */}
          {selectionMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl"
              style={{ border: '1px solid var(--ink)', backgroundColor: 'rgba(26,26,24,0.04)' }}>
              <div className="flex items-center gap-2">
                <div role="checkbox" aria-checked={selectedIds.size === paginatedArtists.length}
                  aria-label="Selecionar todos nesta página" tabIndex={0}
                  onClick={toggleSelectAll}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSelectAll(); } }}
                  className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer focus:outline-none"
                  style={{ backgroundColor: 'var(--ink)', borderColor: 'var(--ink)' }}>
                  <Icon name="CheckIcon" size={10} variant="solid" style={{ color: 'var(--ice)' }} />
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                  {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                    Definir status:
                  </span>
                  <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as ArtistStatus)}
                    className="text-xs rounded-lg px-2 py-1.5 border focus:outline-none"
                    style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--ice)', borderColor: 'var(--cream)', color: 'var(--ink)' }}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="archived">Arquivado</option>
                  </select>
                  <button onClick={handleBulkStatusChange}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[36px]"
                    style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--ink)', color: 'var(--ice)' }}>
                    <Icon name="ArrowPathIcon" size={12} variant="outline" />
                    Aplicar
                  </button>
                </div>
                <button onClick={handleBulkArchive}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[36px]"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', border: '1px solid var(--cream)', backgroundColor: 'transparent' }}>
                  <Icon name="ArchiveBoxIcon" size={12} variant="outline" />
                  Arquivar Tudo
                </button>
                <button onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[36px]"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', backgroundColor: 'transparent' }}>
                  <Icon name="XMarkIcon" size={12} variant="outline" />
                  Desselecionar
                </button>
              </div>
            </div>
          )}

          {/* Artist Grid / List — skeleton */}
          {isLoading ? (
            <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {Array.from({ length: pageSize }).map((_, i) =>
                viewMode === 'card' ? (
                  <div key={i} className="animate-pulse rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 rounded w-3/4" style={{ backgroundColor: 'var(--cream)' }} />
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--cream)' }} />
                      </div>
                      <div className="h-5 w-14 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-12 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="h-5 w-16 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                    </div>
                    <div className="h-3 rounded w-full" style={{ backgroundColor: 'var(--cream)' }} />
                    <div className="h-3 rounded w-4/5" style={{ backgroundColor: 'var(--cream)' }} />
                    <div className="grid grid-cols-3 gap-2">
                      {[0,1,2].map((j) => <div key={j} className="h-14 rounded-lg" style={{ backgroundColor: 'var(--cream)' }} />)}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-3.5 rounded-xl"
                    style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
                    <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: 'var(--cream)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded w-2/5" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="h-3 rounded w-1/4" style={{ backgroundColor: 'var(--cream)' }} />
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="h-5 w-16 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--cream)' }} />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : paginatedArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(72,108,227,0.08)' }}>
                <Icon name="MusicalNoteIcon" size={28} variant="outline" style={{ color: 'var(--blue)' }} />
              </div>
              <h3 className="text-base font-semibold mb-1"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                {hasActiveFilters ? 'Nenhum artista corresponde aos filtros' : 'Nenhum artista ainda'}
              </h3>
              <p className="text-sm mb-5 max-w-xs"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                {hasActiveFilters
                  ? 'Tente ajustar seus filtros ou termos de busca.'
                  : 'Adicione seu primeiro artista para começar a gerenciar pitches.'}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', border: '1px solid var(--cream)', backgroundColor: 'transparent' }}>
                  <Icon name="XCircleIcon" size={14} variant="outline" />
                  Limpar Filtros
                </button>
              ) : (
                <button onClick={() => setShowAddArtist(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--blue)', color: 'var(--ice)' }}>
                  <Icon name="PlusIcon" size={16} variant="outline" />
                  Adicionar Artista
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedArtists.map((artist) => (
                <ArtistCardView key={artist.id} artist={artist}
                  isSelected={selectedIds.has(artist.id)}
                  onToggleSelect={toggleSelect} selectionMode={selectionMode}
                  onEdit={setEditingArtist} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedArtists.map((artist) => (
                <ArtistListView key={artist.id} artist={artist}
                  isSelected={selectedIds.has(artist.id)}
                  onToggleSelect={toggleSelect} selectionMode={selectionMode}
                  onEdit={setEditingArtist} />
              ))}
            </div>
          )}

          {!isLoading && filteredArtists.length > 0 && (
            <Pagination
              currentPage={safePage} totalPages={totalPages}
              pageSize={pageSize} totalItems={filteredArtists.length}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
          )}
        </div>
      </main>

      {editingArtist && (
        <EditArtistModal artist={editingArtist} onSave={handleSaveArtist} onClose={() => setEditingArtist(null)} />
      )}
      {showAddArtist && (
        <AddArtistModal onSave={handleAddArtist} onClose={() => setShowAddArtist(false)} />
      )}
    </div>
  );
}
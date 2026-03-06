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
  id: string;
  name: string;
  genre: string;
  subGenres: string[];
  status: ArtistStatus;
  avatar: string;
  avatarAlt: string;
  pitchCount: number;
  approvedPitches: number;
  lastActivity: string;
  label: string;
  location: string;
  bio: string;
}

const STATUS_CONFIG: Record<
  ArtistStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: { label: 'Active', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  inactive: { label: 'Inactive', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  archived: { label: 'Archived', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
};

const GENRE_OPTIONS = [
  'All Genres',
  'Pop',
  'Rock',
  'Sertanejo',
  'Funk',
  'MPB',
  'Electronic',
  'Hip-Hop',
  'Gospel',
];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'genre', label: 'Genre' },
  { value: 'status', label: 'Status' },
  { value: 'activity', label: 'Activity' },
  { value: 'pitches', label: 'Pitches' },
];

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

function StatusBadge({ status }: { status: ArtistStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Edit Artist Modal ───────────────────────────────────────────────────────

interface EditArtistModalProps {
  artist: Artist;
  onSave: (updated: Artist) => void;
  onClose: () => void;
}

function EditArtistModal({ artist, onSave, onClose }: EditArtistModalProps) {
  const [form, setForm] = useState<Artist>({ ...artist });
  const [subGenresRaw, setSubGenresRaw] = useState(artist.subGenres.join(', '));
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof Artist, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Artist = {
      ...form,
      subGenres: subGenresRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setSaving(true);
    await onSave(updated);
    setSaving(false);
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${artist.name}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon name="PencilSquareIcon" size={18} variant="outline" className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit Artist</h2>
              <p className="text-xs text-gray-400">{artist.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Artist Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputCls}
                placeholder="Artist name"
              />
            </div>

            <div>
              <label className={labelCls}>Genre</label>
              <div className="relative">
                <select
                  value={form.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                >
                  {[
                    'Pop',
                    'Rock',
                    'Sertanejo',
                    'Funk',
                    'MPB',
                    'Electronic',
                    'Hip-Hop',
                    'Gospel',
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={13}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as ArtistStatus)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={13}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                Sub-genres <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={subGenresRaw}
                onChange={(e) => setSubGenresRaw(e.target.value)}
                className={inputCls}
                placeholder="e.g. tropical, electronic, dance"
              />
            </div>

            <div>
              <label className={labelCls}>Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className={inputCls}
                placeholder="Record label"
              />
            </div>

            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={inputCls}
                placeholder="City, State"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className={inputCls + ' resize-none'}
                placeholder="Short artist biography"
              />
            </div>

            <div>
              <label className={labelCls}>Avatar URL</label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className={labelCls}>Avatar Alt Text</label>
              <input
                type="text"
                value={form.avatarAlt}
                onChange={(e) => handleChange('avatarAlt', e.target.value)}
                className={inputCls}
                placeholder="Describe the image"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-60"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="CheckIcon" size={14} variant="outline" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Artist Modal ────────────────────────────────────────────────────────

interface NewArtistForm {
  name: string;
  genre: string;
  subGenres: string;
  status: ArtistStatus;
  label: string;
  location: string;
  bio: string;
}

function AddArtistModal({
  onSave,
  onClose,
}: {
  onSave: (form: NewArtistForm) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewArtistForm>({
    name: '',
    genre: 'Pop',
    subGenres: '',
    status: 'active',
    label: '',
    location: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSpotify, setShowSpotify] = useState(false);

  const handleChange = (field: keyof NewArtistForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const err = await onSave(form);
    setSaving(false);
    if (err) setSaveError(err);
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Add new artist"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Icon name="PlusIcon" size={18} variant="outline" className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add Artist</h2>
              <p className="text-xs text-gray-400">Create a new artist profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSpotify(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg"
              style={{ background: '#1DB954', color: 'white' }}
            >
              Spotify
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              aria-label="Close modal"
            >
              <Icon name="XMarkIcon" size={18} variant="outline" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Artist Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputCls}
                placeholder="Artist name"
                autoFocus
              />
            </div>

            <div>
              <label className={labelCls}>Genre</label>
              <div className="relative">
                <select
                  value={form.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                >
                  {[
                    'Pop',
                    'Rock',
                    'Sertanejo',
                    'Funk',
                    'MPB',
                    'Electronic',
                    'Hip-Hop',
                    'Gospel',
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={13}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as ArtistStatus)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={13}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                Sub-genres <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.subGenres}
                onChange={(e) => handleChange('subGenres', e.target.value)}
                className={inputCls}
                placeholder="e.g. tropical, electronic, dance"
              />
            </div>

            <div>
              <label className={labelCls}>Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className={inputCls}
                placeholder="Record label"
              />
            </div>

            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={inputCls}
                placeholder="City, State"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className={inputCls + ' resize-none'}
                rows={3}
                placeholder="Short artist bio..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            {saveError && <p className="text-xs text-red-500 mr-auto">{saveError}</p>}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="PlusIcon" size={15} variant="outline" />
                  Add Artist
                </>
              )}
            </button>
          </div>
        </form>
        {showSpotify && (
          <SpotifyArtistSearch
            initialQuery={form.name}
            onSelect={(data: any) => {
              if (data.name) handleChange('name', data.name);
              if (data.genre) handleChange('genre', data.genre);
              if (data.bio) handleChange('bio', data.bio);
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

// ─── Card View ───────────────────────────────────────────────────────────────

function ArtistCardView({
  artist,
  isSelected,
  onToggleSelect,
  selectionMode,
  onEdit,
}: {
  artist: Artist;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
  onEdit: (artist: Artist) => void;
}) {
  const approvalRate =
    artist.pitchCount > 0 ? Math.round((artist.approvedPitches / artist.pitchCount) * 100) : 0;
  return (
    <div
      className={`group relative bg-white border rounded-xl p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer ${
        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100'
      }`}
      onDoubleClick={() => onEdit(artist)}
      title="Double-click to edit"
    >
      <div
        className={`absolute top-3 left-3 z-10 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={isSelected ? `Deselect ${artist.name}` : `Select ${artist.name}`}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(artist.id);
          }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleSelect(artist.id);
            }
          }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
            isSelected
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-300 hover:border-gray-500'
          }`}
        >
          {isSelected && <Icon name="CheckIcon" size={10} variant="solid" className="text-white" />}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-100">
            <AppImage
              src={artist.avatar}
              alt={artist.avatarAlt}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{artist.name}</h3>
            <p className="text-xs text-gray-400 truncate">{artist.location}</p>
          </div>
        </div>
        <StatusBadge status={artist.status} />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
          {artist.genre}
        </span>
        {artist.subGenres.slice(0, 2).map((g) => (
          <span key={g} className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">
            #{g}
          </span>
        ))}
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{artist.bio}</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <p className="text-base font-bold text-gray-900">{artist.pitchCount}</p>
          <p className="text-xs text-gray-400">Pitches</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <p className="text-base font-bold text-gray-900">{artist.approvedPitches}</p>
          <p className="text-xs text-gray-400">Approved</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <p className="text-base font-bold text-gray-900">{approvalRate}%</p>
          <p className="text-xs text-gray-400">Rate</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400 font-mono">{artist.lastActivity}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/artist-detail-management?artistId=${artist.id}`}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            aria-label={`View profile for ${artist.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="UserIcon" size={13} variant="outline" />
          </Link>
          <Link
            href="/pitch-creation-workflow"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            aria-label={`Create pitch for ${artist.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="PaperAirplaneIcon" size={13} variant="outline" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(artist);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            aria-label={`Edit ${artist.name}`}
          >
            <Icon name="PencilSquareIcon" size={13} variant="outline" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List View ───────────────────────────────────────────────────────────────

function ArtistListView({
  artist,
  isSelected,
  onToggleSelect,
  selectionMode,
  onEdit,
}: {
  artist: Artist;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
  onEdit: (artist: Artist) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3.5 bg-white border rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer ${
        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100'
      }`}
      onDoubleClick={() => onEdit(artist)}
      title="Double-click to edit"
    >
      <div
        className={`shrink-0 transition-all ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={isSelected ? `Deselect ${artist.name}` : `Select ${artist.name}`}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(artist.id);
          }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleSelect(artist.id);
            }
          }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
            isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
          }`}
        >
          {isSelected && <Icon name="CheckIcon" size={10} variant="solid" className="text-white" />}
        </div>
      </div>

      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
        <AppImage
          src={artist.avatar}
          alt={artist.avatarAlt}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{artist.name}</p>
          <span className="text-xs text-gray-400">·</span>
          <p className="text-xs text-gray-500 truncate">{artist.location}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {artist.genre}
          </span>
          {artist.subGenres.slice(0, 2).map((g) => (
            <span key={g} className="text-xs text-gray-400">
              #{g}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{artist.pitchCount}</p>
          <p className="text-xs text-gray-400">pitches</p>
        </div>
        <StatusBadge status={artist.status} />
        <span className="text-xs text-gray-400 font-mono w-20 text-right">
          {artist.lastActivity}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link
          href={`/artist-detail-management?artistId=${artist.id}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          aria-label={`View profile for ${artist.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="UserIcon" size={14} variant="outline" />
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(artist);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          aria-label={`Edit ${artist.name}`}
        >
          <Icon name="PencilSquareIcon" size={14} variant="outline" />
        </button>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
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

  return (
    <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-gray-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          {totalItems === 0 ? 'No results' : `${startItem}\u2013${endItem} of ${totalItems}`}
        </span>
        <div className="flex items-center gap-1.5">
          <label
            className="text-xs text-gray-400"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            Per page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
            className="text-xs rounded-lg px-2 py-1.5 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-1 flex-wrap"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
          >
            <Icon name="ChevronLeftIcon" size={13} variant="outline" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-xs text-gray-400">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`min-w-[36px] min-h-[36px] px-2.5 py-2 rounded-lg text-xs border transition-all ${
                  currentPage === page
                    ? 'bg-gray-900 border-gray-900 text-white font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[44px] justify-center"
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="ChevronRightIcon" size={13} variant="outline" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArtistsListingDashboard() {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('activity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ArtistStatus>('inactive');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  const fetchArtists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        setIsLoading(false);
        return;
      }

      const { data: artistRows, error: artistError } = await supabase
        .from('artists')
        .select('id, name, genre, sub_genres, status, label, location, bio, avatar_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (artistError) throw artistError;
      if (!artistRows) {
        setArtists([]);
        setIsLoading(false);
        return;
      }

      const { data: pitchRows } = await supabase
        .from('pitches')
        .select('artist_id, status, updated_at')
        .eq('user_id', user.id);

      const mapped: Artist[] = artistRows.map((row) => {
        const artistPitches = (pitchRows || []).filter((p) => p.artist_id === row.id);
        const approvedPitches = artistPitches.filter((p) =>
          ['approved', 'placed'].includes(p.status)
        ).length;
        const lastPitch = artistPitches.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        const lastActivityDate = lastPitch
          ? new Date(lastPitch.updated_at)
          : new Date(row.created_at);
        const lastActivity = lastActivityDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        return {
          id: row.id,
          name: row.name,
          genre: row.genre || '',
          subGenres: row.sub_genres || [],
          status: (row.status as ArtistStatus) || 'active',
          avatar: row.avatar_url || '',
          avatarAlt: `${row.name} artist photo`,
          pitchCount: artistPitches.length,
          approvedPitches,
          lastActivity,
          label: row.label || '',
          location: row.location || '',
          bio: row.bio || '',
        };
      });

      setArtists(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load artists');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('artists-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'artists', filter: `user_id=eq.${user.id}` },
          () => {
            fetchArtists();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pitches', filter: `user_id=eq.${user.id}` },
          () => {
            fetchArtists();
          }
        )
        .subscribe();
    };

    setupRealtime();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchArtists]);

  const handleSaveArtist = async (updated: Artist) => {
    try {
      const { error: updateError } = await supabase
        .from('artists')
        .update({
          name: updated.name,
          genre: updated.genre,
          sub_genres: updated.subGenres,
          status: updated.status,
          label: updated.label,
          location: updated.location,
          bio: updated.bio,
          avatar_url: updated.avatar,
        })
        .eq('id', updated.id);
      if (updateError) throw updateError;
      setArtists((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('Artist saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save artist', 'error');
    }
    setEditingArtist(null);
  };

  const handleAddArtist = async (form: NewArtistForm): Promise<string | null> => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) return 'You must be logged in to add an artist.';
      const { error: insertError } = await supabase.from('artists').insert({
        user_id: user.id,
        name: form.name,
        genre: form.genre,
        sub_genres: form.subGenres
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status: form.status,
        label: form.label || null,
        location: form.location || null,
        bio: form.bio || null,
      });
      if (insertError) {
        showToast(insertError.message || 'Failed to add artist', 'error');
        return insertError.message;
      }
      setShowAddArtist(false);
      await fetchArtists();
      return null;
    } catch (err: any) {
      showToast(err.message || 'Unexpected error. Please try again.', 'error');
      return err.message ?? 'Unexpected error. Please try again.';
    }
  };

  const filteredArtists = useMemo(() => {
    let result = [...artists];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.genre.toLowerCase().includes(q) ||
          a.subGenres.some((g) => g.toLowerCase().includes(q)) ||
          a.label.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (genreFilter && genreFilter !== 'All Genres')
      result = result.filter((a) => a.genre === genreFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'genre') cmp = a.genre.localeCompare(b.genre);
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'pitches') cmp = a.pitchCount - b.pitchCount;
      else {
        const parseDate = (d: string) => {
          const [day, month, year] = d.split('/');
          return new Date(+year, +month - 1, +day).getTime();
        };
        cmp = parseDate(a.lastActivity) - parseDate(b.lastActivity);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [artists, search, statusFilter, genreFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArtists = filteredArtists.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(
    () => ({
      total: artists.length,
      active: artists.filter((a) => a.status === 'active').length,
      inactive: artists.filter((a) => a.status === 'inactive').length,
      archived: artists.filter((a) => a.status === 'archived').length,
      totalPitches: artists.reduce((s, a) => s + a.pitchCount, 0),
      approvedPitches: artists.reduce((s, a) => s + a.approvedPitches, 0),
    }),
    [artists]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const handleBulkStatusChange = async () => {
    const ids = Array.from(selectedIds);
    try {
      const { error: bulkError } = await supabase
        .from('artists')
        .update({ status: bulkStatus })
        .in('id', ids);
      if (bulkError) throw bulkError;
      setArtists((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a))
      );
      showToast(`Status updated to "${bulkStatus}" for ${ids.length} artist(s)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Bulk status update failed', 'error');
    }
    setSelectedIds(new Set());
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    try {
      const { error: archiveError } = await supabase
        .from('artists')
        .update({ status: 'archived' })
        .in('id', ids);
      if (archiveError) throw archiveError;
      setArtists((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: 'archived' as ArtistStatus } : a))
      );
      showToast(`${ids.length} artist(s) archived`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Bulk archive failed', 'error');
    }
    setSelectedIds(new Set());
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setGenreFilter('');
    setSortBy('activity');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    search ||
    statusFilter ||
    (genreFilter && genreFilter !== 'All Genres')
  );
  const selectionMode = selectedIds.size > 0;

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 md:ml-56 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="pm-kicker">Management</p>
              <h1 className="pm-h1">Artists</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white p-1 gap-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  aria-label="Card view"
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'card'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon name="Squares2X2Icon" size={18} variant="outline" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon name="ListBulletIcon" size={18} variant="outline" />
                </button>
              </div>
              <button
                onClick={() => setShowAddArtist(true)}
                className="pm-btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
              >
                <Icon name="PlusIcon" size={16} variant="outline" />
                Add Artist
              </button>
            </div>
          </div>

          {/* Metric Cards — skeleton while loading */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              <Icon name="ExclamationCircleIcon" size={16} variant="outline" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  label: 'Total Artists',
                  value: stats.total,
                  icon: 'MusicalNoteIcon',
                  accent: true,
                },
                { label: 'Active', value: stats.active, icon: 'CheckCircleIcon', accent: false },
                {
                  label: 'Inactive',
                  value: stats.inactive,
                  icon: 'PauseCircleIcon',
                  accent: false,
                },
                { label: 'Archived', value: stats.archived, icon: 'ArchiveBoxIcon', accent: false },
                {
                  label: 'Total Pitches',
                  value: stats.totalPitches,
                  icon: 'PaperAirplaneIcon',
                  accent: false,
                },
                {
                  label: 'Approved',
                  value: stats.approvedPitches,
                  icon: 'TrophyIcon',
                  accent: false,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white"
                  style={{ borderColor: card.accent ? 'var(--color-foreground)' : '#e5e7eb' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: card.accent ? 'var(--color-foreground)' : '#f3f4f6' }}
                  >
                    <Icon
                      name={card.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      variant="outline"
                      className={card.accent ? 'text-white' : 'text-gray-500'}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs text-gray-400 font-medium uppercase tracking-wider"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    >
                      {card.label}
                    </p>
                    <p
                      className="text-xl font-bold text-gray-900 leading-tight"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="hidden md:flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={16}
                  variant="outline"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search artists by name, genre, label..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="XMarkIcon" size={14} variant="outline" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={14}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <div className="relative">
                <select
                  value={genreFilter}
                  onChange={(e) => {
                    setGenreFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g === 'All Genres' ? '' : g}>
                      {g}
                    </option>
                  ))}
                </select>
                <Icon
                  name="ChevronDownIcon"
                  size={14}
                  variant="outline"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-white px-1 py-1">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => toggleSort(o.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all ${
                      sortBy === o.value
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {o.label}
                    {sortBy === o.value && (
                      <Icon
                        name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'}
                        size={10}
                        variant="outline"
                      />
                    )}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Icon name="XCircleIcon" size={14} variant="outline" />
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                {filteredArtists.length} of {artists.length} artists
              </span>
            </div>

            <div className="md:hidden space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon
                    name="MagnifyingGlassIcon"
                    size={16}
                    variant="outline"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search artists..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setMobileFiltersOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-all min-h-[44px] ${
                    mobileFiltersOpen || hasActiveFilters
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                  aria-label={mobileFiltersOpen ? 'Close filters' : 'Open filters'}
                >
                  <Icon name="FunnelIcon" size={16} variant="outline" />
                  Filters
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
              </div>
              {mobileFiltersOpen && (
                <div className="p-3 border border-gray-200 rounded-xl bg-white space-y-2 shadow-sm">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full appearance-none pl-3 pr-8 py-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none min-h-[44px]"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                    <Icon
                      name="ChevronDownIcon"
                      size={14}
                      variant="outline"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={genreFilter}
                      onChange={(e) => {
                        setGenreFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full appearance-none pl-3 pr-8 py-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none min-h-[44px]"
                    >
                      {GENRE_OPTIONS.map((g) => (
                        <option key={g} value={g === 'All Genres' ? '' : g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="ChevronDownIcon"
                      size={14}
                      variant="outline"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <div className="pt-1">
                    <p
                      className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    >
                      Sort by
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SORT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => toggleSort(o.value)}
                          className={`flex items-center justify-between gap-1 px-3 py-2.5 text-xs rounded-lg border transition-all min-h-[40px] ${
                            sortBy === o.value
                              ? 'bg-gray-900 text-white border-gray-900 font-medium'
                              : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {o.label}
                          {sortBy === o.value && (
                            <Icon
                              name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'}
                              size={10}
                              variant="outline"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[44px]"
                    >
                      <Icon name="XCircleIcon" size={14} variant="outline" />
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400">
                {filteredArtists.length} of {artists.length} artists
              </p>
            </div>
          </div>

          {selectionMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl border border-gray-900 bg-gray-50">
              <div className="flex items-center gap-2">
                <div
                  role="checkbox"
                  aria-checked={selectedIds.size === paginatedArtists.length}
                  aria-label="Select all on this page"
                  tabIndex={0}
                  onClick={toggleSelectAll}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleSelectAll();
                    }
                  }}
                  className="w-4 h-4 rounded border-2 border-gray-900 bg-gray-900 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <Icon name="CheckIcon" size={10} variant="solid" className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Set status:</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as ArtistStatus)}
                    className="text-xs rounded-lg px-2 py-1.5 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={handleBulkStatusChange}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-all min-h-[36px]"
                  >
                    <Icon name="ArrowPathIcon" size={12} variant="outline" />
                    Apply
                  </button>
                </div>
                <button
                  onClick={handleBulkArchive}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-all min-h-[36px]"
                >
                  <Icon name="ArchiveBoxIcon" size={12} variant="outline" />
                  Archive All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all min-h-[36px]"
                >
                  <Icon name="XMarkIcon" size={12} variant="outline" />
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Artist Grid / List — skeleton while loading */}
          {isLoading ? (
            <div
              className={
                viewMode === 'card'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-2'
              }
            >
              {Array.from({ length: pageSize }).map((_, i) =>
                viewMode === 'card' ? (
                  <div
                    key={i}
                    className="animate-pulse bg-white border border-gray-100 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                      <div className="h-5 w-14 bg-gray-200 rounded-full" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-12 bg-gray-200 rounded-full" />
                      <div className="h-5 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-14 bg-gray-100 rounded-lg" />
                      <div className="h-14 bg-gray-100 rounded-lg" />
                      <div className="h-14 bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="animate-pulse flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-100 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : /* Empty state */
          paginatedArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Icon
                  name="MusicalNoteIcon"
                  size={28}
                  variant="outline"
                  className="text-purple-400"
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {hasActiveFilters ? 'No artists match your filters' : 'No artists yet'}
              </h3>
              <p className="text-sm text-gray-400 mb-5 max-w-xs">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : 'Add your first artist to start tracking pitches and managing your music roster.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-gray-600"
                >
                  <Icon name="XCircleIcon" size={14} variant="outline" />
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowAddArtist(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  <Icon name="PlusIcon" size={16} variant="outline" />+ Add Artist
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedArtists.map((artist) => (
                <ArtistCardView
                  key={artist.id}
                  artist={artist}
                  isSelected={selectedIds.has(artist.id)}
                  onToggleSelect={toggleSelect}
                  selectionMode={selectionMode}
                  onEdit={setEditingArtist}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedArtists.map((artist) => (
                <ArtistListView
                  key={artist.id}
                  artist={artist}
                  isSelected={selectedIds.has(artist.id)}
                  onToggleSelect={toggleSelect}
                  selectionMode={selectionMode}
                  onEdit={setEditingArtist}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredArtists.length > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredArtists.length}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </main>

      {editingArtist && (
        <EditArtistModal
          artist={editingArtist}
          onSave={handleSaveArtist}
          onClose={() => setEditingArtist(null)}
        />
      )}
      {showAddArtist && (
        <AddArtistModal onSave={handleAddArtist} onClose={() => setShowAddArtist(false)} />
      )}
    </div>
  );
}

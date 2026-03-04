'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

export interface SpotifyArtistResult {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  images: { url: string; width: number; height: number }[];
  spotifyUrl: string;
}

export interface SpotifyFetchedData {
  name: string;
  genre: string;
  followers: number;
  popularity: number;
  imageUrl: string;
  spotifyUrl: string;
  spotifyId: string;
}

interface SpotifyArtistSearchProps {
  initialQuery?: string;
  onSelect: (data: SpotifyFetchedData) => void;
  onClose: () => void;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function PopularityBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: value >= 70 ? '#1DB954' : value >= 40 ? '#f59e0b' : 'var(--color-muted-foreground)',
          }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--color-muted-foreground)', minWidth: '2rem' }}>
        {value}
      </span>
    </div>
  );
}

export default function SpotifyArtistSearch({ initialQuery = '', onSelect, onClose }: SpotifyArtistSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SpotifyArtistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResults(data.artists ?? []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to search Spotify');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query);
    }
    if (e.key === 'Escape') onClose();
  };

  const handleSelect = (artist: SpotifyArtistResult) => {
    const bestImage = artist.images.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
    onSelect({
      name: artist.name,
      genre: artist.genres[0] ?? '',
      followers: artist.followers,
      popularity: artist.popularity,
      imageUrl: bestImage?.url ?? '',
      spotifyUrl: artist.spotifyUrl,
      spotifyId: artist.id,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            {/* Spotify logo mark */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#1DB954' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Spotify</p>
              <h2 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Fetch Artist Metadata</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pm-btn p-2"
            aria-label="Close Spotify search"
          >
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={16}
              variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Icon name="ArrowPathIcon" size={15} variant="outline" className="animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              className="pm-input pl-9 pr-9 text-sm"
              placeholder="Search artist name on Spotify…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search Spotify artists"
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Press Enter to search · Select a result to populate artist fields
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {error && (
            <div className="px-5 py-4">
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                <Icon name="ExclamationCircleIcon" size={16} variant="outline" className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Search failed</p>
                  <p className="text-xs mt-0.5 opacity-80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <Icon name="MusicalNoteIcon" size={32} variant="outline" className="mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>No artists found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Try a different search term</p>
            </div>
          )}

          {!loading && !error && !searched && query.trim() === '' && (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: '#f0fdf4' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954" aria-hidden="true">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Search Spotify</p>
              <p className="text-xs mt-1 text-center" style={{ color: 'var(--color-muted-foreground)' }}>Type an artist name to fetch their metadata, genre, follower count, and artwork</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-3 space-y-2">
              {results.map((artist) => {
                const thumb = artist.images.sort((a, b) => (a.width ?? 0) - (b.width ?? 0))[0];
                const primaryGenre = artist.genres[0];
                return (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => handleSelect(artist)}
                    className="w-full text-left rounded-xl px-3 py-3 transition-all group"
                    style={{
                      background: 'var(--color-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#1DB954';
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-card)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)';
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Artwork */}
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 overflow-hidden"
                        style={{ background: 'var(--color-border)' }}
                      >
                        {thumb?.url ? (
                          <img
                            src={thumb.url}
                            alt={`${artist.name} profile photo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="MusicalNoteIcon" size={20} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                            {artist.name}
                          </p>
                          {primaryGenre && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
                            >
                              {primaryGenre}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                            <Icon name="UsersIcon" size={11} variant="outline" />
                            {formatFollowers(artist.followers)}
                          </span>
                          <div className="flex-1 max-w-[120px]">
                            <PopularityBar value={artist.popularity} />
                          </div>
                        </div>
                        {artist.genres.length > 1 && (
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                            {artist.genres.slice(1, 4).join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Select arrow */}
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: '#1DB954' }}
                        >
                          <Icon name="CheckIcon" size={14} variant="solid" style={{ color: 'white' }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-muted)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Data provided by Spotify Web API
          </p>
          <button onClick={onClose} className="pm-btn text-xs px-3 py-1.5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

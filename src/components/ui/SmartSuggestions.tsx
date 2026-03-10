'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { artistStore, contactStore, pitchStore, pitchRecipientStore } from '@/lib/store';
import type { Artist, Contact, Pitch } from '@/lib/types';

export type SuggestionType = 'inactive-contact' | 'unreleased-tracks' | 'similar-placement';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  body: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  pitchContext?: {
    artistId?: string;
    contactId?: string;
  };
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

async function generateSuggestions(filterArtistId?: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const [artists, contacts, pitches, recipients] = await Promise.all([
    artistStore.getAll(),
    contactStore.getAll(),
    pitchStore.getAll(),
    pitchRecipientStore.getAll(),
  ]);

  const now = Date.now();
  const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

  // Suggestion 1: Inactive contacts
  contacts.forEach((contact) => {
    const contactPitchIds = recipients
      .filter((r) => r.contactId === contact.id)
      .map((r) => r.pitchId);

    if (contactPitchIds.length === 0) {
      suggestions.push({
        id: `inactive-${contact.id}`,
        type: 'inactive-contact',
        title: 'Reconnect with contact',
        body: `You haven't pitched to ${contact.fullName} at ${contact.company} yet — a great opportunity to reach out.`,
        icon: 'ClockIcon',
        iconColor: '#B8622A',
        iconBg: 'rgba(184,98,42,0.1)',
        pitchContext: { contactId: contact.id },
        primaryAction: { label: 'Pitch now', href: '/pitch-creation-workflow' },
        secondaryAction: { label: 'View contact', href: '/contacts' },
      });
    } else {
      const lastPitch = pitches
        .filter((p) => contactPitchIds.includes(p.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (lastPitch) {
        const elapsed = now - new Date(lastPitch.createdAt).getTime();
        if (elapsed >= THREE_MONTHS_MS) {
          const months = Math.floor(elapsed / (30 * 24 * 60 * 60 * 1000));
          suggestions.push({
            id: `inactive-${contact.id}`,
            type: 'inactive-contact',
            title: 'Inactive contact',
            body: `You haven't pitched to ${contact.fullName} (${contact.company}) in ${months} month${months !== 1 ? 's' : ''} — time to reconnect.`,
            icon: 'ClockIcon',
            iconColor: '#B8622A',
            iconBg: 'rgba(184,98,42,0.1)',
            pitchContext: { contactId: contact.id },
            primaryAction: { label: 'Pitch now', href: '/pitch-creation-workflow' },
            secondaryAction: { label: 'View contact', href: '/contacts' },
          });
        }
      }
    }
  });

  // Suggestion 2: Artists with no recent pitches
  const targetArtists = filterArtistId
    ? artists.filter((a) => a.id === filterArtistId)
    : artists;

  targetArtists.forEach((artist) => {
    const artistPitches = pitches.filter((p) => p.artistId === artist.id);
    const draftCount = artistPitches.filter((p) => p.status === 'draft').length;
    const totalCount = artistPitches.length;

    if (draftCount >= 2) {
      suggestions.push({
        id: `unreleased-${artist.id}`,
        type: 'unreleased-tracks',
        title: 'Tracks ready to pitch',
        body: `${artist.name} has ${draftCount} draft pitch${draftCount !== 1 ? 'es' : ''} waiting — time to send them out.`,
        icon: 'MusicalNoteIcon',
        iconColor: '#486CE3',
        iconBg: 'rgba(72,108,227,0.1)',
        pitchContext: { artistId: artist.id },
        primaryAction: { label: 'Pitch now', href: '/pitch-creation-workflow' },
        secondaryAction: { label: 'View artist', href: `/artist-detail-management?artistId=${artist.id}` },
      });
    } else if (totalCount === 0) {
      suggestions.push({
        id: `unreleased-${artist.id}`,
        type: 'unreleased-tracks',
        title: 'Artist not yet pitched',
        body: `${artist.name} hasn't been pitched to anyone yet — create their first pitch to get started.`,
        icon: 'MusicalNoteIcon',
        iconColor: '#486CE3',
        iconBg: 'rgba(72,108,227,0.1)',
        pitchContext: { artistId: artist.id },
        primaryAction: { label: 'Create pitch', href: '/pitch-creation-workflow' },
        secondaryAction: { label: 'View artist', href: `/artist-detail-management?artistId=${artist.id}` },
      });
    }
  });

  // Suggestion 3: Similar artist placements
  const placedPitches = pitches.filter((p) => p.status === 'approved');
  placedPitches.forEach((placed) => {
    const placedArtist = artists.find((a) => a.id === placed.artistId);
    if (!placedArtist) return;

    const placedRecipients = recipients
      .filter((r) => r.pitchId === placed.id)
      .map((r) => contacts.find((c) => c.id === r.contactId))
      .filter(Boolean) as Contact[];

    if (placedRecipients.length === 0) return;

    const similarArtists = artists.filter(
      (a) =>
        a.id !== placedArtist.id &&
        a.genre &&
        placedArtist.genre &&
        a.genre.toLowerCase() === placedArtist.genre.toLowerCase() &&
        (!filterArtistId || a.id === filterArtistId)
    );

    similarArtists.slice(0, 1).forEach((similar) => {
      const contact = placedRecipients[0];
      if (!contact) return;
      suggestions.push({
        id: `similar-${similar.id}-${placed.id}`,
        type: 'similar-placement',
        title: 'Similar artist placed',
        body: `${placedArtist.name} was placed with ${contact.fullName} (${contact.company}) — ${similar.name} has a similar sound and might be a great fit too.`,
        icon: 'SparklesIcon',
        iconColor: '#4E5E2E',
        iconBg: 'rgba(78,94,46,0.1)',
        pitchContext: { artistId: similar.id, contactId: contact.id },
        primaryAction: { label: 'Pitch now', href: '/pitch-creation-workflow' },
        secondaryAction: { label: 'View artist', href: `/artist-detail-management?artistId=${similar.id}` },
      });
    });
  });

  const seen = new Set<string>();
  return suggestions.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

interface SmartSuggestionsProps {
  artistId?: string;
  maxVisible?: number;
  context?: string;
  onPitchNow?: (context: { artistId?: string; contactId?: string }) => void;
}

export default function SmartSuggestions({ artistId, maxVisible = 3, context = 'Insights', onPitchNow }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    generateSuggestions(artistId).then(setAllSuggestions);
  }, [artistId, refreshKey]);

  const visible = allSuggestions.filter((s) => !dismissed.has(s.id)).slice(0, maxVisible);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  const refresh = useCallback(() => {
    setDismissed(new Set());
    setRefreshKey((k) => k + 1);
  }, []);

  if (allSuggestions.length === 0) return null;

  return (
    <div key={refreshKey} className="pm-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="pm-kicker mb-0">{context}</p>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>
            Smart Suggestions
          </h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="pm-btn p-1.5 flex items-center gap-1 text-xs"
          style={{ color: 'var(--stone)' }}
          title="Refresh suggestions"
          aria-label="Refresh suggestions"
        >
          <Icon name="ArrowPathIcon" size={14} variant="outline" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Suggestion Cards */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--cream)' }}
          >
            <Icon name="CheckCircleIcon" size={20} variant="outline" style={{ color: 'var(--stone)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>
            All caught up! No suggestions right now.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="pm-btn text-xs py-1 px-3 flex items-center gap-1"
          >
            <Icon name="ArrowPathIcon" size={12} variant="outline" />
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ border: '1px solid var(--cream)', backgroundColor: 'var(--ice)' }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: s.iconBg }}
              >
                <Icon name={s.icon as any} size={15} variant="outline" style={{ color: s.iconColor }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}
                >
                  {s.title}
                </p>
                <p
                  className="text-xs leading-relaxed mb-2"
                  style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}
                >
                  {s.body}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {s.primaryAction && (
                    onPitchNow ? (
                      <button
                        type="button"
                        onClick={() => onPitchNow(s.pitchContext ?? {})}
                        className="pm-btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Icon name="PaperAirplaneIcon" size={11} variant="outline" />
                        {s.primaryAction.label}
                      </button>
                    ) : (
                      <Link
                        href={s.primaryAction.href}
                        className="pm-btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Icon name="PaperAirplaneIcon" size={11} variant="outline" />
                        {s.primaryAction.label}
                      </Link>
                    )
                  )}
                  {s.secondaryAction && (
                    <Link
                      href={s.secondaryAction.href}
                      className="pm-btn text-xs py-1 px-2.5 inline-flex items-center gap-1"
                    >
                      <Icon name="ArrowRightIcon" size={11} variant="outline" />
                      {s.secondaryAction.label}
                    </Link>
                  )}
                </div>
              </div>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => dismiss(s.id)}
                className="pm-btn p-1 shrink-0 mt-0.5"
                aria-label="Dismiss suggestion"
                title="Dismiss"
              >
                <Icon name="XMarkIcon" size={13} variant="outline" style={{ color: 'var(--stone)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {allSuggestions.filter((s) => !dismissed.has(s.id)).length > maxVisible && (
        <p
          className="text-xs mt-3 text-center"
          style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}
        >
          +{allSuggestions.filter((s) => !dismissed.has(s.id)).length - maxVisible} more suggestion{allSuggestions.filter((s) => !dismissed.has(s.id)).length - maxVisible !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
}
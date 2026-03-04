'use client';

import type { Artist, Contact, ArtistRecipientLink, Pitch, PitchRecipient } from './types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

const KEYS = {
  artists: 'pm_artists',
  contacts: 'pm_contacts',
  links: 'pm_artist_recipient_links',
  pitches: 'pm_pitches',
  pitchRecipients: 'pm_pitch_recipients',
};

const seedArtists: Artist[] = [
  { id: 'a1', name: 'Mariana Luz', notes: 'Pop artist, 500k followers', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'a2', name: 'Trio Nordestino', notes: 'Sertanejo group', createdAt: '2026-01-15T10:00:00Z' },
];

const seedContacts: Contact[] = [
  { id: 'c1', fullName: 'Carlos Mendes', email: 'carlos@sonymusicbr.com', role: 'A&R', company: 'Sony Music Brasil', phone: '+55 11 99999-0001', notes: '', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'c2', fullName: 'Ana Ferreira', email: 'ana@universalmusic.com', role: 'Manager', company: 'Universal Music', phone: '+55 11 99999-0002', notes: '', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'c3', fullName: 'Roberto Lima', email: 'roberto@warnermusic.com', role: 'Publisher', company: 'Warner Music', phone: '+55 11 99999-0003', notes: '', createdAt: '2026-01-10T10:00:00Z' },
];

const seedLinks: ArtistRecipientLink[] = [
  { id: 'l1', artistId: 'a1', contactId: 'c1', relationshipType: 'A&R', isPrimary: true },
  { id: 'l2', artistId: 'a1', contactId: 'c2', relationshipType: 'Manager', isPrimary: false },
  { id: 'l3', artistId: 'a2', contactId: 'c2', relationshipType: 'Manager', isPrimary: true },
  { id: 'l4', artistId: 'a2', contactId: 'c3', relationshipType: 'Publisher', isPrimary: false },
];

const seedPitches: Pitch[] = [
  { id: 'p1', title: 'Summer Single 2026', artistId: 'a1', trackUrl: 'https://soundcloud.com/example', status: 'sent', notes: 'Hot track for summer playlists', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'p2', title: 'Roots EP Submission', artistId: 'a2', trackUrl: '', status: 'draft', notes: '', createdAt: '2026-02-10T10:00:00Z' },
];

const seedPitchRecipients: PitchRecipient[] = [
  { id: 'pr1', pitchId: 'p1', contactId: 'c1' },
  { id: 'pr2', pitchId: 'p1', contactId: 'c2' },
];

function initIfEmpty<T>(key: string, seed: T[]): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(key)) save(key, seed);
}

export function initStore(): void {
  initIfEmpty(KEYS.artists, seedArtists);
  initIfEmpty(KEYS.contacts, seedContacts);
  initIfEmpty(KEYS.links, seedLinks);
  initIfEmpty(KEYS.pitches, seedPitches);
  initIfEmpty(KEYS.pitchRecipients, seedPitchRecipients);
}

export const artistStore = {
  getAll: (): Artist[] => load<Artist>(KEYS.artists, []),
  getById: (id: string): Artist | undefined => load<Artist>(KEYS.artists, []).find((a) => a.id === id),
  create: (data: Omit<Artist, 'id' | 'createdAt'>): Artist => {
    const item: Artist = { ...data, id: uid(), createdAt: now() };
    save(KEYS.artists, [...load<Artist>(KEYS.artists, []), item]);
    return item;
  },
  update: (id: string, data: Partial<Omit<Artist, 'id' | 'createdAt'>>): Artist | null => {
    const all = load<Artist>(KEYS.artists, []);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save(KEYS.artists, all);
    return all[idx];
  },
  delete: (id: string): void => {
    save(KEYS.artists, load<Artist>(KEYS.artists, []).filter((a) => a.id !== id));
    save(KEYS.links, load<ArtistRecipientLink>(KEYS.links, []).filter((l) => l.artistId !== id));
    const pitches = load<Pitch>(KEYS.pitches, []).filter((p) => p.artistId === id);
    pitches.forEach((p) => {
      save(KEYS.pitchRecipients, load<PitchRecipient>(KEYS.pitchRecipients, []).filter((pr) => pr.pitchId !== p.id));
    });
    save(KEYS.pitches, load<Pitch>(KEYS.pitches, []).filter((p) => p.artistId !== id));
  },
};

export const contactStore = {
  getAll: (): Contact[] => load<Contact>(KEYS.contacts, []),
  getById: (id: string): Contact | undefined => load<Contact>(KEYS.contacts, []).find((c) => c.id === id),
  create: (data: Omit<Contact, 'id' | 'createdAt'>): Contact => {
    const item: Contact = { ...data, id: uid(), createdAt: now() };
    save(KEYS.contacts, [...load<Contact>(KEYS.contacts, []), item]);
    return item;
  },
  update: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>): Contact | null => {
    const all = load<Contact>(KEYS.contacts, []);
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save(KEYS.contacts, all);
    return all[idx];
  },
  delete: (id: string): void => {
    save(KEYS.contacts, load<Contact>(KEYS.contacts, []).filter((c) => c.id !== id));
    save(KEYS.links, load<ArtistRecipientLink>(KEYS.links, []).filter((l) => l.contactId !== id));
    save(KEYS.pitchRecipients, load<PitchRecipient>(KEYS.pitchRecipients, []).filter((pr) => pr.contactId !== id));
  },
};

export const linkStore = {
  getAll: (): ArtistRecipientLink[] => load<ArtistRecipientLink>(KEYS.links, []),
  getByArtist: (artistId: string): ArtistRecipientLink[] =>
    load<ArtistRecipientLink>(KEYS.links, []).filter((l) => l.artistId === artistId),
  create: (data: Omit<ArtistRecipientLink, 'id'>): ArtistRecipientLink => {
    const item: ArtistRecipientLink = { ...data, id: uid() };
    save(KEYS.links, [...load<ArtistRecipientLink>(KEYS.links, []), item]);
    return item;
  },
  update: (id: string, data: Partial<Omit<ArtistRecipientLink, 'id'>>): ArtistRecipientLink | null => {
    const all = load<ArtistRecipientLink>(KEYS.links, []);
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save(KEYS.links, all);
    return all[idx];
  },
  delete: (id: string): void => {
    save(KEYS.links, load<ArtistRecipientLink>(KEYS.links, []).filter((l) => l.id !== id));
  },
};

export const pitchStore = {
  getAll: (): Pitch[] => load<Pitch>(KEYS.pitches, []),
  getById: (id: string): Pitch | undefined => load<Pitch>(KEYS.pitches, []).find((p) => p.id === id),
  create: (data: Omit<Pitch, 'id' | 'createdAt'>): Pitch => {
    const item: Pitch = { ...data, id: uid(), createdAt: now() };
    save(KEYS.pitches, [...load<Pitch>(KEYS.pitches, []), item]);
    return item;
  },
  update: (id: string, data: Partial<Omit<Pitch, 'id' | 'createdAt'>>): Pitch | null => {
    const all = load<Pitch>(KEYS.pitches, []);
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save(KEYS.pitches, all);
    return all[idx];
  },
  delete: (id: string): void => {
    save(KEYS.pitches, load<Pitch>(KEYS.pitches, []).filter((p) => p.id !== id));
    save(KEYS.pitchRecipients, load<PitchRecipient>(KEYS.pitchRecipients, []).filter((pr) => pr.pitchId !== id));
  },
};

export const pitchRecipientStore = {
  getAll: (): PitchRecipient[] => load<PitchRecipient>(KEYS.pitchRecipients, []),
  getByPitch: (pitchId: string): PitchRecipient[] =>
    load<PitchRecipient>(KEYS.pitchRecipients, []).filter((pr) => pr.pitchId === pitchId),
  setForPitch: (pitchId: string, contactIds: string[]): void => {
    const others = load<PitchRecipient>(KEYS.pitchRecipients, []).filter((pr) => pr.pitchId !== pitchId);
    const newOnes: PitchRecipient[] = contactIds.map((cid) => ({ id: uid(), pitchId, contactId: cid }));
    save(KEYS.pitchRecipients, [...others, ...newOnes]);
  },
};

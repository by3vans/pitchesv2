'use client';

import { createClient } from '@/lib/supabase/client';
import type { Artist, Contact, ArtistRecipientLink, Pitch, PitchRecipient } from './types';

// Single client instance for the module
const supabase = createClient();

// ─── Row mappers (snake_case DB → camelCase TS) ──────────────────────────────

function toArtist(row: Record<string, unknown>): Artist {
  return {
    id: row.id as string,
    name: row.name as string,
    genre: row.genre as string | undefined,
    location: row.location as string | undefined,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  };
}

function toContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    role: (row.role as string) ?? '',
    company: (row.company as string) ?? '',
    phone: (row.phone as string) ?? '',
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  };
}

function toLink(row: Record<string, unknown>): ArtistRecipientLink {
  return {
    id: row.id as string,
    artistId: row.artist_id as string,
    contactId: row.contact_id as string,
    relationshipType: (row.relationship_type as string) ?? '',
    isPrimary: (row.is_primary as boolean) ?? false,
  };
}

function toPitch(row: Record<string, unknown>): Pitch {
  return {
    id: row.id as string,
    title: row.title as string,
    artistId: row.artist_id as string,
    trackUrl: (row.track_url as string) ?? '',
    status: row.status as Pitch['status'],
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  };
}

function toPitchRecipient(row: Record<string, unknown>): PitchRecipient {
  return {
    id: row.id as string,
    pitchId: row.pitch_id as string,
    contactId: row.contact_id as string,
  };
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Artist Store ─────────────────────────────────────────────────────────────

export const artistStore = {
  async getAll(): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[artistStore.getAll]', error.message);
      return [];
    }
    return (data ?? []).map(toArtist);
  },

  async getById(id: string): Promise<Artist | undefined> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[artistStore.getById]', error.message);
      return undefined;
    }
    return data ? toArtist(data) : undefined;
  },

  async create(input: Omit<Artist, 'id' | 'createdAt'>): Promise<Artist | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('artists')
      .insert({ user_id: userId, name: input.name, genre: input.genre ?? null, location: input.location ?? null, notes: input.notes })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[artistStore.create]', error.message);
      return null;
    }
    return data ? toArtist(data) : null;
  },

  async update(id: string, input: Partial<Omit<Artist, 'id' | 'createdAt'>>): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .update({ name: input.name, genre: input.genre, location: input.location, notes: input.notes })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[artistStore.update]', error.message);
      return null;
    }
    return data ? toArtist(data) : null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('artists').delete().eq('id', id);
    if (error && process.env.NODE_ENV === 'development') console.error('[artistStore.delete]', error.message);
  },
};

// ─── Contact Store ────────────────────────────────────────────────────────────

export const contactStore = {
  async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[contactStore.getAll]', error.message);
      return [];
    }
    return (data ?? []).map(toContact);
  },

  async getById(id: string): Promise<Contact | undefined> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[contactStore.getById]', error.message);
      return undefined;
    }
    return data ? toContact(data) : undefined;
  },

  async create(input: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        full_name: input.fullName,
        email: input.email,
        role: input.role,
        company: input.company,
        phone: input.phone,
        notes: input.notes,
      })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[contactStore.create]', error.message);
      return null;
    }
    return data ? toContact(data) : null;
  },

  async update(id: string, input: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        full_name: input.fullName,
        email: input.email,
        role: input.role,
        company: input.company,
        phone: input.phone,
        notes: input.notes,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[contactStore.update]', error.message);
      return null;
    }
    return data ? toContact(data) : null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error && process.env.NODE_ENV === 'development') console.error('[contactStore.delete]', error.message);
  },
};

// ─── Link Store ───────────────────────────────────────────────────────────────

export const linkStore = {
  async getAll(): Promise<ArtistRecipientLink[]> {
    const { data, error } = await supabase.from('artist_recipient_links').select('*');
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[linkStore.getAll]', error.message);
      return [];
    }
    return (data ?? []).map(toLink);
  },

  async getByArtist(artistId: string): Promise<ArtistRecipientLink[]> {
    const { data, error } = await supabase
      .from('artist_recipient_links')
      .select('*')
      .eq('artist_id', artistId);
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[linkStore.getByArtist]', error.message);
      return [];
    }
    return (data ?? []).map(toLink);
  },

  async create(input: Omit<ArtistRecipientLink, 'id'>): Promise<ArtistRecipientLink | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('artist_recipient_links')
      .insert({
        user_id: userId,
        artist_id: input.artistId,
        contact_id: input.contactId,
        relationship_type: input.relationshipType,
        is_primary: input.isPrimary,
      })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[linkStore.create]', error.message);
      return null;
    }
    return data ? toLink(data) : null;
  },

  async update(id: string, input: Partial<Omit<ArtistRecipientLink, 'id'>>): Promise<ArtistRecipientLink | null> {
    const { data, error } = await supabase
      .from('artist_recipient_links')
      .update({
        relationship_type: input.relationshipType,
        is_primary: input.isPrimary,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[linkStore.update]', error.message);
      return null;
    }
    return data ? toLink(data) : null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('artist_recipient_links').delete().eq('id', id);
    if (error && process.env.NODE_ENV === 'development') console.error('[linkStore.delete]', error.message);
  },
};

// ─── Pitch Store ──────────────────────────────────────────────────────────────

export const pitchStore = {
  async getAll(): Promise<Pitch[]> {
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchStore.getAll]', error.message);
      return [];
    }
    return (data ?? []).map(toPitch);
  },

  async getById(id: string): Promise<Pitch | undefined> {
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchStore.getById]', error.message);
      return undefined;
    }
    return data ? toPitch(data) : undefined;
  },

  async create(input: Omit<Pitch, 'id' | 'createdAt'>): Promise<Pitch | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('pitches')
      .insert({
        user_id: userId,
        title: input.title,
        artist_id: input.artistId,
        track_url: input.trackUrl,
        status: input.status,
        notes: input.notes,
      })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchStore.create]', error.message);
      return null;
    }
    return data ? toPitch(data) : null;
  },

  async update(id: string, input: Partial<Omit<Pitch, 'id' | 'createdAt'>>): Promise<Pitch | null> {
    const { data, error } = await supabase
      .from('pitches')
      .update({
        title: input.title,
        artist_id: input.artistId,
        track_url: input.trackUrl,
        status: input.status,
        notes: input.notes,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchStore.update]', error.message);
      return null;
    }
    return data ? toPitch(data) : null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pitches').delete().eq('id', id);
    if (error && process.env.NODE_ENV === 'development') console.error('[pitchStore.delete]', error.message);
  },
};

// ─── Pitch Recipient Store ────────────────────────────────────────────────────

export const pitchRecipientStore = {
  async getAll(): Promise<PitchRecipient[]> {
    const { data, error } = await supabase.from('pitch_recipients').select('*');
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchRecipientStore.getAll]', error.message);
      return [];
    }
    return (data ?? []).map(toPitchRecipient);
  },

  async getByPitch(pitchId: string): Promise<PitchRecipient[]> {
    const { data, error } = await supabase
      .from('pitch_recipients')
      .select('*')
      .eq('pitch_id', pitchId);
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchRecipientStore.getByPitch]', error.message);
      return [];
    }
    return (data ?? []).map(toPitchRecipient);
  },

  async setForPitch(pitchId: string, contactIds: string[]): Promise<void> {
    const userId = await getUserId();
    if (!userId) return;

    // Delete existing recipients for this pitch
    const { error: deleteError } = await supabase
      .from('pitch_recipients')
      .delete()
      .eq('pitch_id', pitchId);
    if (deleteError) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchRecipientStore.setForPitch delete]', deleteError.message);
      return;
    }

    if (contactIds.length === 0) return;

    // Insert new recipients
    const rows = contactIds.map((contactId) => ({
      user_id: userId,
      pitch_id: pitchId,
      contact_id: contactId,
    }));

    const { error: insertError } = await supabase.from('pitch_recipients').insert(rows);
    if (insertError && process.env.NODE_ENV === 'development') {
      console.error('[pitchRecipientStore.setForPitch insert]', insertError.message);
    }
  },
};

// ─── Pitch Note Store ─────────────────────────────────────────────────────────

export interface PitchNote {
  id: string;
  pitchId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function toPitchNote(row: Record<string, unknown>): PitchNote {
  return {
    id: row.id as string,
    pitchId: row.pitch_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const pitchNoteStore = {
  async getByPitch(pitchId: string): Promise<PitchNote[]> {
    const { data, error } = await supabase
      .from('pitch_notes')
      .select('*')
      .eq('pitch_id', pitchId)
      .order('created_at', { ascending: false });
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchNoteStore.getByPitch]', error.message);
      return [];
    }
    return (data ?? []).map(toPitchNote);
  },

  async create(pitchId: string, content: string): Promise<PitchNote | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('pitch_notes')
      .insert({ pitch_id: pitchId, user_id: userId, content })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchNoteStore.create]', error.message);
      return null;
    }
    return data ? toPitchNote(data) : null;
  },

  async update(id: string, content: string): Promise<PitchNote | null> {
    const { data, error } = await supabase
      .from('pitch_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[pitchNoteStore.update]', error.message);
      return null;
    }
    return data ? toPitchNote(data) : null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pitch_notes').delete().eq('id', id);
    if (error && process.env.NODE_ENV === 'development') console.error('[pitchNoteStore.delete]', error.message);
  },
};

// initStore is no longer needed (Supabase handles persistence)
// Kept as no-op for backwards compatibility if called anywhere
export function initStore(): void {}
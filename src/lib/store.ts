'use client';

import { createClient } from '@/lib/supabase/client';
import type { Artist, Contact, ArtistRecipientLink, Pitch, PitchRecipient } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Artist Store ─────────────────────────────────────────────────────────────

export const artistStore = {
  async getAll(): Promise<Artist[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, genre, location, bio, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[artistStore.getAll]', error.message); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      genre: r.genre ?? undefined,
      location: r.location ?? undefined,
      notes: r.bio ?? '',
      createdAt: r.created_at,
    }));
  },

  async getById(id: string): Promise<Artist | undefined> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return undefined;
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, genre, location, bio, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      name: data.name,
      genre: data.genre ?? undefined,
      location: data.location ?? undefined,
      notes: data.bio ?? '',
      createdAt: data.created_at,
    };
  },

  async create(data: Omit<Artist, 'id' | 'createdAt'>): Promise<Artist | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const { data: row, error } = await supabase
      .from('artists')
      .insert({ name: data.name, genre: data.genre ?? null, location: data.location ?? null, bio: data.notes, user_id: userId })
      .select('id, name, genre, location, bio, created_at')
      .single();
    if (error || !row) { console.error('[artistStore.create]', error?.message); return null; }
    return { id: row.id, name: row.name, genre: row.genre ?? undefined, location: row.location ?? undefined, notes: row.bio ?? '', createdAt: row.created_at };
  },

  async update(id: string, data: Partial<Omit<Artist, 'id' | 'createdAt'>>): Promise<Artist | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.genre !== undefined) patch.genre = data.genre;
    if (data.location !== undefined) patch.location = data.location;
    if (data.notes !== undefined) patch.bio = data.notes;
    const { data: row, error } = await supabase
      .from('artists')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, genre, location, bio, created_at')
      .single();
    if (error || !row) { console.error('[artistStore.update]', error?.message); return null; }
    return { id: row.id, name: row.name, genre: row.genre ?? undefined, location: row.location ?? undefined, notes: row.bio ?? '', createdAt: row.created_at };
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('artist_recipient_links').delete().eq('artist_id', id).eq('user_id', userId);
    await supabase.from('pitches').delete().eq('artist_id', id).eq('user_id', userId);
    await supabase.from('artists').delete().eq('id', id).eq('user_id', userId);
  },
};

// ─── Contact Store ────────────────────────────────────────────────────────────

export const contactStore = {
  async getAll(): Promise<Contact[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, full_name, email, role, company, phone, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[contactStore.getAll]', error.message); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      fullName: r.full_name || r.name || '',
      email: r.email ?? '',
      role: r.role ?? '',
      company: r.company ?? '',
      phone: r.phone ?? '',
      notes: '',
      createdAt: r.created_at,
    }));
  },

  async getById(id: string): Promise<Contact | undefined> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return undefined;
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, full_name, email, role, company, phone, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      fullName: data.full_name || data.name || '',
      email: data.email ?? '',
      role: data.role ?? '',
      company: data.company ?? '',
      phone: data.phone ?? '',
      notes: '',
      createdAt: data.created_at,
    };
  },

  async create(data: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const { data: row, error } = await supabase
      .from('contacts')
      .insert({
        name: data.fullName,
        full_name: data.fullName,
        email: data.email,
        role: data.role,
        company: data.company,
        phone: data.phone,
        user_id: userId,
      })
      .select('id, name, full_name, email, role, company, phone, created_at')
      .single();
    if (error || !row) { console.error('[contactStore.create]', error?.message); return null; }
    return {
      id: row.id,
      fullName: row.full_name || row.name || '',
      email: row.email ?? '',
      role: row.role ?? '',
      company: row.company ?? '',
      phone: row.phone ?? '',
      notes: '',
      createdAt: row.created_at,
    };
  },

  async update(id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<Contact | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) { patch.name = data.fullName; patch.full_name = data.fullName; }
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.role = data.role;
    if (data.company !== undefined) patch.company = data.company;
    if (data.phone !== undefined) patch.phone = data.phone;
    const { data: row, error } = await supabase
      .from('contacts')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, full_name, email, role, company, phone, created_at')
      .single();
    if (error || !row) { console.error('[contactStore.update]', error?.message); return null; }
    return {
      id: row.id,
      fullName: row.full_name || row.name || '',
      email: row.email ?? '',
      role: row.role ?? '',
      company: row.company ?? '',
      phone: row.phone ?? '',
      notes: '',
      createdAt: row.created_at,
    };
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('artist_recipient_links').delete().eq('contact_id', id).eq('user_id', userId);
    await supabase.from('contacts').delete().eq('id', id).eq('user_id', userId);
  },
};

// ─── Link Store ───────────────────────────────────────────────────────────────

export const linkStore = {
  async getAll(): Promise<ArtistRecipientLink[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('artist_recipient_links')
      .select('id, artist_id, contact_id, relationship_type, is_primary')
      .eq('user_id', userId);
    if (error) { console.error('[linkStore.getAll]', error.message); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      artistId: r.artist_id,
      contactId: r.contact_id,
      relationshipType: r.relationship_type,
      isPrimary: r.is_primary,
    }));
  },

  async getByArtist(artistId: string): Promise<ArtistRecipientLink[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('artist_recipient_links')
      .select('id, artist_id, contact_id, relationship_type, is_primary')
      .eq('artist_id', artistId)
      .eq('user_id', userId);
    if (error) { console.error('[linkStore.getByArtist]', error.message); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      artistId: r.artist_id,
      contactId: r.contact_id,
      relationshipType: r.relationship_type,
      isPrimary: r.is_primary,
    }));
  },

  async create(data: Omit<ArtistRecipientLink, 'id'>): Promise<ArtistRecipientLink | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const { data: row, error } = await supabase
      .from('artist_recipient_links')
      .insert({
        artist_id: data.artistId,
        contact_id: data.contactId,
        relationship_type: data.relationshipType,
        is_primary: data.isPrimary,
        user_id: userId,
      })
      .select('id, artist_id, contact_id, relationship_type, is_primary')
      .single();
    if (error || !row) { console.error('[linkStore.create]', error?.message); return null; }
    return { id: row.id, artistId: row.artist_id, contactId: row.contact_id, relationshipType: row.relationship_type, isPrimary: row.is_primary };
  },

  async update(id: string, data: Partial<Omit<ArtistRecipientLink, 'id'>>): Promise<ArtistRecipientLink | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const patch: Record<string, unknown> = {};
    if (data.relationshipType !== undefined) patch.relationship_type = data.relationshipType;
    if (data.isPrimary !== undefined) patch.is_primary = data.isPrimary;
    const { data: row, error } = await supabase
      .from('artist_recipient_links')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, artist_id, contact_id, relationship_type, is_primary')
      .single();
    if (error || !row) { console.error('[linkStore.update]', error?.message); return null; }
    return { id: row.id, artistId: row.artist_id, contactId: row.contact_id, relationshipType: row.relationship_type, isPrimary: row.is_primary };
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('artist_recipient_links').delete().eq('id', id).eq('user_id', userId);
  },
};

// ─── Pitch Store ──────────────────────────────────────────────────────────────

export const pitchStore = {
  async getAll(): Promise<Pitch[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('pitches')
      .select('id, title, artist_id, status, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[pitchStore.getAll]', error.message); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      artistId: r.artist_id ?? '',
      trackUrl: '',
      status: (r.status as Pitch['status']) ?? 'draft',
      notes: r.notes ?? '',
      createdAt: r.created_at,
    }));
  },

  async getById(id: string): Promise<Pitch | undefined> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return undefined;
    const { data, error } = await supabase
      .from('pitches')
      .select('id, title, artist_id, status, notes, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      title: data.title,
      artistId: data.artist_id ?? '',
      trackUrl: '',
      status: (data.status as Pitch['status']) ?? 'draft',
      notes: data.notes ?? '',
      createdAt: data.created_at,
    };
  },

  async create(data: Omit<Pitch, 'id' | 'createdAt'>): Promise<Pitch | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const { data: row, error } = await supabase
      .from('pitches')
      .insert({
        title: data.title,
        artist_id: data.artistId || null,
        status: data.status,
        notes: data.notes,
        user_id: userId,
      })
      .select('id, title, artist_id, status, notes, created_at')
      .single();
    if (error || !row) { console.error('[pitchStore.create]', error?.message); return null; }
    return {
      id: row.id,
      title: row.title,
      artistId: row.artist_id ?? '',
      trackUrl: '',
      status: (row.status as Pitch['status']) ?? 'draft',
      notes: row.notes ?? '',
      createdAt: row.created_at,
    };
  },

  async update(id: string, data: Partial<Omit<Pitch, 'id' | 'createdAt'>>): Promise<Pitch | null> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return null;
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.artistId !== undefined) patch.artist_id = data.artistId || null;
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { data: row, error } = await supabase
      .from('pitches')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, artist_id, status, notes, created_at')
      .single();
    if (error || !row) { console.error('[pitchStore.update]', error?.message); return null; }
    return {
      id: row.id,
      title: row.title,
      artistId: row.artist_id ?? '',
      trackUrl: '',
      status: (row.status as Pitch['status']) ?? 'draft',
      notes: row.notes ?? '',
      createdAt: row.created_at,
    };
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pitches').delete().eq('id', id).eq('user_id', userId);
  },
};

// ─── Pitch Recipient Store ────────────────────────────────────────────────────
// Recipients are stored in pitches.recipients JSONB column

export const pitchRecipientStore = {
  async getAll(): Promise<PitchRecipient[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('pitches')
      .select('id, recipients')
      .eq('user_id', userId);
    if (error) { console.error('[pitchRecipientStore.getAll]', error.message); return []; }
    const result: PitchRecipient[] = [];
    for (const row of data ?? []) {
      const recs: { id?: string; contactId?: string; contact_id?: string }[] = Array.isArray(row.recipients) ? row.recipients : [];
      recs.forEach((r, idx) => {
        const cid = r.contactId || r.contact_id || '';
        if (cid) result.push({ id: r.id || `${row.id}-${idx}`, pitchId: row.id, contactId: cid });
      });
    }
    return result;
  },

  async getByPitch(pitchId: string): Promise<PitchRecipient[]> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('pitches')
      .select('id, recipients')
      .eq('id', pitchId)
      .eq('user_id', userId)
      .single();
    if (error || !data) return [];
    const recs: { id?: string; contactId?: string; contact_id?: string }[] = Array.isArray(data.recipients) ? data.recipients : [];
    return recs
      .map((r, idx) => ({
        id: r.id || `${pitchId}-${idx}`,
        pitchId,
        contactId: r.contactId || r.contact_id || '',
      }))
      .filter((r) => r.contactId);
  },

  async setForPitch(pitchId: string, contactIds: string[]): Promise<void> {
    const supabase = createClient();
    const userId = await getUserId();
    if (!userId) return;
    const recipients = contactIds.map((cid) => ({ contactId: cid }));
    const { error } = await supabase
      .from('pitches')
      .update({ recipients })
      .eq('id', pitchId)
      .eq('user_id', userId);
    if (error) console.error('[pitchRecipientStore.setForPitch]', error.message);
  },
};

// No-op export kept for backward compatibility — no longer needed
export function initStore(): void {}

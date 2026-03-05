-- ============================================================
-- Add missing columns to contacts and create artist_recipient_links
-- ============================================================

-- Add full_name and phone columns to contacts if missing
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Backfill full_name from name if empty
UPDATE public.contacts SET full_name = name WHERE full_name IS NULL OR full_name = '';

-- Artist-Recipient Links table
CREATE TABLE IF NOT EXISTS public.artist_recipient_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'Other',
  is_primary BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_recipient_links_artist_id ON public.artist_recipient_links(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_recipient_links_contact_id ON public.artist_recipient_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_artist_recipient_links_user_id ON public.artist_recipient_links(user_id);

ALTER TABLE public.artist_recipient_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_artist_recipient_links" ON public.artist_recipient_links;
CREATE POLICY "users_manage_own_artist_recipient_links"
ON public.artist_recipient_links
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

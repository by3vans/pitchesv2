-- ============================================================
-- Pitchhood Full Schema Migration
-- Tables: profiles, pitches, artists, contacts, reminders, templates
-- ============================================================

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  genre_preferences TEXT[] DEFAULT '{}'::TEXT[],
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  genre TEXT,
  sub_genres TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT DEFAULT 'active',
  label TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  role TEXT,
  last_pitched_at TIMESTAMPTZ,
  response_rate NUMERIC(5,2) DEFAULT 0,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  links TEXT[] DEFAULT '{}'::TEXT[],
  usage_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pitches table
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  links TEXT[] DEFAULT '{}'::TEXT[],
  reminder_date TIMESTAMPTZ,
  recipients JSONB DEFAULT '[]'::JSONB,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE,
  contact_name TEXT,
  reminder_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  snoozed_until TIMESTAMPTZ,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_pitches_user_id ON public.pitches(user_id);
CREATE INDEX IF NOT EXISTS idx_pitches_artist_id ON public.pitches(artist_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pitch_id ON public.reminders(pitch_id);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-update updated_at on pitches
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "users_manage_own_profiles" ON public.profiles;
CREATE POLICY "users_manage_own_profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- artists
DROP POLICY IF EXISTS "users_manage_own_artists" ON public.artists;
CREATE POLICY "users_manage_own_artists"
ON public.artists
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- contacts
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;
CREATE POLICY "users_manage_own_contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- templates
DROP POLICY IF EXISTS "users_manage_own_templates" ON public.templates;
CREATE POLICY "users_manage_own_templates"
ON public.templates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- pitches
DROP POLICY IF EXISTS "users_manage_own_pitches" ON public.pitches;
CREATE POLICY "users_manage_own_pitches"
ON public.pitches
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- reminders
DROP POLICY IF EXISTS "users_manage_own_reminders" ON public.reminders;
CREATE POLICY "users_manage_own_reminders"
ON public.reminders
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_pitches_updated ON public.pitches;
CREATE TRIGGER on_pitches_updated
  BEFORE UPDATE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 7. STORAGE BUCKET FOR AVATARS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_auth_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

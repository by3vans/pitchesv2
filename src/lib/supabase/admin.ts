import { createClient } from '@supabase/supabase-js';

// Client com service_role — bypassa RLS completamente
// NUNCA use no browser. Só em API routes (server-side).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
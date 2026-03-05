import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  // Use the request's own origin so this works on any deployment (Rocket, Vercel, etc.)
  const appUrl = origin;

  console.log('[auth/callback] ✅ Route hit!');
  console.log('[auth/callback] Incoming URL:', request.url);
  console.log('[auth/callback] Origin:', appUrl);
  console.log('[auth/callback] code param:', code ? `${code.substring(0, 20)}...` : 'null');
  console.log('[auth/callback] error param:', errorParam ?? 'null');
  console.log('[auth/callback] error_description:', errorDescription ?? 'null');
  console.log('[auth/callback] next param:', next);

  if (errorParam) {
    console.error('[auth/callback] OAuth error received:', errorParam, errorDescription);
    const errorUrl = `${appUrl}/login?error=oauth_error&error_description=${encodeURIComponent(errorDescription ?? errorParam)}`;
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    console.log('[auth/callback] Code found — exchanging for session...');
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log('[auth/callback] Session exchange SUCCESS — user:', data?.session?.user?.id ?? 'unknown');
      const redirectTo = `${appUrl}${next}`;
      console.log('[auth/callback] Redirecting to:', redirectTo);
      return NextResponse.redirect(redirectTo);
    } else {
      console.error('[auth/callback] Session exchange FAILED:', error.message);
    }
  } else {
    console.warn('[auth/callback] No code param found in URL');
  }

  const fallbackUrl = `${appUrl}/login?error=oauth_error`;
  console.log('[auth/callback] Falling back to:', fallbackUrl);
  return NextResponse.redirect(fallbackUrl);
}

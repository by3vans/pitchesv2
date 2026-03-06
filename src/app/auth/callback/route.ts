import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard';

  // Use the request's own origin so this works on any deployment (Rocket, Vercel, etc.)
  const appUrl = origin;

  if (process.env.NODE_ENV === 'development') {
    console.log('[auth/callback] ✅ Route hit!');
    console.log('[auth/callback] Incoming URL:', request.url);
    console.log('[auth/callback] Origin:', appUrl);
    console.log('[auth/callback] code param:', code ? `${code.substring(0, 20)}...` : 'null');
    console.log('[auth/callback] error param:', errorParam ?? 'null');
    console.log('[auth/callback] error_description:', errorDescription ?? 'null');
    console.log('[auth/callback] next param:', next);
  }

  if (errorParam) {
    console.error('[auth/callback] OAuth error received:', errorParam, errorDescription);
    const errorUrl = `${appUrl}/login?error=oauth_error&error_description=${encodeURIComponent(errorDescription ?? errorParam)}`;
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/callback] Code found — exchanging for session...');
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if profile is complete (has full_name)
      const userId = data?.session?.user?.id;
      let destination = next;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();
        if (!profile?.full_name) {
        destination = '/onboarding-profile-setup';
        }
      }
      const redirectTo = `${appUrl}${destination}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('[auth/callback] Session exchange SUCCESS — user:', data?.session?.user?.id ?? 'unknown');
        console.log('[auth/callback] Redirecting to:', redirectTo);
      }
      return NextResponse.redirect(redirectTo);
    } else {
      console.error('[auth/callback] Session exchange FAILED:', error.message);
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[auth/callback] No code param found in URL');
    }
  }

  const fallbackUrl = `${appUrl}/login?error=oauth_error`;
  if (process.env.NODE_ENV === 'development') {
    console.log('[auth/callback] Falling back to:', fallbackUrl);
  }
  return NextResponse.redirect(fallbackUrl);
}

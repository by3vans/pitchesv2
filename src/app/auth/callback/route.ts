import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchhood-8oc20eow5-by3vans-projects.vercel.app';

  console.log('[auth/callback] ✅ Route hit!');
  console.log('[auth/callback] Incoming URL:', request.url);
  console.log('[auth/callback] code param:', code ? `${code.substring(0, 20)}...` : 'null');
  console.log('[auth/callback] error param:', errorParam ?? 'null');
  console.log('[auth/callback] error_description:', errorDescription ?? 'null');
  console.log('[auth/callback] next param:', next);

  if (code) {
    console.log('[auth/callback] Code found — exchanging for session...');
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectTo = `${appUrl}${next}`;
      console.log('[auth/callback] Session exchange SUCCESS — redirecting to:', redirectTo);
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
```

---

**Agora no Google Cloud**, o URI de redirecionamento autorizado deve ser:
```
https://pitchhood-8oc20eow5-by3vans-projects.vercel.app/auth/callback

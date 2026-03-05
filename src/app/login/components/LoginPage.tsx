'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Tab = 'login' | 'signup';
type ErrorType = 'oauth' | 'network' | 'credentials' | 'general';

interface AuthError {
  message: string;
  type: ErrorType;
}

function getOAuthErrorMessage(err: unknown): AuthError {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (err as Record<string, string>)?.code || (err as Record<string, string>)?.error_code || '';

  if (msg.includes('popup_closed') || msg.includes('popup closed') || msg.includes('user closed')) {
    return { message: 'Sign-in popup was closed. Please try again.', type: 'oauth' };
  }
  if (msg.includes('access_denied') || msg.includes('access denied') || code === 'access_denied') {
    return { message: 'Google access was denied. Please allow permissions and try again.', type: 'oauth' };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return { message: 'Network error. Please check your internet connection and try again.', type: 'network' };
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { message: 'Request timed out. Please check your connection and try again.', type: 'network' };
  }
  return { message: 'Google sign-in failed. Please try again.', type: 'oauth' };
}

function getCredentialErrorMessage(err: unknown): AuthError {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (err as Record<string, string>)?.code || (err as Record<string, string>)?.error_code || '';

  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return { message: 'Network error. Please check your internet connection and try again.', type: 'network' };
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { message: 'Request timed out. Please check your connection and try again.', type: 'network' };
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || code === 'invalid_credentials') {
    return { message: 'Incorrect email or password. Please check your credentials and try again.', type: 'credentials' };
  }
  if (msg.includes('email not confirmed') || msg.includes('email not verified') || code === 'email_not_confirmed') {
    return { message: 'Your email is not verified. Please check your inbox for a verification link.', type: 'credentials' };
  }
  if (msg.includes('user not found') || msg.includes('no user found') || code === 'user_not_found') {
    return { message: 'No account found with this email. Please sign up first.', type: 'credentials' };
  }
  if (msg.includes('too many requests') || msg.includes('rate limit') || code === 'over_request_rate_limit') {
    return { message: 'Too many attempts. Please wait a moment and try again.', type: 'general' };
  }
  if (msg.includes('email already') || msg.includes('already registered') || code === 'user_already_exists') {
    return { message: 'An account with this email already exists. Try signing in instead.', type: 'credentials' };
  }
  return { message: err instanceof Error ? err.message : 'Something went wrong. Please try again.', type: 'general' };
}

const artistCards = [
  { initials: 'MJ', name: 'MARCUS JAMES', genre: 'R&B · Soul', score: '9.2', color: '#7C3AED' },
  { initials: 'AL', name: 'ANA LIMA', genre: 'Pop · Electronic', score: '8.7', color: '#DC2626' },
  { initials: 'DK', name: 'DJ KURO', genre: 'Hip-Hop · Trap', score: '7.9', color: '#2563EB' },
  { initials: 'SR', name: 'SOFIA RAMOS', genre: 'Indie · Folk', score: '8.1', color: '#059669' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[LoginPage] handleGoogleAuth called');
        console.log('[LoginPage] redirectTo URL:', redirectTo);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[LoginPage] signInWithOAuth response data:', data);
        console.log('[LoginPage] signInWithOAuth error:', error);
      }

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LoginPage] OAuth error:', error.message, error);
        }
        throw error;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[LoginPage] OAuth initiated — browser should redirect to Google now');
      }
    } catch (err: unknown) {
      setAuthError(getOAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, password);
        router.push('/dashboard');
      } else {
        await signUp(email, password);
        router.push('/onboarding-profile-setup');
      }
    } catch (err: unknown) {
      setAuthError(getCredentialErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const errorIconMap: Record<ErrorType, JSX.Element> = {
    oauth: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    network: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
      </svg>
    ),
    credentials: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    general: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-full md:w-[340px] lg:w-[380px] flex-shrink-0 bg-white flex flex-col justify-center px-10 py-12">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/assets/images/pitchhood-logo-light-1772649730204.png"
            alt="Pitchhood logo"
            width={140}
            height={36}
            className="object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-[2rem] font-bold italic text-gray-900 mb-2 leading-tight">
          Welcome back.
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Manage your A&amp;R pipeline, review pitches, and discover the next big artist.
        </p>

        {/* Tab Toggle */}
        <div className="flex border border-gray-200 rounded mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => { setTab('login'); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
              tab === 'login' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
              tab === 'signup' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-700'
            }`}
          >
            Signup
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-colors mb-4"
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">or continue with email</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@label.com"
              required
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {tab === 'login' && (
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}

          {authError && (
            <div className={`flex items-start gap-2.5 rounded px-3 py-2.5 border text-xs ${
              authError.type === 'network'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : authError.type === 'oauth'
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {errorIconMap[authError.type]}
              <span>{authError.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {tab === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {tab === 'login' ? 'SIGN IN' : 'SIGN UP'}
                <span aria-hidden>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-xs text-center text-gray-400">
          {tab === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('signup'); setAuthError(null); }}
                className="text-gray-700 font-semibold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('login'); setAuthError(null); }}
                className="text-gray-700 font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Right Panel — Platform Preview */}
      <div className="hidden md:flex flex-1 bg-[#0f0f0f] items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div
          className="relative z-10"
          style={{
            transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)',
            filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.8))',
          }}
        >
          <div className="w-[480px] rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57] block" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E] block" />
              <span className="w-3 h-3 rounded-full bg-[#28C840] block" />
              <div className="flex-1 mx-3 bg-[#1a1a1a] border border-white/10 rounded px-3 py-1 flex items-center gap-2">
                <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[11px] text-gray-400 font-mono">app.pitchhood.com</span>
              </div>
            </div>

            <div className="bg-[#111111] px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-white tracking-wider">ARTISTS</span>
                <span className="text-[10px] text-gray-500">A&amp;R Pipeline</span>
              </div>
              <div className="space-y-2">
                {artistCards.map((artist) => (
                  <div
                    key={artist.name}
                    className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg px-4 py-3 border border-white/5"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                      style={{ backgroundColor: artist.color }}
                    >
                      {artist.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white tracking-wide">{artist.name}</p>
                      <p className="text-[10px] text-gray-500">{artist.genre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-white">{artist.score}</p>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 60% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

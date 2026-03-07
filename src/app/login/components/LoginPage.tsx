'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginSchema, SignUpSchema } from '@/lib/validations/schemas';
import Cubes from './Cubes';
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
  if (msg.includes('popup_closed') || msg.includes('user closed')) return { message: 'Sign-in popup was closed. Please try again.', type: 'oauth' };
  if (msg.includes('access_denied') || code === 'access_denied') return { message: 'Google access was denied. Please allow permissions and try again.', type: 'oauth' };
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('networkerror')) return { message: 'Network error. Please check your connection and try again.', type: 'network' };
  if (msg.includes('timeout')) return { message: 'Request timed out. Please check your connection and try again.', type: 'network' };
  return { message: 'Google sign-in failed. Please try again.', type: 'oauth' };
}

function getCredentialErrorMessage(err: unknown): AuthError {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (err as Record<string, string>)?.code || (err as Record<string, string>)?.error_code || '';
  if (msg.includes('network') || msg.includes('fetch')) return { message: 'Network error. Please check your connection and try again.', type: 'network' };
  if (msg.includes('invalid login credentials') || code === 'invalid_credentials') return { message: 'Incorrect email or password. Please try again.', type: 'credentials' };
  if (msg.includes('email not confirmed') || code === 'email_not_confirmed') return { message: 'Your email is not verified. Check your inbox for a verification link.', type: 'credentials' };
  if (msg.includes('user not found') || code === 'user_not_found') return { message: 'No account found with this email. Please sign up first.', type: 'credentials' };
  if (msg.includes('too many requests') || code === 'over_request_rate_limit') return { message: 'Too many attempts. Please wait a moment and try again.', type: 'general' };
  if (msg.includes('email already') || code === 'user_already_exists') return { message: 'An account with this email already exists. Try signing in instead.', type: 'credentials' };
  return { message: err instanceof Error ? err.message : 'Something went wrong. Please try again.', type: 'general' };
}

// ── Flag-P Logo ────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="4" height="26" rx="2" fill="#1A1A18" />
        <path d="M4 2 L18 10 L4 18 Z" fill="#486CE3" />
      </svg>
      <span style={{
        fontFamily: "'Cabinet Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: '1.1rem',
        letterSpacing: '-0.03em',
        color: '#1A1A18',
        lineHeight: 1,
      }}>PitchHood</span>
    </div>
  );
}

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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'select_account' } },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setAuthError(getOAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const schema = tab === 'login' ? LoginSchema : SignUpSchema;
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      setAuthError({ message: result.error.errors[0]?.message ?? 'Invalid input', type: 'credentials' });
      return;
    }
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

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    panel: {
      width: '100%', maxWidth: 380,
      flexShrink: 0,
      background: '#F8F5F0',
      display: 'flex', flexDirection: 'column' as const,
      justifyContent: 'center',
      padding: '48px 40px',
    } as React.CSSProperties,
    heading: {
      fontFamily: "'Playfair Display', serif",
      fontStyle: 'italic',
      fontWeight: 900,
      fontSize: '2rem',
      lineHeight: 1.1,
      color: '#1A1A18',
      marginBottom: 8,
    },
    sub: {
      fontFamily: "'Epilogue', sans-serif",
      fontWeight: 300,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      color: '#7A7470',
      marginBottom: 32,
    },
    label: {
      display: 'block',
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '0.62rem',
      fontWeight: 500,
      letterSpacing: '0.16em',
      textTransform: 'uppercase' as const,
      color: '#7A7470',
      marginBottom: 6,
    },
    input: {
      width: '100%',
      fontFamily: "'Epilogue', sans-serif",
      fontWeight: 300,
      fontSize: '0.875rem',
      color: '#1A1A18',
      background: '#FFFFFF',
      border: '1px solid rgba(107,101,80,0.2)',
      borderRadius: 8,
      padding: '10px 13px',
      outline: 'none',
      transition: 'border-color 150ms',
    },
  };

  const errorColors: Record<ErrorType, { bg: string; border: string; text: string }> = {
    network:     { bg: '#FFF8ED', border: '#F0C070', text: '#8A5A00' },
    oauth:       { bg: '#FFF3ED', border: '#E8A87A', text: '#7A3010' },
    credentials: { bg: 'rgba(194,59,46,0.06)', border: 'rgba(194,59,46,0.2)', text: '#C23B2E' },
    general:     { bg: 'rgba(72,108,227,0.06)', border: 'rgba(72,108,227,0.2)', text: '#486CE3' },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left Panel ── */}
      <div style={S.panel}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Logo />
        </div>

        {/* Heading */}
        <h1 style={S.heading}>Welcome back.</h1>
        <p style={S.sub}>Manage your A&amp;R pipeline, review pitches, and discover the next big artist.</p>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', border: '1px solid rgba(107,101,80,0.16)', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
          {(['login', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setAuthError(null); }}
              style={{
                flex: 1, padding: '9px 0',
                fontFamily: "'Azeret Mono', monospace",
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms',
                background: tab === t ? '#1A1A18' : 'transparent',
                color: tab === t ? '#F0ECE6' : '#7A7470',
              }}
            >{t === 'login' ? 'Login' : 'Sign Up'}</button>
          ))}
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            border: '1px solid rgba(107,101,80,0.2)', borderRadius: 10,
            padding: '10px 16px',
            fontFamily: "'Epilogue', sans-serif",
            fontSize: '0.875rem', fontWeight: 400,
            color: '#3A3836',
            background: '#FFFFFF',
            cursor: 'pointer', transition: 'all 150ms',
            marginBottom: 20,
            opacity: (googleLoading || loading) ? 0.6 : 1,
          }}
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(107,101,80,0.12)' }} />
          <span style={{ fontFamily: "'Azeret Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7470' }}>or email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(107,101,80,0.12)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@label.com" required style={S.input}
              onFocus={e => (e.target.style.borderColor = '#486CE3')}
              onBlur={e => (e.target.style.borderColor = 'rgba(107,101,80,0.2)')}
            />
          </div>

          <div>
            <label style={S.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={S.input}
              onFocus={e => (e.target.style.borderColor = '#486CE3')}
              onBlur={e => (e.target.style.borderColor = 'rgba(107,101,80,0.2)')}
            />
          </div>

          {tab === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="/forgot-password" style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.75rem', color: '#7A7470', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
          )}

          {authError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              borderRadius: 10, padding: '10px 14px',
              border: `1px solid ${errorColors[authError.type].border}`,
              background: errorColors[authError.type].bg,
              fontFamily: "'Epilogue', sans-serif",
              fontSize: '0.8rem', fontWeight: 300,
              color: errorColors[authError.type].text,
            }}>
              <span>{authError.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#486CE3',
              color: '#fff',
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em',
              padding: '13px 20px', borderRadius: 10, border: 'none',
              cursor: 'pointer', transition: 'background 0.2s',
              opacity: (loading || googleLoading) ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading && !googleLoading) e.currentTarget.style.background = '#3558C8'; }}
            onMouseLeave={e => (e.currentTarget.style.background = '#486CE3')}
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
              <>{tab === 'login' ? 'Sign in' : 'Create account'} →</>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: 24, fontFamily: "'Epilogue', sans-serif", fontSize: '0.8rem', textAlign: 'center', color: '#7A7470', fontWeight: 300 }}>
          {tab === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button type="button" onClick={() => { setTab('signup'); setAuthError(null); }}
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, color: '#1A1A18', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => { setTab('login'); setAuthError(null); }}
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, color: '#1A1A18', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: '#1A1A18' }}>
        <div className="absolute inset-0">
          <Cubes
            gridSize={12}
            maxAngle={40}
            radius={3}
            borderStyle="1px solid rgba(72,108,227,0.2)"
            faceColor="#1A1A18"
            rippleColor="#486CE3"
            rippleSpeed={1.5}
            autoAnimate
            rippleOnClick
          />
        </div>
        <div className="relative z-10 text-center px-8">
          <div style={{ fontFamily: "'Azeret Mono', monospace", fontSize: 10, fontWeight: 500, color: '#486CE3', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>
            Pitchhood
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 30, fontWeight: 900, color: '#F0ECE6', lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.02em' }}>
            Your A&amp;R workspace,<br />reimagined.
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 300, fontSize: 14, color: 'rgba(240,236,230,0.45)', lineHeight: 1.75 }}>
            Everything your team needs to discover,<br />review, and sign artists.
          </div>
        </div>
      </div>
    </div>
  );
}
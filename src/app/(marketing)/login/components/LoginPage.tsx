'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginSchema, SignUpSchema } from '@/lib/validations/schemas';
import { createClient } from '@/lib/supabase/client';
import { useNavigate } from '@/contexts/TransitionContext';

type Tab = 'login' | 'signup';
type ErrorType = 'oauth' | 'network' | 'credentials' | 'general';
interface AuthError { message: string; type: ErrorType; }

function getOAuthErrorMessage(err: unknown): AuthError {
  const msg  = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (err as Record<string, string>)?.code || (err as Record<string, string>)?.error_code || '';
  if (msg.includes('popup_closed') || msg.includes('user closed'))        return { message: 'Sign-in popup was closed. Please try again.',                              type: 'oauth'   };
  if (msg.includes('access_denied') || code === 'access_denied')          return { message: 'Google access was denied. Please allow permissions and try again.',        type: 'oauth'   };
  if (msg.includes('network') || msg.includes('fetch'))                   return { message: 'Network error. Please check your connection and try again.',               type: 'network' };
  if (msg.includes('timeout'))                                             return { message: 'Request timed out. Please check your connection and try again.',           type: 'network' };
  return { message: 'Google sign-in failed. Please try again.', type: 'oauth' };
}

function getCredentialErrorMessage(err: unknown): AuthError {
  const msg  = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (err as Record<string, string>)?.code || (err as Record<string, string>)?.error_code || '';
  if (msg.includes('network') || msg.includes('fetch'))                                return { message: 'Network error. Please check your connection.',                                  type: 'network'     };
  if (msg.includes('invalid login credentials') || code === 'invalid_credentials')    return { message: 'Incorrect email or password. Please try again.',                               type: 'credentials' };
  if (msg.includes('email not confirmed')        || code === 'email_not_confirmed')    return { message: 'Your email is not verified. Check your inbox.',                                type: 'credentials' };
  if (msg.includes('user not found')             || code === 'user_not_found')         return { message: 'No account found with this email. Please sign up first.',                      type: 'credentials' };
  if (msg.includes('too many requests')          || code === 'over_request_rate_limit') return { message: 'Too many attempts. Please wait a moment.',                                   type: 'general'     };
  if (msg.includes('email already')             || code === 'user_already_exists')    return { message: 'An account with this email already exists. Try signing in.',                   type: 'credentials' };
  return { message: err instanceof Error ? err.message : 'Something went wrong. Please try again.', type: 'general' };
}

// ── Cards data ─────────────────────────────────────────────────────────────
const CARDS = [
  { name: 'Sonebi Records',    meta: 'Hip-Hop / Afrobeats · Lagos',   status: 'replied', bar: '78%',  color: '#8ab04a' },
  { name: 'NxWorries Blog',    meta: 'R&B / Soul · Los Angeles',      status: 'opened',  bar: '52%',  color: '#e8935a' },
  { name: 'COLORS Berlin',     meta: 'Alternative · Berlin',          status: 'sent',    bar: '20%',  color: '#7a99ff' },
  { name: 'Ones To Watch',     meta: 'Pop / Indie · New York',        status: 'replied', bar: '91%',  color: '#8ab04a' },
  { name: 'Spotify Editorial', meta: 'All Genres · Global',           status: 'opened',  bar: '44%',  color: '#e8935a' },
  { name: 'Trap Nation',       meta: 'Trap / Urban · Online',         status: 'sent',    bar: '15%',  color: '#7a99ff' },
  { name: 'Majestic Casual',   meta: 'Chillout / Indie · London',     status: 'replied', bar: '66%',  color: '#8ab04a' },
  { name: 'Earmilk',           meta: 'Electronic / R&B · NYC',        status: 'passed',  bar: '100%', color: '#e87060' },
  { name: 'UnitedMasters',     meta: 'Hip-Hop / R&B · Brooklyn',      status: 'opened',  bar: '38%',  color: '#e8935a' },
  { name: 'Pigeons & Planes',  meta: 'Indie / Hip-Hop · Global',      status: 'sent',    bar: '10%',  color: '#7a99ff' },
  { name: 'Afropunk',          meta: 'Alternative / Soul · NYC',      status: 'replied', bar: '83%',  color: '#8ab04a' },
  { name: 'The FADER',         meta: 'Music Culture · New York',      status: 'opened',  bar: '61%',  color: '#e8935a' },
];
const STATUS_LABEL: Record<string, string> = { sent: 'Sent', opened: 'Opened', replied: 'Replied ✓', passed: 'Passed' };
const STATUS_BG:   Record<string, string> = { sent: 'rgba(72,108,227,0.18)', opened: 'rgba(184,98,42,0.2)', replied: 'rgba(78,94,46,0.25)', passed: 'rgba(194,59,46,0.2)' };
const STATUS_TEXT: Record<string, string> = { sent: '#7a99ff', opened: '#e8935a', replied: '#8ab04a', passed: '#e87060' };

// ── Floating cards panel ───────────────────────────────────────────────────
function CardsStage() {
  const stageRef   = useRef<HTMLDivElement>(null);
  const indexRef   = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const [counts, setCounts] = useState({ sent: 0, opened: 0, replied: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function spawnCard() {
      if (!stage || !runningRef.current) return;
      const data = CARDS[indexRef.current % CARDS.length];
      indexRef.current++;
      const card = document.createElement('div');
      const x   = 20 + Math.random() * Math.max(0, stage.clientWidth - 260);
      const dur = 5 + Math.random() * 3;
      card.style.cssText = `position:absolute;width:220px;left:${x}px;bottom:60px;background:rgba(248,245,240,0.06);border:1px solid rgba(248,245,240,0.1);border-radius:14px;padding:14px 16px;backdrop-filter:blur(8px);box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:loginFloatUp ${dur}s linear forwards;opacity:0;pointer-events:none;`;
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-family:'Azeret Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(248,245,240,0.3)">Pitch</span>
          <span style="font-family:'Azeret Mono',monospace;font-size:9px;letter-spacing:0.07em;text-transform:uppercase;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:4px;background:${STATUS_BG[data.status]};color:${STATUS_TEXT[data.status]}">
            <span style="width:5px;height:5px;border-radius:50%;display:inline-block;background:${data.color}"></span>${STATUS_LABEL[data.status]}
          </span>
        </div>
        <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${data.name}</div>
        <div style="font-size:10px;color:rgba(248,245,240,0.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${data.meta}</div>
        <div style="margin-top:10px;height:2px;background:rgba(248,245,240,0.08);border-radius:2px;overflow:hidden">
          <div style="height:100%;border-radius:2px;width:0;animation:loginBarGrow 1s ease 0.3s forwards;--bar-w:${data.bar};background:${data.color}"></div>
        </div>`;
      stage.appendChild(card);
      if (data.status === 'sent')    setCounts(c => ({ ...c, sent:    c.sent    + 1 }));
      if (data.status === 'opened')  setCounts(c => ({ ...c, opened:  c.opened  + 1 }));
      if (data.status === 'replied') setCounts(c => ({ ...c, replied: c.replied + 1 }));
      setTimeout(() => { if (card.parentNode) card.remove(); }, dur * 1000 + 200);
    }

    function loop() {
      timerRef.current = setTimeout(() => {
        if (!runningRef.current) return;
        spawnCard(); loop();
      }, 700 + Math.random() * 800);
    }

    runningRef.current = true;
    spawnCard(); setTimeout(spawnCard, 400); loop();
    return () => { runningRef.current = false; if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }} ref={stageRef}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, #1A1A18, transparent)', zIndex: 5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, #1A1A18, transparent)', zIndex: 5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10, whiteSpace: 'nowrap' }}>
        <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#486CE3', marginBottom: 4 }}>Live pitches</p>
        <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,245,240,0.25)' }}>Sending right now</p>
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 28, zIndex: 10 }}>
        {(['sent','opened','replied'] as const).map(k => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{counts[k]}</div>
            <div style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,245,240,0.3)', marginTop: 3 }}>{k.charAt(0).toUpperCase()+k.slice(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router             = useRouter();
  const { signIn, signUp } = useAuth();
  const supabase           = useMemo(() => createClient(), []);
  const { navigateTo }     = useNavigate();

  const [tab, setTab]                     = useState<Tab>('login');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError]         = useState<AuthError | null>(null);

  const handleGoogleAuth = async () => {
    setAuthError(null); setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: 'offline', prompt: 'select_account' } },
      });
      if (error) throw error;
    } catch (err) { setAuthError(getOAuthErrorMessage(err)); setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(null);
    const result = (tab === 'login' ? LoginSchema : SignUpSchema).safeParse({ email, password });
    if (!result.success) { setAuthError({ message: result.error.errors[0]?.message ?? 'Invalid input', type: 'credentials' }); return; }
    setLoading(true);
    try {
      if (tab === 'login') { await signIn(email, password); router.push('/dashboard'); }
      else                 { await signUp(email, password); router.push('/onboarding-profile-setup'); }
    } catch (err) { setAuthError(getCredentialErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const errColor: Record<ErrorType, { bg: string; border: string; text: string }> = {
    network:     { bg: '#FFF8ED', border: '#F0C070', text: '#8A5A00' },
    oauth:       { bg: '#FFF3ED', border: '#E8A87A', text: '#7A3010' },
    credentials: { bg: 'rgba(194,59,46,0.06)',  border: 'rgba(194,59,46,0.2)',  text: '#C23B2E' },
    general:     { bg: 'rgba(72,108,227,0.06)', border: 'rgba(72,108,227,0.2)', text: '#486CE3' },
  };

  const ready = email.length > 0 && password.length > 0;

  return (
    <>
      <style>{`
        @keyframes loginFloatUp {
          0%   { opacity:0; transform:translateY(0) scale(0.92); }
          8%   { opacity:1; transform:translateY(-20px) scale(1); }
          85%  { opacity:1; transform:translateY(-300px) scale(1); }
          100% { opacity:0; transform:translateY(-360px) scale(0.95); }
        }
        @keyframes loginBarGrow { to { width: var(--bar-w); } }
        @keyframes loginShine {
          0%   { background-position: 160% center; }
          100% { background-position: -60% center; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#1A1A18' }}>

        {/* Back button */}
        <button
          onClick={() => navigateTo('/', 'back')}
          style={{ position: 'absolute', top: 24, left: 24, width: 42, height: 42, borderRadius: 11, background: 'rgba(248,245,240,0.08)', border: 'none', color: 'rgba(248,245,240,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s, color 0.18s, transform 0.2s', zIndex: 300 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,245,240,0.14)'; e.currentTarget.style.color = '#F8F5F0'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,245,240,0.08)'; e.currentTarget.style.color = 'rgba(248,245,240,0.5)'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {/* ══ LEFT — dark, cards ══ */}
        <div style={{ width: '50%', background: '#1A1A18', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <CardsStage />
          <div style={{ padding: '28px 48px 36px', flexShrink: 0, borderTop: '1px solid rgba(248,245,240,0.07)' }}>
            <button onClick={() => navigateTo('/', 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', marginBottom: 18 }}>
              <svg width="46" height="46" viewBox="0 0 38 38" fill="none" style={{ borderRadius: 10, display: 'block' }}>
                <rect width="38" height="38" rx="8" fill="#1A1A18"/>
                <rect x="10" y="8" width="3.2" height="22" fill="#F8F5F0"/>
                <rect x="13.2" y="8" width="12" height="11" fill="#486CE3"/>
                <polygon points="25.2,8 25.2,19 20,13.5" fill="#1A1A18"/>
              </svg>
            </button>
            <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#486CE3', marginBottom: 12 }}>Welcome back</p>
            <div style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1.15, backgroundImage: 'linear-gradient(120deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.3) 38%,rgba(255,255,255,0.95) 50%,rgba(255,255,255,0.3) 62%,rgba(255,255,255,0.3) 100%)', backgroundSize: '250% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'loginShine 6s ease-in-out infinite alternate', marginBottom: 10 }}>
              Your pitches<br/>are waiting.
            </div>
            <p style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, maxWidth: 300 }}>Track submissions, follow up on leads, and grow your music career.</p>
          </div>
        </div>

        {/* ══ RIGHT — light, form ══ */}
        <div style={{ width: '50%', background: '#F8F5F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px' }}>
          <div style={{ width: '100%', maxWidth: 340 }}>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #DDD8CF' }}>
              {(['login','signup'] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setAuthError(null); }}
                  style={{ padding: '10px 20px', fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 600, color: tab===t ? '#1A1A18' : '#7A7470', background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab===t ? '2px solid #1A1A18' : '2px solid transparent', marginBottom: -1, transition: 'color 0.18s, border-color 0.18s' }}>
                  {t === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogleAuth} disabled={googleLoading||loading}
              style={{ width: '100%', padding: 12, borderRadius: 9, background: 'white', border: '1.5px solid #DDD8CF', fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 600, color: '#1A1A18', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'border-color 0.18s, box-shadow 0.18s', marginBottom: 18, opacity: (googleLoading||loading) ? 0.6 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#7A7470'; e.currentTarget.style.boxShadow='0 2px 10px rgba(26,26,24,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#DDD8CF'; e.currentTarget.style.boxShadow='none'; }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: '#DDD8CF' }}/>
              <span style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 600, color: '#7A7470', letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#DDD8CF' }}/>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { id: 'email',    label: 'Email',    type: 'email',    val: email,    set: setEmail,    ph: 'you@email.com' },
                { id: 'password', label: 'Password', type: 'password', val: password, set: setPassword, ph: '••••••••'        },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ display: 'block', fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7A7470', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1.5px solid #DDD8CF', background: 'white', fontFamily: "'Epilogue',sans-serif", fontSize: 14, color: '#1A1A18', outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor='#486CE3'; e.target.style.boxShadow='0 0 0 3px rgba(72,108,227,0.1)'; }}
                    onBlur={e  => { e.target.style.borderColor=f.val ? '#4E5E2E' : '#DDD8CF'; e.target.style.boxShadow='none'; }}
                  />
                </div>
              ))}

              {tab === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <a href="/forgot-password" style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 12, color: '#7A7470', textDecoration: 'none' }}>Forgot password?</a>
                </div>
              )}

              {authError && (
                <div style={{ borderRadius: 10, padding: '10px 14px', border: `1px solid ${errColor[authError.type].border}`, background: errColor[authError.type].bg, fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 300, color: errColor[authError.type].text }}>
                  {authError.message}
                </div>
              )}

              <button type="submit" disabled={!ready||loading||googleLoading}
                style={{ width: '100%', padding: 13, borderRadius: 9, background: ready ? '#1A1A18' : '#DDD8CF', color: ready ? '#F8F5F0' : '#7A7470', fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', border: 'none', cursor: ready ? 'pointer' : 'not-allowed', marginTop: 8, transition: 'background 0.3s, color 0.3s, transform 0.18s, box-shadow 0.3s', boxShadow: ready ? '0 4px 16px rgba(26,26,24,0.18)' : 'none' }}
                onMouseEnter={e => { if (ready&&!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(26,26,24,0.22)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=ready?'0 4px 16px rgba(26,26,24,0.18)':'none'; }}>
                {loading ? (tab==='login' ? 'Signing in...' : 'Creating account...') : (tab==='login' ? 'Sign in →' : 'Create account →')}
              </button>
            </form>

            {/* Footer */}
            <p style={{ marginTop: 14, textAlign: 'center', fontFamily: "'Epilogue',sans-serif", fontSize: 12, color: '#7A7470' }}>
              {tab === 'login' ? <>Don&apos;t have an account?{' '}<button onClick={() => { setTab('signup'); setAuthError(null); }} style={{ fontFamily: "'Epilogue',sans-serif", fontWeight: 600, color: '#486CE3', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Sign up free</button></>
                               : <>Already have an account?{' '}<button onClick={() => { setTab('login');  setAuthError(null); }} style={{ fontFamily: "'Epilogue',sans-serif", fontWeight: 600, color: '#486CE3', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Sign in</button></>}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const artistCards = [
  { initials: 'MJ', name: 'MARCUS JAMES', genre: 'R&B · Soul', score: '9.2', color: '#7C3AED' },
  { initials: 'AL', name: 'ANA LIMA', genre: 'Pop · Electronic', score: '8.7', color: '#DC2626' },
  { initials: 'DK', name: 'DJ KURO', genre: 'Hip-Hop · Trap', score: '7.9', color: '#2563EB' },
  { initials: 'SR', name: 'SOFIA RAMOS', genre: 'Indie · Folk', score: '8.1', color: '#059669' },
];

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Good', color: '#3B82F6' };
  return { score, label: 'Strong', color: '#10B981' };
}

export default function PasswordResetConfirmationPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sessionReady, setSessionReady] = useState(false);

  const strength = getStrength(password);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    // Verify an active recovery session exists before allowing password update
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('[PasswordReset] Active session found for user:', session.user.id);
        setSessionReady(true);
      } else {
        console.warn('[PasswordReset] No active session — user may need to click the reset link again');
        setError('Your password reset link has expired or is invalid. Please request a new one.');
      }
    });
  }, []);

  useEffect(() => {
    if (success) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 2) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      console.log('[PasswordReset] Password updated successfully for user:', data?.user?.id ?? 'unknown');
      // Sign out after password reset so user logs in fresh with new password
      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {!success ? (
          <>
            <h1 className="text-[2rem] font-bold italic text-gray-900 mb-2 leading-tight">
              New password.
            </h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Choose a strong password to secure your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border border-gray-200 rounded px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: i <= strength.score ? strength.color : '#E5E7EB',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full border rounded px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-300 focus:outline-none transition-colors ${
                      mismatch
                        ? 'border-red-300 focus:border-red-400' :'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {mismatch && (
                  <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || mismatch || !sessionReady}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Updating password...
                  </>
                ) : (
                  <>
                    SET NEW PASSWORD
                    <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-gray-400">
              <Link href="/login" className="text-gray-700 font-semibold hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{ animation: 'checkmark-draw 0.4s ease forwards' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-[1.75rem] font-bold italic text-gray-900 mb-2 leading-tight">
              Password updated.
            </h1>
            <p className="text-sm text-gray-500 mb-2 leading-relaxed">
              Your password has been changed successfully.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Redirecting to sign in in{' '}
              <span className="font-semibold text-gray-600">{countdown}s</span>...
            </p>
            <Link
              href="/login"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Go to sign in now →
            </Link>
          </div>
        )}
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

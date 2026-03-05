'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const artistCards = [
  { initials: 'MJ', name: 'MARCUS JAMES', genre: 'R&B · Soul', score: '9.2', color: '#7C3AED' },
  { initials: 'AL', name: 'ANA LIMA', genre: 'Pop · Electronic', score: '8.7', color: '#DC2626' },
  { initials: 'DK', name: 'DJ KURO', genre: 'Hip-Hop · Trap', score: '7.9', color: '#2563EB' },
  { initials: 'SR', name: 'SOFIA RAMOS', genre: 'Indie · Folk', score: '8.1', color: '#059669' },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://pitchhood.vercel.app/password-reset-confirmation`,
      });
      if (resetError) throw resetError;
      setSent(true);
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

        {!sent ? (
          <>
            {/* Heading */}
            <h1 className="text-[2rem] font-bold italic text-gray-900 mb-2 leading-tight">
              Forgot password.
            </h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

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

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    SEND RESET LINK
                    <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-gray-400">
              Remember your password?{' '}
              <Link href="/login" className="text-gray-700 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-[1.75rem] font-bold italic text-gray-900 mb-2 leading-tight">
                Check your inbox.
              </h1>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-8">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-gray-700 font-semibold hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          </>
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

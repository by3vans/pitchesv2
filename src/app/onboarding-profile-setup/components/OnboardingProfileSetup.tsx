'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const GENRES = [
  'Pop', 'Hip-Hop', 'R&B', 'Electronic', 'Indie',
  'Rock', 'Jazz', 'Latin', 'Afrobeats', 'Country', 'Folk', 'Classical',
];

interface FormData {
  fullName: string;
  phone: string;
  company: string;
  genres: string[];
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  company?: string;
  genres?: string;
  avatar?: string;
  submit?: string;
}

export default function OnboardingProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    company: '',
    genres: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const toggleGenre = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
    if (errors.genres) setErrors(prev => ({ ...prev, genres: undefined }));
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Please upload an image file (JPG, PNG, WebP)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image must be under 5MB' }));
      return;
    }
    setAvatarFile(file);
    setErrors(prev => ({ ...prev, avatar: undefined }));
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (form.genres.length === 0) newErrors.genres = 'Select at least one genre';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) {
      setErrors({ submit: 'You must be logged in to complete onboarding.' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let avatarUrl: string | null = null;

      // Upload avatar if provided
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.log('Avatar upload error:', uploadError.message);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      // Upsert profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: form.fullName.trim(),
          phone: form.phone || null,
          company: form.company.trim() || null,
          genre_preferences: form.genres,
          onboarding_completed: true,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile save error:', profileError.message);
        setErrors({ submit: profileError.message });
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const artistCards = [
    { initials: 'MJ', name: 'MARCUS JAMES', genre: 'R&B · Soul', score: '9.2', color: '#7C3AED' },
    { initials: 'AL', name: 'ANA LIMA', genre: 'Pop · Electronic', score: '8.7', color: '#DC2626' },
    { initials: 'DK', name: 'DJ KURO', genre: 'Hip-Hop · Trap', score: '7.9', color: '#2563EB' },
    { initials: 'SR', name: 'SOFIA RAMOS', genre: 'Indie · Folk', score: '8.1', color: '#059669' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-full md:w-[400px] lg:w-[440px] flex-shrink-0 bg-white flex flex-col justify-start px-10 py-10 overflow-y-auto">
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/assets/images/pitchhood-logo-light-1772649730204.png"
            alt="Pitchhood logo"
            width={140}
            height={36}
            className="object-contain"
            priority
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Account</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">2</span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-900">Profile</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-400">3</span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Done</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[1.75rem] font-bold italic text-gray-900 mb-1 leading-tight">
          Set up your profile.
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Tell us about yourself so we can personalize your A&amp;R experience.
        </p>

        {/* Success State */}
        {success && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Profile saved!</p>
              <p className="text-xs text-green-600">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">
              Profile Photo <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors text-center ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50' :'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500">
                  {avatarFile ? (
                    <span className="text-gray-700 font-medium">{avatarFile.name}</span>
                  ) : (
                    <>
                      <span className="text-gray-700 font-medium">Drop image here</span> or{' '}
                      <span className="text-blue-600 font-medium">browse</span>
                    </>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
            {errors.avatar && (
              <p className="text-xs text-red-500 mt-1">{errors.avatar}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => {
                setForm(prev => ({ ...prev, fullName: e.target.value }));
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Your full name"
              className={`w-full border rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none transition-colors ${
                errors.fullName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
              }`}
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
              Phone Number <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">
              Company / Label <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Your label or company name"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Genre Preferences */}
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">
              Genre Preferences <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const selected = form.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900' :'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {selected && (
                      <span className="mr-1">✓</span>
                    )}
                    {genre}
                  </button>
                );
              })}
            </div>
            {errors.genres && <p className="text-xs text-red-500 mt-1.5">{errors.genres}</p>}
            {form.genres.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5">{form.genres.length} genre{form.genres.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
              {errors.submit}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving profile...
              </>
            ) : success ? (
              'Profile saved!'
            ) : (
              <>
                Complete Setup
                <span aria-hidden>→</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            You can update these details anytime in{' '}
            <a href="/settings" className="text-gray-600 hover:underline font-medium">Settings</a>.
          </p>
        </form>
      </div>

      {/* Right Panel — Platform Preview */}
      <div className="hidden md:flex flex-1 bg-[#0f0f0f] items-center justify-center relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating app mockup */}
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

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 60% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

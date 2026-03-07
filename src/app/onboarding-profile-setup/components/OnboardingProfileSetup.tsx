'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Cubes from './Cubes';

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

// ── Flag-P Logo ───────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="4" height="26" rx="2" fill="#1A1A18" />
        <path d="M4 2 L18 10 L4 18 Z" fill="#486CE3" />
      </svg>
      <span style={{
        fontFamily: "'Cabinet Grotesk', sans-serif",
        fontWeight: 800, fontSize: '1.1rem',
        letterSpacing: '-0.03em', color: '#1A1A18', lineHeight: 1,
      }}>PitchHood</span>
    </div>
  );
}

export default function OnboardingProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({ fullName: '', phone: '', company: '', genres: [] });
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

  const toggleGenre = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre],
    }));
    if (errors.genres) setErrors(prev => ({ ...prev, genres: undefined }));
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setErrors(prev => ({ ...prev, avatar: 'Please upload an image file (JPG, PNG, WebP)' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, avatar: 'Image must be under 5MB' })); return; }
    setAvatarFile(file);
    setErrors(prev => ({ ...prev, avatar: undefined }));
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

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
    if (!user) { setErrors({ submit: 'You must be logged in to complete onboarding.' }); return; }
    setLoading(true); setErrors({});
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.fullName.trim(),
        phone: form.phone || null,
        company: form.company.trim() || null,
        genre_preferences: form.genres,
        onboarding_completed: true,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }, { onConflict: 'id' });
      if (profileError) { setErrors({ submit: profileError.message }); return; }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    label: {
      display: 'block',
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '0.62rem', fontWeight: 500,
      letterSpacing: '0.16em', textTransform: 'uppercase' as const,
      color: '#7A7470', marginBottom: 6,
    },
    input: (hasError?: boolean) => ({
      width: '100%',
      fontFamily: "'Epilogue', sans-serif", fontWeight: 300,
      fontSize: '0.875rem', color: '#1A1A18',
      background: '#FFFFFF',
      border: `1px solid ${hasError ? 'rgba(194,59,46,0.4)' : 'rgba(107,101,80,0.2)'}`,
      borderRadius: 8, padding: '10px 13px',
      outline: 'none', transition: 'border-color 150ms',
    }),
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: '100%', maxWidth: 440, flexShrink: 0,
        background: '#F8F5F0',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '40px 40px', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}><Logo /></div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Account', done: true, active: false },
            { label: 'Profile', done: false, active: true },
            { label: 'Done', done: false, active: false },
          ].map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: i < 2 ? 0 : undefined, flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.done || step.active ? '#1A1A18' : 'transparent',
                  border: step.done || step.active ? 'none' : '1px solid rgba(107,101,80,0.3)',
                }}>
                  {step.done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F0ECE6" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span style={{ fontFamily: "'Azeret Mono', monospace", fontSize: '0.6rem', fontWeight: 700, color: step.active ? '#F0ECE6' : '#7A7470' }}>{i + 1}</span>
                  )}
                </div>
                <span style={{
                  fontFamily: "'Azeret Mono', monospace", fontSize: '0.62rem',
                  fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: step.active ? '#1A1A18' : '#7A7470',
                }}>{step.label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: 'rgba(107,101,80,0.2)', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 900, fontSize: '1.75rem', lineHeight: 1.1, color: '#1A1A18', marginBottom: 8 }}>
          Set up your profile.
        </h1>
        <p style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 300, fontSize: '0.875rem', lineHeight: 1.75, color: '#7A7470', marginBottom: 28 }}>
          Tell us about yourself so we can personalize your A&amp;R experience.
        </p>

        {/* Success */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(78,94,46,0.08)', border: '1px solid rgba(78,94,46,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4E5E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: '0.875rem', color: '#4E5E2E' }}>Profile saved!</p>
              <p style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#627A3A' }}>Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Avatar Upload */}
          <div>
            <label style={S.label}>
              Profile Photo <span style={{ color: '#7A7470', textTransform: 'none', letterSpacing: 'normal', fontWeight: 300 }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(107,101,80,0.2)', overflow: 'hidden', flexShrink: 0, background: '#F0ECE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DDD8CF" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                )}
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1, border: `2px dashed ${isDragging ? '#486CE3' : 'rgba(107,101,80,0.2)'}`,
                  borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  textAlign: 'center', background: isDragging ? 'rgba(72,108,227,0.04)' : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.8rem', color: '#7A7470', fontWeight: 300 }}>
                  {avatarFile ? (
                    <span style={{ color: '#1A1A18', fontWeight: 400 }}>{avatarFile.name}</span>
                  ) : (
                    <><span style={{ color: '#1A1A18', fontWeight: 500 }}>Drop here</span> or <span style={{ color: '#486CE3', fontWeight: 500 }}>browse</span></>
                  )}
                </p>
                <p style={{ fontFamily: "'Azeret Mono', monospace", fontSize: '0.6rem', color: '#7A7470', marginTop: 3, letterSpacing: '0.08em' }}>JPG · PNG · WebP · Max 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>
            {errors.avatar && <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.75rem', color: '#C23B2E', marginTop: 4 }}>{errors.avatar}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label style={S.label}>Full Name <span style={{ color: '#C23B2E' }}>*</span></label>
            <input type="text" value={form.fullName}
              onChange={e => { setForm(prev => ({ ...prev, fullName: e.target.value })); if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined })); }}
              placeholder="Your full name" style={S.input(!!errors.fullName)}
              onFocus={e => (e.target.style.borderColor = '#486CE3')}
              onBlur={e => (e.target.style.borderColor = errors.fullName ? 'rgba(194,59,46,0.4)' : 'rgba(107,101,80,0.2)')}
            />
            {errors.fullName && <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.75rem', color: '#C23B2E', marginTop: 4 }}>{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label style={S.label}>Phone <span style={{ color: '#7A7470', textTransform: 'none', letterSpacing: 'normal', fontWeight: 300 }}>(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
              placeholder="(11) 99999-9999" style={S.input()}
              onFocus={e => (e.target.style.borderColor = '#486CE3')}
              onBlur={e => (e.target.style.borderColor = 'rgba(107,101,80,0.2)')}
            />
          </div>

          {/* Company */}
          <div>
            <label style={S.label}>Company / Label <span style={{ color: '#7A7470', textTransform: 'none', letterSpacing: 'normal', fontWeight: 300 }}>(optional)</span></label>
            <input type="text" value={form.company} onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Your label or company name" style={S.input()}
              onFocus={e => (e.target.style.borderColor = '#486CE3')}
              onBlur={e => (e.target.style.borderColor = 'rgba(107,101,80,0.2)')}
            />
          </div>

          {/* Genres */}
          <div>
            <label style={S.label}>Genre Preferences <span style={{ color: '#C23B2E' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENRES.map(genre => {
                const selected = form.genres.includes(genre);
                return (
                  <button key={genre} type="button" onClick={() => toggleGenre(genre)}
                    style={{
                      padding: '6px 14px', borderRadius: 20,
                      fontFamily: "'Azeret Mono', monospace", fontSize: '0.68rem',
                      fontWeight: 500, letterSpacing: '0.08em',
                      border: `1px solid ${selected ? '#486CE3' : 'rgba(107,101,80,0.2)'}`,
                      background: selected ? '#486CE3' : 'transparent',
                      color: selected ? '#fff' : '#7A7470',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    {selected && '✓ '}{genre}
                  </button>
                );
              })}
            </div>
            {errors.genres && <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.75rem', color: '#C23B2E', marginTop: 6 }}>{errors.genres}</p>}
            {form.genres.length > 0 && (
              <p style={{ fontFamily: "'Azeret Mono', monospace", fontSize: '0.6rem', color: '#7A7470', marginTop: 6, letterSpacing: '0.08em' }}>
                {form.genres.length} genre{form.genres.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.8rem', fontWeight: 300, color: '#C23B2E', background: 'rgba(194,59,46,0.06)', border: '1px solid rgba(194,59,46,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              {errors.submit}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading || success}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#1A1A18', color: '#F0ECE6',
              fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700,
              fontSize: '0.9rem', letterSpacing: '-0.01em',
              padding: '13px 20px', borderRadius: 10, border: 'none',
              cursor: 'pointer', transition: 'background 0.2s',
              opacity: (loading || success) ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading && !success) e.currentTarget.style.background = '#252522'; }}
            onMouseLeave={e => (e.currentTarget.style.background = '#1A1A18')}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving profile...
              </>
            ) : success ? 'Profile saved!' : <>Complete Setup →</>}
          </button>

          <p style={{ textAlign: 'center', fontFamily: "'Epilogue', sans-serif", fontSize: '0.75rem', color: '#7A7470', fontWeight: 300 }}>
            You can update these details anytime in{' '}
            <a href="/settings" style={{ color: '#1A1A18', fontWeight: 500 }}>Settings</a>.
          </p>
        </form>
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
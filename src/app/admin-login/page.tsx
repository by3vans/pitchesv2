'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Invalid credentials');
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied');
      setLoading(false);
      return;
    }
    router.push('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>PITCHHOOD</div>
          <div style={{ fontSize: 15, color: '#6b5fa0', fontWeight: 400 }}>Admin Portal</div>
        </div>
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '14px 16px', background: '#1a1230', border: '1px solid #2d1f4e', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '14px 16px', background: '#1a1230', border: '1px solid #2d1f4e', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
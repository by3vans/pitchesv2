'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Network map data ───────────────────────────────────────────────────────
const NODES_DATA = [
  // Ring 0
  { label: 'Scooter Braun',     role: 'Manager',   color: '#486CE3' },
  { label: 'Irving Azoff',      role: 'Manager',   color: '#486CE3' },
  { label: 'Troy Carter',       role: 'Manager',   color: '#486CE3' },
  { label: 'Metro Boomin',      role: 'Producer',  color: '#B8622A' },
  { label: 'Pete Rock',         role: 'Producer',  color: '#B8622A' },
  { label: 'Spotify Editorial', role: 'Editorial', color: '#C23B2E' },
  // Ring 1
  { label: 'UMPG',              role: 'Publisher', color: '#4E5E2E' },
  { label: 'Sony Music Pub.',   role: 'Publisher', color: '#4E5E2E' },
  { label: 'Kobalt Music',      role: 'Publisher', color: '#4E5E2E' },
  { label: 'Roc Nation A&R',   role: 'A&R',       color: '#486CE3' },
  { label: 'Columbia A&R',      role: 'A&R',       color: '#486CE3' },
  { label: 'Atlantic Records',  role: 'A&R',       color: '#486CE3' },
  { label: 'Mike Will Made-It', role: 'Producer',  color: '#B8622A' },
  { label: 'Hit-Boy',           role: 'Producer',  color: '#B8622A' },
  { label: 'Nettwerk Music',    role: 'Manager',   color: '#486CE3' },
  { label: 'COLORS Berlin',     role: 'Editorial', color: '#C23B2E' },
  // Ring 2
  { label: 'Warner Chappell',   role: 'Publisher', color: '#4E5E2E' },
  { label: 'BMG Rights',        role: 'Publisher', color: '#4E5E2E' },
  { label: 'Def Jam A&R',       role: 'A&R',       color: '#486CE3' },
  { label: 'XO Records',        role: 'A&R',       color: '#486CE3' },
  { label: 'Interscope A&R',    role: 'A&R',       color: '#486CE3' },
  { label: 'WME Music',         role: 'Manager',   color: '#486CE3' },
  { label: 'CAA Sync',          role: 'Sync',      color: '#7A7470' },
  { label: 'Music Bed',         role: 'Sync',      color: '#7A7470' },
  { label: 'Artlist',           role: 'Sync',      color: '#7A7470' },
  { label: 'Murda Beatz',       role: 'Producer',  color: '#B8622A' },
  { label: 'Ones To Watch',     role: 'Blog',      color: '#C23B2E' },
  { label: 'The FADER',         role: 'Blog',      color: '#C23B2E' },
  { label: 'Pigeons & Planes',  role: 'Blog',      color: '#C23B2E' },
  { label: 'UnitedMasters',     role: 'Distrib.',  color: '#7A7470' },
];

const RINGS = [
  { count: 6,  r: 108, opacity: 1.0,  size: 6 },
  { count: 10, r: 195, opacity: 0.70, size: 5 },
  { count: 14, r: 282, opacity: 0.38, size: 4 },
];

// ── Network Canvas ─────────────────────────────────────────────────────────
function NetworkMap({ avatarSrc }: { avatarSrc: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const rafRef    = useRef<number>(0);
  const stateRef  = useRef<{
    nodes: any[]; edges: any[]; particles: any[];
    W: number; H: number; cx: number; cy: number;
  }>({ nodes: [], edges: [], particles: [], W: 0, H: 0, cx: 0, cy: 0 });

  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!avatarSrc) { avatarImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { avatarImgRef.current = img; };
    img.src = avatarSrc;
  }, [avatarSrc]);

  const d2 = (a: any, b: any) => (a.x-b.x)**2 + (a.y-b.y)**2;

  const buildGraph = useCallback((W: number, H: number) => {
    const cx = W / 2, cy = H / 2;
    const nodes: any[] = [], edges: any[] = [];
    let ni = 0;
    RINGS.forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const angle  = (i / ring.count) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.28;
        const jitter = (Math.random() - 0.5) * ring.r * 0.18;
        const d      = NODES_DATA[ni] || NODES_DATA[0];
        const ox     = cx + Math.cos(angle) * (ring.r + jitter);
        const oy     = cy + Math.sin(angle) * (ring.r + jitter);
        nodes.push({ x:ox, y:oy, ox, oy, r:ring.size, color:d.color, opacity:ring.opacity, label:d.label, role:d.role, ring:ri, phase:Math.random()*Math.PI*2, born: ni*14 + Math.floor(Math.random()*10), alive:false, pulseT:0 });
        ni++;
      }
    });
    nodes.forEach((n, i) => {
      if (n.ring === 0) {
        edges.push({ a:-1, b:i, born:n.born+4 });
      } else {
        const prev = nodes.map((m,j)=>({m,j})).filter(({m})=>m.ring===n.ring-1);
        const cl   = prev.sort((a,b)=>d2(n,a.m)-d2(n,b.m))[0];
        if (cl) edges.push({ a:cl.j, b:i, born:n.born+6 });
      }
    });
    const r0 = nodes.map((n,i)=>({n,i})).filter(({n})=>n.ring===0);
    r0.forEach(({n,i},k) => {
      const nx = r0[(k+1)%r0.length];
      edges.push({ a:i, b:nx.i, born:Math.max(n.born,nx.n.born)+18, cross:true });
    });
    return { nodes, edges, cx, cy };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;

    const resize = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      canvas.width  = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      const { nodes, edges, cx, cy } = buildGraph(W, H);
      stateRef.current = { nodes, edges, particles: [], W, H, cx, cy };
      frame = 0;
    };

    const spawnP = (e: any) => {
      stateRef.current.particles.push({ e, t:0, spd:0.003+Math.random()*0.0035, blue:Math.random()>0.45, sz:1.5+Math.random()*1.6 });
    };

    const gp = (i: number) => i===-1 ? { x: stateRef.current.cx, y: stateRef.current.cy } : stateRef.current.nodes[i];

    const draw = () => {
      frame++;
      const { nodes, edges, W, H, cx, cy } = stateRef.current;
      let { particles } = stateRef.current;
      ctx.clearRect(0,0,W,H);

      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,210);
      g.addColorStop(0,'rgba(72,108,227,0.09)'); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

      nodes.forEach((n,ni) => {
        if (!n.alive && frame>=n.born) {
          n.alive=true; n.pulseT=1;
          setTimeout(()=>{ edges.forEach(e=>{ if(e.alive&&(e.a===ni||e.b===ni)&&Math.random()>0.4) spawnP(e); }); },500);
        }
        if (!n.alive) return;
        n.phase+=0.007;
        n.x = n.ox + Math.cos(n.phase)*3.5 + Math.sin(n.phase*0.7)*1.8;
        n.y = n.oy + Math.sin(n.phase)*3.5 + Math.cos(n.phase*0.9)*1.8;
        if (n.pulseT>0) n.pulseT=Math.max(0,n.pulseT-0.022);
      });

      edges.forEach(e => {
        const nb=nodes[e.b]; if(!nb||!nb.alive) return;
        e.alive=true;
        const a=gp(e.a),b=gp(e.b);
        const alpha=e.cross?0.07:(nb.ring===0?0.28:nb.ring===1?0.15:0.08);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(72,108,227,${alpha})`;
        ctx.lineWidth=e.cross?0.5:(nb.ring===0?1.2:0.7); ctx.stroke();
      });

      nodes.forEach(n => {
        if (!n.alive) return;
        if (n.pulseT>0) {
          ctx.beginPath(); ctx.arc(n.x,n.y,n.r+(1-n.pulseT)*22,0,Math.PI*2);
          ctx.fillStyle=`rgba(72,108,227,${n.pulseT*0.1})`; ctx.fill();
        }
        const gl=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*2.8);
        gl.addColorStop(0,n.color+'28'); gl.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*2.8,0,Math.PI*2); ctx.fillStyle=gl; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle=n.color+Math.round(n.opacity*255).toString(16).padStart(2,'0'); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x-n.r*.28,n.y-n.r*.28,n.r*.38,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${n.opacity*.28})`; ctx.fill();
        ctx.textAlign='center';
        if (n.ring===0) {
          ctx.font=`600 10px 'Azeret Mono',monospace`; ctx.fillStyle='rgba(248,245,240,0.62)';
          ctx.fillText(n.label,n.x,n.y+n.r+14);
          ctx.font=`500 8.5px 'Azeret Mono',monospace`; ctx.fillStyle=n.color+'bb';
          ctx.fillText(n.role.toUpperCase(),n.x,n.y+n.r+25);
        } else if (n.ring===1) {
          ctx.font=`500 9px 'Azeret Mono',monospace`; ctx.fillStyle='rgba(248,245,240,0.28)';
          ctx.fillText(n.label,n.x,n.y+n.r+13);
        }
      });

      stateRef.current.particles = particles.filter(p=>p.t<1);
      stateRef.current.particles.forEach(p => {
        p.t+=p.spd;
        const a=gp(p.e.a),b=gp(p.e.b);
        const x=a.x+(b.x-a.x)*p.t, y=a.y+(b.y-a.y)*p.t;
        const fade=Math.sin(p.t*Math.PI);
        ctx.beginPath(); ctx.arc(x,y,p.sz,0,Math.PI*2);
        ctx.fillStyle=p.blue?`rgba(72,108,227,${fade*.9})`:`rgba(248,245,240,${fade*.5})`; ctx.fill();
      });

      if (frame%35===0) {
        const al=edges.filter(e=>e.alive);
        if(al.length) spawnP(al[Math.floor(Math.random()*al.length)]);
      }
      ctx.textAlign='left';
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, [buildGraph]);

  return (
    <div style={{ width: '50%', minHeight: '100vh', background: '#1A1A18', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Center node */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 6, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#486CE3', animation: 'obCenterPulse 2.4s ease-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2.5px solid rgba(72,108,227,0.7)', position: 'relative' }}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', position: 'absolute', inset: 0 }} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#486CE3' }} id="ob-center-label">You</span>
      </div>

      {/* Bottom label */}
      <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 5, pointerEvents: 'none' }}>
        <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#486CE3', marginBottom: 6 }}>Your network awaits</p>
        <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(248,245,240,0.2)' }}>Managers · Publishers · A&Rs · Producers · Sync</p>
      </div>

      <style>{`
        @keyframes obCenterPulse {
          0%   { box-shadow: 0 0 0 0 rgba(72,108,227,0.55); }
          70%  { box-shadow: 0 0 0 26px rgba(72,108,227,0); }
          100% { box-shadow: 0 0 0 0 rgba(72,108,227,0); }
        }
      `}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface FormData { fullName: string; role: string; company: string; }
interface FormErrors { fullName?: string; submit?: string; }

export default function OnboardingProfileSetup() {
  const router   = useRouter();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm]               = useState<FormData>({ fullName: '', role: '', company: '' });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  // Update center label reactively
  useEffect(() => {
    const el = document.getElementById('ob-center-label');
    if (el) el.textContent = form.fullName.trim() || 'You';
  }, [form.fullName]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = e => setAvatarSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setErrors({ fullName: 'Full name is required' }); return; }
    if (!user) { setErrors({ submit: 'You must be logged in.' }); return; }
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
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.fullName.trim(),
        role: form.role.trim() || null,
        company: form.company.trim() || null,
        onboarding_completed: true,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }, { onConflict: 'id' });
      if (error) { setErrors({ submit: error.message }); return; }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: '1.5px solid #DDD8CF', background: 'white',
    fontFamily: "'Epilogue',sans-serif", fontSize: 14, color: '#1A1A18',
    outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'Azeret Mono',monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A7470', marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1A1A18' }}>

      {/* LEFT — network map */}
      <NetworkMap avatarSrc={avatarSrc} />

      {/* RIGHT — form */}
      <div style={{ width: '50%', background: '#F8F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          <p style={{ fontFamily: "'Azeret Mono',monospace", fontSize: 11, fontWeight: 700, color: '#486CE3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Almost there</p>
          <h2 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 28, fontWeight: 800, color: '#1A1A18', marginBottom: 8, lineHeight: 1.1 }}>Set up your profile.</h2>
          <p style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 13, color: '#7A7470', lineHeight: 1.65, marginBottom: 24 }}>We just need to know a bit about you before we get started.</p>

          {/* Photo upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, border: '1.5px dashed #DDD8CF', background: 'white', cursor: 'pointer', marginBottom: 18, transition: 'border-color 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#7A7470')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#DDD8CF')}
          >
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#F8F5F0', border: '1.5px solid #DDD8CF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A7470" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1A18', marginBottom: 2, fontFamily: "'Epilogue',sans-serif" }}>Profile photo</span>
              <span style={{ display: 'block', fontSize: 11, color: '#7A7470', fontFamily: "'Azeret Mono',monospace" }}>{avatarSrc ? 'Photo selected ✓' : 'Click to upload · JPG or PNG'}</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: '#C23B2E' }}>*</span></label>
              <input
                type="text" value={form.fullName} placeholder="e.g. Alex Carter" required
                onChange={e => { setForm(p=>({...p,fullName:e.target.value})); setErrors({}); }}
                style={{ ...inputStyle, borderColor: errors.fullName ? 'rgba(194,59,46,0.4)' : '#DDD8CF' }}
                onFocus={e => { e.target.style.borderColor='#486CE3'; e.target.style.boxShadow='0 0 0 3px rgba(72,108,227,0.1)'; }}
                onBlur={e  => { e.target.style.borderColor=form.fullName?'#4E5E2E':'#DDD8CF'; e.target.style.boxShadow='none'; }}
              />
              {errors.fullName && <p style={{ fontFamily:"'Epilogue',sans-serif", fontSize:12, color:'#C23B2E', marginTop:4 }}>{errors.fullName}</p>}
            </div>

            <div>
              <label style={labelStyle}>Role</label>
              <input
                type="text" value={form.role} placeholder="e.g. A&R Manager, Music Scout…"
                onChange={e => setForm(p=>({...p,role:e.target.value}))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#486CE3'; e.target.style.boxShadow='0 0 0 3px rgba(72,108,227,0.1)'; }}
                onBlur={e  => { e.target.style.borderColor=form.role?'#4E5E2E':'#DDD8CF'; e.target.style.boxShadow='none'; }}
              />
            </div>

            <div>
              <label style={labelStyle}>Company / Label</label>
              <input
                type="text" value={form.company} placeholder="e.g. Sony Music, Independent…"
                onChange={e => setForm(p=>({...p,company:e.target.value}))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#486CE3'; e.target.style.boxShadow='0 0 0 3px rgba(72,108,227,0.1)'; }}
                onBlur={e  => { e.target.style.borderColor=form.company?'#4E5E2E':'#DDD8CF'; e.target.style.boxShadow='none'; }}
              />
            </div>

            {errors.submit && (
              <div style={{ borderRadius:10, padding:'10px 14px', border:'1px solid rgba(194,59,46,0.2)', background:'rgba(194,59,46,0.06)', fontFamily:"'Epilogue',sans-serif", fontSize:13, color:'#C23B2E' }}>
                {errors.submit}
              </div>
            )}

            {success && (
              <div style={{ borderRadius:10, padding:'10px 14px', border:'1px solid rgba(78,94,46,0.2)', background:'rgba(78,94,46,0.08)', fontFamily:"'Epilogue',sans-serif", fontSize:13, color:'#4E5E2E' }}>
                Profile saved! Redirecting…
              </div>
            )}

            <button
              type="submit" disabled={loading || success}
              style={{ width:'100%', padding:13, borderRadius:9, background: form.fullName.trim() ? '#1A1A18' : '#DDD8CF', color: form.fullName.trim() ? '#F8F5F0' : '#7A7470', fontFamily:"'Epilogue',sans-serif", fontSize:13, fontWeight:700, letterSpacing:'0.04em', border:'none', cursor: form.fullName.trim() ? 'pointer' : 'not-allowed', marginTop:8, transition:'background 0.3s, color 0.3s, transform 0.18s, box-shadow 0.3s', boxShadow: form.fullName.trim() ? '0 4px 16px rgba(26,26,24,0.18)' : 'none', opacity: (loading||success) ? 0.6 : 1 }}
              onMouseEnter={e => { if(form.fullName.trim()&&!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(26,26,24,0.22)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=form.fullName.trim()?'0 4px 16px rgba(26,26,24,0.18)':'none'; }}
            >
              {loading ? 'Saving…' : success ? 'Profile saved!' : 'Enter Pitchhood →'}
            </button>
          </form>

          <p style={{ marginTop:14, textAlign:'center', fontFamily:"'Epilogue',sans-serif", fontSize:12, color:'#7A7470' }}>
            You can update these anytime in <a href="/dashboard/settings" style={{ color:'#486CE3', textDecoration:'none', fontWeight:600 }}>Settings</a>.
          </p>
          <div style={{ textAlign:'center', marginTop:14 }}>
            <a
              href="/dashboard"
              style={{ fontFamily:"'Azeret Mono',monospace", fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#7A7470', textDecoration:'none', opacity:0.7, transition:'opacity 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity='1')}
              onMouseLeave={e => (e.currentTarget.style.opacity='0.7')}
            >
              Skip for now →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
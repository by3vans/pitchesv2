'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import StaggeredMenu from './StaggeredMenu';
import './StaggeredMenu.css';

const AnimatedPitchDemo = dynamic(() => import('./AnimatedPitchDemo'), { ssr: false });

// ─── Data ─────────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Universal Music', 'Sony Music', 'Warner Records', 'Def Jam',
  'Atlantic Records', 'Interscope', 'Republic Records', 'LANDR',
  'DistroKid', 'AWAL', 'TuneCore', 'Spotify for Artists',
];

const FEATURES = [
  { num: '01', title: 'PITCH TRACKING', desc: 'Log every pitch you send — to labels, A&Rs, managers, or producers. Track status, follow-up dates, and outcomes in one view.', wide: true },
  { num: '02', title: 'ARTIST MANAGEMENT', desc: 'Manage your full roster. See which artists have the highest placement rates.', wide: false },
  { num: '03', title: 'ANALYTICS & SCORES', desc: 'Track approval rates, response times, and which labels are actually opening your submissions.', wide: false },
  { num: '04', title: 'SMART REMINDERS', desc: "Set follow-up reminders for every pitch. Get notified when it's time to check in.", wide: false },
  { num: '05', title: 'TEMPLATES & CONTACT BOOK', desc: 'Create reusable pitch email templates and store every A&R, manager, and producer contact with notes.', wide: true },
];

const HOW_STEPS = [
  { num: '01', title: 'LOG YOUR PITCH', desc: 'Add a pitch in seconds — song title, who you sent it to, date, and notes.' },
  { num: '02', title: 'TRACK THE STATUS', desc: 'Update status as things progress — Sent, In Review, Approved, Rejected.' },
  { num: '03', title: 'GET REMINDERS', desc: "Set follow-up dates. Pitchhood reminds you when it's time to check in." },
  { num: '04', title: 'GET PLACED', desc: 'Track placements, measure your approval rate, and double down on what\'s working.' },
];

const PRICING_PLANS = [
  {
    name: 'STARTER', price: '$0', period: 'Forever free',
    features: ['Up to 20 pitches', '5 artists', 'Basic tracking', 'Email reminders'],
    crossed: ['Analytics', 'Templates'],
    cta: 'Get started free', ctaStyle: 'ghost', highlight: false,
  },
  {
    name: 'PRO', price: '$29', period: '/mo billed annually', badge: 'Most popular',
    features: ['Unlimited pitches', 'Unlimited artists', 'Analytics & scores', 'Templates library', 'Unlimited contacts', 'Priority reminders'],
    crossed: [],
    cta: 'Start Pro trial', ctaStyle: 'solid', highlight: true,
  },
  {
    name: 'AGENCY', price: '$79', period: '/mo billed annually',
    features: ['Everything in Pro', 'Up to 5 team members', 'Shared contact book', 'Team activity feed', 'Custom reports', 'Priority support'],
    crossed: [],
    cta: 'Contact sales', ctaStyle: 'dark', highlight: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function handleCtaClick(router: ReturnType<typeof useRouter>, target = '/login?tab=signup') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  router.push(user ? '/dashboard' : target);
}

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeUp();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>{children}</div>
  );
}

// ─── Flag-P Logo SVG inline ───────────────────────────────────────────────────
function LogoMark({ dark = false, size = 1 }: { dark?: boolean; size?: number }) {
  const ink = dark ? '#F0ECE6' : '#1A1A18';
  const w = Math.round(18 * size);
  const h = Math.round(26 * size);
  return (
    <svg width={w} height={h} viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="4" height="26" rx="2" fill={ink} />
      <path d="M4 2 L18 10 L4 18 Z" fill="#486CE3" />
    </svg>
  );
}

function LogoFull({ dark = false, size = 1 }: { dark?: boolean; size?: number }) {
  const ink = dark ? '#F0ECE6' : '#1A1A18';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark dark={dark} size={size} />
      <span style={{
        fontFamily: "'Cabinet Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: `${1.35 * size}rem`,
        letterSpacing: '-0.035em',
        color: ink,
        lineHeight: 1,
      }}>PitchHood</span>
    </div>
  );
}

// ─── App Mockup ───────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <>
      <div style={{ background: '#1A1A18', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, background: '#252522', borderRadius: 6, padding: '4px 12px', fontFamily: "'Azeret Mono', monospace", fontSize: '0.7rem', color: '#5A5652', textAlign: 'center', letterSpacing: '0.04em' }}>
          app.pitchhood.com/pitches
        </div>
      </div>
      <AnimatedPitchDemo />
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [navDark, setNavDark] = useState(false);
  const howRef = useRef<HTMLDivElement>(null);
  const howVisible = useRef(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cursor CSS
  useEffect(() => {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    let rx = -100, ry = -100, mx = -100, my = -100;
    let raf: number;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    };
    const animate = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
      raf = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // Nav dark detection
  useEffect(() => {
    const onScroll = () => {
      const darkSections = document.querySelectorAll('[data-dark-section]');
      let isDark = false;
      darkSections.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 80) isDark = true;
      });
      setNavDark(isDark);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // How it works animation
  useEffect(() => {
    const el = howRef.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !howVisible.current) { howVisible.current = true; startStepAnimation(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const startStepAnimation = useCallback(() => {
    let step = 0, progress = 0;
    const DURATION = 2200, TICK = 30;
    const runTick = () => {
      progress += (TICK / DURATION) * 100;
      if (progress >= 100) { progress = 0; step = (step + 1) % 4; setActiveStep(step); }
      setStepProgress(progress);
      animRef.current = setTimeout(runTick, TICK);
    };
    setActiveStep(0); setStepProgress(0);
    animRef.current = setTimeout(runTick, TICK);
  }, []);

  useEffect(() => { return () => { if (animRef.current) clearTimeout(animRef.current); }; }, []);

  // ── Design tokens (inline for portability) ──────────────────────────────────
  const T = {
    bg:         '#F8F5F0',
    bgSurface:  '#F0ECE6',
    bgRaised:   '#E8E3DC',
    bgCard:     '#FFFFFF',
    bgDark:     '#1A1A18',
    bgDark2:    '#252522',
    bgDark3:    '#2E2D2A',
    text:       '#1A1A18',
    text2:      '#3A3836',
    muted:      '#7A7470',
    cream:      '#DDD8CF',
    border:     'rgba(107,101,80,0.16)',
    border2:    'rgba(107,101,80,0.09)',
    blue:       '#486CE3',
    blueLt:     '#6692EA',
    blueDk:     '#3558C8',
    blueBg:     'rgba(72,108,227,0.08)',
    olive:      '#4E5E2E',
    oliveBg:    'rgba(78,94,46,0.10)',
    orange:     '#B8622A',
    orangeBg:   'rgba(184,98,42,0.10)',
    crimson:    '#C23B2E',
    crimsonBg:  'rgba(194,59,46,0.10)',
    // text on dark
    textDark:   '#F0ECE6',
    mutedDark:  '#7A7470',
    borderDark: 'rgba(221,216,207,0.14)',
    borderDark2:'rgba(221,216,207,0.07)',
    blueBgDark: 'rgba(72,108,227,0.14)',
  };

  const F = {
    display:  "'Cabinet Grotesk', sans-serif",
    body:     "'Epilogue', sans-serif",
    mono:     "'Azeret Mono', monospace",
    serif:    "'Playfair Display', serif",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Epilogue:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,700&family=Azeret+Mono:wght@400;500&family=Playfair+Display:ital,wght@1,700;1,800;1,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${T.bg}; cursor: none !important; }
        a, button, [role="button"] { cursor: none !important; }

        #cursor-dot {
          position: fixed; width: 8px; height: 8px; border-radius: 50%;
          background: ${T.blue}; pointer-events: none; z-index: 9999;
          top: 0; left: 0; will-change: transform;
        }
        #cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1.5px solid rgba(72,108,227,0.45); pointer-events: none;
          z-index: 9998; top: 0; left: 0; will-change: transform;
        }

        .marquee-track { display: flex; animation: marquee 28s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.13; animation: floatBlob 8s ease-in-out infinite; }
        @keyframes floatBlob {
          0%,100% { transform: translateY(0px) scale(1); }
          33% { transform: translateY(-22px) scale(1.04); }
          66% { transform: translateY(10px) scale(0.97); }
        }

        .feature-cell { transition: background 0.2s; }
        .feature-cell:hover { background: ${T.bgCard} !important; }
        .step-card { transition: background 0.3s, border-color 0.3s; }

        .hero-layout {
          display: grid;
          grid-template-columns: 1fr 6fr;
          min-height: 680px;
          align-items: stretch;
          position: relative;
        }
        .hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 140px 40px 80px max(24px, calc((100vw - 1300px) / 2 + 24px));
          position: relative; z-index: 2;
        }
        .hero-right {
          position: relative; display: flex; align-items: flex-start;
          justify-content: center; padding-top: 140px;
          padding-right: clamp(16px, 3vw, 40px); overflow: hidden;
        }
        .mockup-frame {
          width: 55%; border-radius: 14px; overflow: hidden;
          background: ${T.bgCard}; border: 1px solid ${T.border};
          box-shadow: 0 32px 64px rgba(26,26,24,0.10), 0 0 0 1px rgba(26,26,24,0.04);
          transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
        }

        .pricing-btn-ghost:hover { border-color: ${T.blue} !important; color: ${T.blue} !important; }
        .pricing-btn-solid:hover { background: ${T.blueDk} !important; }
        .pricing-btn-dark:hover { background: ${T.bgDark3} !important; }

        @media (max-width: 768px) {
          .hero-layout { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hero-left { padding: 120px 24px 32px 24px !important; }
          .hero-right { padding: 0 24px 0 24px !important; align-items: flex-start !important; }
          .mockup-frame { border-radius: 12px 12px 0 0 !important; width: 100% !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .features-grid > div { grid-column: span 1 !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; }
        }
      `}</style>

      <div id="cursor-dot" />
      <div id="cursor-ring" />

      <StaggeredMenu
        isFixed
        position="right"
        colors={['#B8622A', '#486CE3']}
        accentColor={T.blue}
        menuButtonColor={navDark ? '#F0ECE6' : T.text}
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        logoUrl={navDark ? '/pitchhood-logo-white.svg' : '/pitchhood-logo-dark.svg'}
        items={[
          { label: 'Features', link: '#features' },
          { label: 'Pricing', link: '#pricing' },
          { label: 'Login', link: '/login' },
          { label: 'Sign up', link: '/login?tab=signup' },
        ]}
        socialItems={[
          { label: 'Instagram', link: 'https://instagram.com' },
          { label: 'Twitter', link: 'https://twitter.com' },
        ]}
      />

      {/* ── HERO ── */}
      <section style={{ background: T.bg, position: 'relative', overflow: 'hidden', minHeight: 680 }}>
        {/* dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${T.cream} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0 }} />
        {/* blobs */}
        <div className="blob" style={{ width: 460, height: 460, background: `linear-gradient(135deg,${T.blue},${T.blueLt})`, top: -100, left: -120, animationDelay: '0s' }} />
        <div className="blob" style={{ width: 260, height: 260, background: `linear-gradient(135deg,${T.orange},${T.blue})`, bottom: 160, left: '18%', animationDelay: '4s' }} />
        <div className="blob" style={{ width: 200, height: 200, background: `linear-gradient(135deg,${T.olive},${T.orange})`, top: 180, left: '25%', animationDelay: '1s' }} />

        <div className="hero-layout" style={{ position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div className="hero-left">
              {/* eyebrow */}
              <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.orange, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange, display: 'inline-block', animation: 'floatBlob 2.6s ease-in-out infinite' }} />
                Pitch Management
              </div>

              <h1 style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(2.4rem, 4.8vw, 4.6rem)', lineHeight: 1.04, color: T.text, letterSpacing: '-0.02em', marginBottom: 28 }}>
                Your A&amp;R workspace,<br />reimagined.
              </h1>

              <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: 'clamp(0.9rem, 1.4vw, 1rem)', lineHeight: 1.75, color: T.muted, maxWidth: 380, marginBottom: 36 }}>
                Everything your team needs to discover, review, and sign artists — in one clean interface.
              </p>

              <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleCtaClick(router, '/login?tab=signup')}
                  style={{ background: T.blue, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.01em', padding: '13px 26px', borderRadius: 10, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.2s', cursor: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.blueDk)}
                  onMouseLeave={e => (e.currentTarget.style.background = T.blue)}
                >Get started →</button>
                <a href="#features" style={{ background: 'transparent', color: T.text, fontFamily: F.display, fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em', padding: '13px 26px', borderRadius: 10, textDecoration: 'none', border: `1.5px solid ${T.border}`, display: 'inline-flex', alignItems: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.blue)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                >See features</a>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={150} className="hero-right-fadein">
            <div className="hero-right">
              <div className="mockup-frame">
                <AppMockup />
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <section style={{ background: T.bgCard, padding: '18px 0', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, whiteSpace: 'nowrap' }}>
          <div style={{ flexShrink: 0, padding: '0 32px', fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', borderRight: `1px solid ${T.border}` }}>
            Send pitches to the world&apos;s biggest labels
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="marquee-track">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} style={{ fontFamily: F.display, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.01em', color: T.text2, padding: '0 28px', borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: T.bg, padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.2em', color: T.blue, marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
                Features
                <span style={{ display: 'block', width: 24, height: 1, background: T.blue }} />
              </div>
              <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.4rem)', color: T.text, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 12 }}>
                Everything built for{' '}
                <em style={{ fontFamily: F.serif, fontStyle: 'italic', color: T.blue }}>serious pitchers.</em>
              </h2>
              <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: '1rem', color: T.muted, maxWidth: 480, lineHeight: 1.75 }}>Stop managing pitches in spreadsheets. Start managing them like a pro.</p>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {FEATURES.map((f, i) => (
                <div key={f.num} className="feature-cell" style={{
                  gridColumn: f.wide ? 'span 2' : 'span 1',
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 3vw, 32px)',
                  borderRight: (i === 0 || i === 2 || i === 3) ? `1px solid ${T.border}` : 'none',
                  borderBottom: i < 3 ? `1px solid ${T.border}` : 'none',
                  background: 'transparent',
                }}>
                  <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.14em', color: T.cream, marginBottom: 10 }}>{f.num}</div>
                  <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.12em', color: T.blue, marginBottom: 10 }}>{f.title}</div>
                  <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.88rem', lineHeight: 1.7, color: T.muted, maxWidth: 340 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                onClick={() => handleCtaClick(router, '/login?tab=signup')}
                style={{ background: T.text, color: T.textDark, fontFamily: F.display, fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.01em', padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.bgDark2)}
                onMouseLeave={e => (e.currentTarget.style.background = T.text)}
              >Start tracking pitches →</button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section data-dark-section style={{ background: T.bgDark, padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.orange, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                How it works
                <span style={{ display: 'block', width: 24, height: 1, background: T.orange }} />
              </div>
              <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.4rem)', color: T.textDark, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                From first pitch to{' '}
                <em style={{ fontFamily: F.serif, fontStyle: 'italic', color: T.blueLt }}>placement.</em>
              </h2>
            </div>
          </FadeUp>

          <div ref={howRef} className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${T.borderDark}`, borderRadius: 16, overflow: 'hidden' }}>
            {HOW_STEPS.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div key={step.num} className="step-card" style={{
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 2.5vw, 28px) clamp(36px, 4vw, 48px)',
                  borderRight: i < 3 ? `1px solid ${T.borderDark}` : 'none',
                  background: isActive ? T.blueBgDark : 'transparent',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.14em', color: T.mutedDark, marginBottom: 14 }}>{step.num}</div>
                  <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.12em', color: isActive ? T.blueLt : T.mutedDark, marginBottom: 12, textTransform: 'uppercase' }}>{step.title}</div>
                  <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(240,236,230,0.5)' }}>{step.desc}</p>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: T.blue, width: `${stepProgress}%`, transition: 'width 0.03s linear' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" data-dark-section style={{ background: T.bgDark, padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)', borderTop: `1px solid ${T.borderDark}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontFamily: F.mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.olive, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ display: 'block', width: 24, height: 1, background: T.olive }} />
                Pricing
                <span style={{ display: 'block', width: 24, height: 1, background: T.olive }} />
              </div>
              <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.4rem)', color: T.textDark, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 12 }}>
                Simple,{' '}
                <em style={{ fontFamily: F.serif, fontStyle: 'italic', color: T.blueLt }}>honest</em>
                {' '}pricing.
              </h2>
              <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: '1rem', color: T.mutedDark }}>Start free. Scale as your career grows.</p>
            </div>
          </FadeUp>

          <FadeUp delay={100}>
            <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PRICING_PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: plan.highlight ? T.blue : T.bgDark2,
                  borderRadius: 16,
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 3vw, 32px)',
                  border: plan.highlight ? 'none' : `1px solid ${T.borderDark}`,
                  position: 'relative',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: T.olive, color: '#fff', fontFamily: F.mono, fontWeight: 500, fontSize: '0.68rem', letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>{plan.badge}</div>
                  )}
                  <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: plan.highlight ? 'rgba(255,255,255,0.75)' : T.mutedDark, marginBottom: 16 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(2.4rem, 4vw, 3.2rem)', color: plan.highlight ? '#fff' : T.textDark, lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <div style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.82rem', color: plan.highlight ? 'rgba(255,255,255,0.6)' : T.mutedDark, marginBottom: 28 }}>{plan.period}</div>

                  <div style={{ borderTop: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.2)' : T.borderDark}`, paddingTop: 24, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: plan.highlight ? '#fff' : T.olive, fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                        <span style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.88rem', color: plan.highlight ? '#fff' : 'rgba(240,236,230,0.75)' }}>{f}</span>
                      </div>
                    ))}
                    {plan.crossed.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: T.mutedDark, fontSize: '0.75rem' }}>✕</span>
                        <span style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.88rem', color: T.mutedDark, textDecoration: 'line-through' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCtaClick(router, '/login?tab=signup')}
                    className={`pricing-btn-${plan.ctaStyle}`}
                    style={{
                      display: 'block', width: '100%', textAlign: 'center',
                      padding: '12px 20px', borderRadius: 10,
                      fontFamily: F.display, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em',
                      border: plan.ctaStyle === 'ghost' ? `1px solid ${T.borderDark}` : 'none',
                      background: plan.ctaStyle === 'solid' ? '#fff' : plan.ctaStyle === 'dark' ? T.bgDark3 : 'transparent',
                      color: plan.ctaStyle === 'solid' ? T.blue : plan.ctaStyle === 'dark' ? T.textDark : T.mutedDark,
                      transition: 'all 0.2s', cursor: 'none',
                    }}
                  >{plan.cta}</button>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: T.bgDark, borderTop: `1px solid ${T.borderDark}`, padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 32px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 60, borderBottom: `1px solid ${T.borderDark}` }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <LogoFull dark />
              </div>
              <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: '0.88rem', lineHeight: 1.7, color: T.mutedDark, marginBottom: 24, maxWidth: 280 }}>
                The pitch management platform for composers, artists, and producers who take their career seriously.
              </p>
              <div style={{ display: 'flex', gap: 0 }}>
                <input type="email" placeholder="Your email" style={{ flex: 1, background: 'rgba(240,236,230,0.06)', border: `1px solid ${T.borderDark}`, borderRadius: '8px 0 0 8px', padding: '10px 14px', fontFamily: F.body, fontSize: '0.85rem', color: T.textDark, outline: 'none' }} />
                <button style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', padding: '10px 16px', fontFamily: F.display, fontWeight: 700, fontSize: '0.85rem', cursor: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.blueDk)}
                  onMouseLeave={e => (e.currentTarget.style.background = T.blue)}
                >→</button>
              </div>
            </div>

            {['Explore', 'Solutions', 'Get Started'].map((section, si) => (
              <div key={section}>
                <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mutedDark, marginBottom: 18 }}>{section}</div>
                {[
                  ['Features', 'Pricing', 'Changelog', 'Roadmap'],
                  ['Record Labels', 'A&R Teams', 'Managers', 'Songwriters'],
                  ['Book a demo', 'Pricing', 'Login', 'Support'],
                ][si].map(l => (
                  <a key={l} href="#" style={{ display: 'block', fontFamily: F.body, fontWeight: 300, fontSize: '0.88rem', color: 'rgba(240,236,230,0.55)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.textDark)}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,230,0.55)')}
                  >{l}</a>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: '0.7rem', letterSpacing: '0.08em', color: T.mutedDark }}>© 2026 Pitchhood</span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Instagram', 'Twitter', 'LinkedIn'].map(s => (
                <a key={s} href="#" style={{ fontFamily: F.mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.mutedDark, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.textDark)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.mutedDark)}
                >{s}</a>
              ))}
            </div>
          </div>
        </div>

        {/* big word footer */}
        <div style={{ textAlign: 'center', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(4rem, 14vw, 14vw)', letterSpacing: '-0.03em', color: 'rgba(240,236,230,0.06)', lineHeight: 0.9, whiteSpace: 'nowrap' }}>
            pitch the hood.
          </div>
        </div>
      </footer>
    </>
  );
}
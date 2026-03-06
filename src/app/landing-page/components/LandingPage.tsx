'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import StaggeredMenu from './StaggeredMenu';
import './StaggeredMenu.css';

// ✅ OPT 3: Lazy load — só carrega quando necessário
const AnimatedPitchDemo = dynamic(() => import('./AnimatedPitchDemo'), { ssr: false });

const MARQUEE_ITEMS = [
  'Universal Music', 'Sony Music', 'Warner Records', 'Def Jam',
  'Atlantic Records', 'Interscope', 'Republic Records', 'LANDR',
  'DistroKid', 'AWAL', 'TuneCore', 'Spotify for Artists',
];

const FEATURES = [
  { num: '01', icon: '🎯', title: 'PITCH TRACKING', desc: 'Log every pitch you send — to labels, A&Rs, managers, or producers. Track status, follow-up dates, and outcomes in one view.', wide: true },
  { num: '02', icon: '★', title: 'ARTIST MANAGEMENT', desc: 'Manage your full roster. See which artists have the highest placement rates.', wide: false },
  { num: '03', icon: '📊', title: 'ANALYTICS & SCORES', desc: 'Track approval rates, response times, and which labels are actually opening your submissions.', wide: false },
  { num: '04', icon: '◷', title: 'SMART REMINDERS', desc: 'Set follow-up reminders for every pitch. Get notified when it\'s time to check in.', wide: false },
  { num: '05', icon: '▤', title: 'TEMPLATES & CONTACT BOOK', desc: 'Create reusable pitch email templates and store every A&R, manager, and producer contact with notes.', wide: true },
];

const HOW_STEPS = [
  { num: '01', icon: '🎵', title: 'LOG YOUR PITCH', desc: 'Add a pitch in seconds — song title, who you sent it to, date, and notes.' },
  { num: '02', icon: '👀', title: 'TRACK THE STATUS', desc: 'Update status as things progress — Sent, In Review, Approved, Rejected.' },
  { num: '03', icon: '🔔', title: 'GET REMINDERS', desc: 'Set follow-up dates. Pitchhood reminds you when it\'s time to check in.' },
  { num: '04', icon: '✓', title: 'GET PLACED', desc: 'Track placements, measure your approval rate, and double down on what\'s working.' },
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
    cta: 'Start Pro trial', ctaStyle: 'white', highlight: true,
  },
  {
    name: 'AGENCY', price: '$79', period: '/mo billed annually',
    features: ['Everything in Pro', 'Up to 5 team members', 'Shared contact book', 'Team activity feed', 'Custom reports', 'Priority support'],
    crossed: [],
    cta: 'Contact sales', ctaStyle: 'dark', highlight: false,
  },
];

// ─── Auth redirect helper ─────────────────────────────────────────────────────
async function handleCtaClick(router: ReturnType<typeof useRouter>, target: string = '/login?tab=signup') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    router.push('/dashboard');
  } else {
    router.push(target);
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeUp();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── App Mockup ──────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <>
      <div style={{ background: '#1e1e1e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 6, padding: '4px 12px', fontFamily: 'Barlow, sans-serif', fontSize: '0.72rem', color: '#888', textAlign: 'center' }}>
          app.pitchhood.com/pitches
        </div>
      </div>
      <AnimatedPitchDemo />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [navDark, setNavDark] = useState(false);
  const howRef = useRef<HTMLDivElement>(null);
  const howVisible = useRef(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ OPT 1: Cursor via CSS/DOM — zero re-renders no React
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
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
      raf = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // ✅ OPT 2: Nav dark detection (scroll passivo, sem re-renders desnecessários)
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
    const el = howRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !howVisible.current) {
        howVisible.current = true;
        startStepAnimation();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const startStepAnimation = useCallback(() => {
    let step = 0;
    let progress = 0;
    const DURATION = 2200;
    const TICK = 30;
    const runTick = () => {
      progress += (TICK / DURATION) * 100;
      if (progress >= 100) {
        progress = 0;
        step = (step + 1) % 4;
        setActiveStep(step);
      }
      setStepProgress(progress);
      animRef.current = setTimeout(runTick, TICK);
    };
    setActiveStep(0);
    setStepProgress(0);
    animRef.current = setTimeout(runTick, TICK);
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600&family=Playfair+Display:ital,wght@1,700;1,800;1,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; cursor: none !important; }
        a, button, [role="button"] { cursor: none !important; }

        /* ✅ OPT 1: Cursor CSS puro — sem React state */
        #cursor-dot {
          position: fixed; width: 8px; height: 8px; border-radius: 50%;
          background: #1d4ed8; pointer-events: none; z-index: 9999;
          top: 0; left: 0; will-change: transform;
        }
        #cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1.5px solid rgba(29,78,216,0.5); pointer-events: none;
          z-index: 9998; top: 0; left: 0; will-change: transform;
        }

        .marquee-track { display: flex; animation: marquee 28s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.18; animation: floatBlob 8s ease-in-out infinite; }
        @keyframes floatBlob {
          0%, 100% { transform: translateY(0px) scale(1); }
          33% { transform: translateY(-24px) scale(1.04); }
          66% { transform: translateY(12px) scale(0.97); }
        }
        .feature-cell:hover { background: #fff !important; }
        .step-card { transition: background 0.3s, border-color 0.3s; }

        /* ── Hero layout ── */
        .hero-disco {
          display: grid;
          grid-template-columns: 1fr 6fr;
          min-height: 680px;
          align-items: stretch;
          position: relative;
        }
        .hero-disco-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 140px 40px 80px max(24px, calc((100vw - 1300px) / 2 + 24px));
          position: relative;
          z-index: 2;
        }
        .hero-disco-right {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 140px;
          padding-right: clamp(16px, 3vw, 40px);
          overflow: hidden;
        }
        .hero-mockup-frame {
          width: 55%;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
          position: relative;
          transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
        }

        /* ── Tablet (≤768px) ── */
        @media (max-width: 768px) {
          .hero-disco { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hero-disco-left { padding: 120px 24px 32px 24px !important; }
          .hero-disco-right { padding: 0 24px 0 24px !important; overflow: hidden !important; align-items: flex-start !important; }
          .hero-mockup-frame { border-radius: 12px 12px 0 0 !important; width: 100% !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .features-grid > div { grid-column: span 1 !important; }
          .how-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-grid > div:nth-child(2) { border-right: none !important; }
          .how-grid > div:nth-child(1), .how-grid > div:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin: 0 auto !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .mockup-sidebar { display: none !important; }
          .mockup-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .mockup-cards { grid-template-columns: 1fr !important; }
        }

        /* ── Mobile (≤480px) ── */
        @media (max-width: 480px) {
          .how-grid { grid-template-columns: 1fr !important; }
          .how-grid > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons a, .hero-buttons button { width: 100% !important; justify-content: center !important; min-height: 48px !important; }
          .mockup-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .mockup-cards { grid-template-columns: 1fr !important; }
          .hero-disco-left { padding: 100px 20px 24px 20px !important; }
          .hero-right-fadein { width: 100% !important; }
          .hero-disco-right { padding: 0 !important; margin: 0 !important; width: 100% !important; position: static !important; left: auto !important; transform: none !important; display: block !important; overflow: visible !important; }
          .hero-mockup-frame { width: 100% !important; transform: none !important; border-radius: 12px 12px 0 0 !important; }
        }
      `}</style>

      {/* ✅ OPT 1: Cursor CSS — não usa React state */}
      <div id="cursor-dot" />
      <div id="cursor-ring" />

      <StaggeredMenu
        isFixed
        position="right"
        colors={['#B19EEF', '#5227FF']}
        accentColor="#1d4ed8"
        menuButtonColor={navDark ? '#ffffff' : '#1a1a1a'}
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        logoUrl={navDark ? "/pitchhood-logo-white.svg" : "/pitchhood-logo-dark.svg"}
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
      <section style={{ background: '#f2f0eb', paddingTop: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden', minHeight: 680 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0 }} />
        <div className="blob" style={{ width: 400, height: 400, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', top: -80, left: -100, animationDelay: '0s' }} />
        <div className="blob" style={{ width: 250, height: 250, background: 'linear-gradient(135deg,#4f46e5,#2563eb)', bottom: 200, left: '15%', animationDelay: '4s' }} />
        <div className="blob" style={{ width: 200, height: 200, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', top: 160, left: '22%', animationDelay: '1s' }} />

        <div className="hero-disco" style={{ position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div className="hero-disco-left">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.18em', color: '#1d4ed8', marginBottom: 20, textTransform: 'uppercase' }}>Product</div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(2.6rem, 5vw, 4.8rem)', lineHeight: 1.05, color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: 28 }}>
                Your A&amp;R workspace,<br />reimagined.
              </h1>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', lineHeight: 1.65, color: '#555', maxWidth: 380, marginBottom: 36 }}>
                Everything your team needs to discover, review, and sign artists — in one clean interface.
              </p>
              <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleCtaClick(router, '/login?tab=signup')}
                  style={{ background: '#1d4ed8', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', padding: '13px 26px', borderRadius: 10, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.2s', cursor: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1e40af')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1d4ed8')}
                >Get started →</button>
                <a href="#features" style={{ background: 'transparent', color: '#1a1a1a', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', padding: '13px 26px', borderRadius: 10, textDecoration: 'none', border: '1.5px solid rgba(0,0,0,0.2)', display: 'inline-flex', alignItems: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1d4ed8')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)')}
                >See features</a>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={150} className="hero-right-fadein">
            <div className="hero-disco-right">
              <div className="hero-mockup-frame">
                <AppMockup />
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <section style={{ background: '#fff', padding: '20px 0', borderTop: '1px solid #ebebeb', borderBottom: '1px solid #ebebeb', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, whiteSpace: 'nowrap' }}>
          <div style={{ flexShrink: 0, padding: '0 32px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase', borderRight: '1px solid #e5e5e5' }}>
            Send pitches to the world&apos;s biggest labels and publishers
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="marquee-track">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.06em', color: '#333', padding: '0 28px', borderRight: '1px solid #e5e5e5', flexShrink: 0 }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: '#f2f0eb', padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.18em', color: '#1d4ed8', marginBottom: 12, textTransform: 'uppercase' }}>Features</div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', color: '#0a0a0a', lineHeight: 1.1, marginBottom: 12 }}>
                Everything built for <em style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>serious pitchers.</em>
              </h2>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '1rem', color: '#666', maxWidth: 480 }}>Stop managing pitches in spreadsheets. Start managing them like a pro.</p>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid rgba(0,0,0,0.1)' }}>
              {FEATURES.map((f, i) => (
                <div key={f.num} className="feature-cell" style={{
                  gridColumn: f.wide ? 'span 2' : 'span 1',
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 3vw, 32px)',
                  borderRight: (i === 0 || i === 2 || i === 3) ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  background: 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', color: '#aaa', marginBottom: 8 }}>{f.num}</div>
                  <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.08em', color: '#555', marginBottom: 10 }}>{f.title}</div>
                  <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.88rem', lineHeight: 1.6, color: '#555', maxWidth: 340 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                onClick={() => handleCtaClick(router, '/login?tab=signup')}
                style={{ background: '#1d4ed8', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e40af')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1d4ed8')}
              >Start tracking pitches →</button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section data-dark-section style={{ background: '#111111', padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.18em', color: '#1d4ed8', marginBottom: 12, textTransform: 'uppercase' }}>How it works</div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', color: '#f2f0eb', lineHeight: 1.1 }}>
                From first pitch to <em style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>placement.</em>
              </h2>
            </div>
          </FadeUp>
          <div ref={howRef} className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {HOW_STEPS.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div key={step.num} className="step-card" style={{
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 2.5vw, 28px) clamp(36px, 4vw, 48px)',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  background: isActive ? 'rgba(29,78,216,0.12)' : 'transparent',
                  borderColor: isActive ? 'rgba(29,78,216,0.3)' : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{step.num}</div>
                  <div style={{ fontSize: '1.6rem', marginBottom: 14 }}>{step.icon}</div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', color: '#f2f0eb', marginBottom: 10 }}>{step.title}</div>
                  <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>{step.desc}</p>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: '#1d4ed8', width: `${stepProgress}%`, transition: 'width 0.03s linear' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section data-dark-section style={{ background: '#111111', padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 32px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.18em', color: '#1d4ed8', marginBottom: 12, textTransform: 'uppercase' }}>Pricing</div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', color: '#f2f0eb', lineHeight: 1.1, marginBottom: 12 }}>Simple, honest pricing.</h2>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Start free. Scale as your career grows.</p>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PRICING_PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: plan.highlight ? '#1d4ed8' : '#1a1a1a',
                  borderRadius: 16,
                  padding: 'clamp(24px, 3vw, 36px) clamp(20px, 3vw, 32px)',
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#1d4ed8', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', padding: '4px 14px', borderRadius: 20 }}>{plan.badge}</div>
                  )}
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', color: plan.highlight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(2.4rem, 4vw, 3.2rem)', color: plan.highlight ? '#fff' : '#f2f0eb', lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.82rem', color: plan.highlight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)', marginBottom: 28 }}>{plan.period}</div>
                  <div style={{ borderTop: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, paddingTop: 24, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: plan.highlight ? '#fff' : '#1d4ed8', fontSize: '0.75rem' }}>✓</span>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.88rem', color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.7)' }}>{f}</span>
                      </div>
                    ))}
                    {plan.crossed.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>✕</span>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCtaClick(router, '/login?tab=signup')}
                    style={{
                      display: 'block', width: '100%', textAlign: 'center',
                      padding: '12px 20px', borderRadius: 10,
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em',
                      border: plan.ctaStyle === 'ghost' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                      background: plan.ctaStyle === 'white' ? '#fff' : plan.ctaStyle === 'dark' ? '#0a0a0a' : 'transparent',
                      color: plan.ctaStyle === 'white' ? '#1d4ed8' : plan.ctaStyle === 'dark' ? '#f2f0eb' : 'rgba(255,255,255,0.7)',
                      transition: 'opacity 0.2s',
                      cursor: 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{plan.cta}</button>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1d4ed8', padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 32px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 60, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.08em', color: '#fff', marginBottom: 12 }}>PITCHHOOD</div>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.88rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', marginBottom: 24, maxWidth: 280 }}>The pitch management platform for composers, artists, and producers who take their career seriously.</p>
              <div style={{ display: 'flex', gap: 0 }}>
                <input type="email" placeholder="Your email" style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px 0 0 8px', padding: '10px 14px', fontFamily: 'Barlow, sans-serif', fontSize: '0.85rem', color: '#fff', outline: 'none' }} />
                <button style={{ background: '#fff', color: '#1d4ed8', border: 'none', borderRadius: '0 8px 8px 0', padding: '10px 16px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em', cursor: 'none' }}>→</button>
              </div>
            </div>
            {['Explore', 'Solutions', 'Get Started'].map((section, si) => (
              <div key={section}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase' }}>{section}</div>
                {[
                  ['Features', 'Pricing', 'Changelog', 'Roadmap'],
                  ['Record Labels', 'A&R Teams', 'Managers', 'Songwriters'],
                  ['Book a demo', 'Pricing', 'Login', 'Support'],
                ][si].map(l => (
                  <a key={l} href="#" style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  >{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>© 2026 Pitchhood</span>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Instagram', 'Twitter', 'LinkedIn'].map(s => (
                <a key={s} href="#" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                >{s}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 0 0', overflow: 'hidden' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(4rem, 14vw, 14vw)', letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.1)', lineHeight: 0.9, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PITCH THE HOOD.</div>
        </div>
      </footer>
    </>
  );
}
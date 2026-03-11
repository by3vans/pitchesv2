'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@/contexts/TransitionContext';
import { Workflow, Sparkles, Tag, Puzzle, ArrowRight } from 'lucide-react';
import './landing-dock.css';

// ── Types ─────────────────────────────────────────────

type NavItemId = 'hiw' | 'features' | 'compare' | 'pricing';

interface NavItem {
  id: NavItemId;
  sectionId: string;
  tooltip: string;
  icon: React.ReactNode;
}

interface SolutionItem {
  label: string;
  desc: string;
  icon: React.ReactNode;
}

// ── Data ──────────────────────────────────────────────

const SOLUTIONS: SolutionItem[] = [
  {
    label: 'Music Supervisors',
    desc:  'Find & pitch songs for film, TV & ads',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"/>
      </svg>
    ),
  },
  {
    label: 'Artists & Creators',
    desc:  'Manage your pitch pipeline end-to-end',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"/>
      </svg>
    ),
  },
  {
    label: 'Enterprise',
    desc:  'Team workflows for labels & publishers',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
      </svg>
    ),
  },
  {
    label: 'Rights Holders',
    desc:  'Track licensing across your catalog',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
  },
  {
    label: 'A&R & Management',
    desc:  'Discover and sign the next big act',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
      </svg>
    ),
  },
  {
    label: 'Marketing Teams',
    desc:  'Coordinate campaigns with your roster',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
      </svg>
    ),
  },
];

const NAV_ITEMS: NavItem[] = [
  { id: 'hiw',      sectionId: 'hiw',              tooltip: 'How it works', icon: <Workflow  size={19} strokeWidth={1.8} /> },
  { id: 'features', sectionId: 'featSection',       tooltip: 'Features',     icon: <Sparkles  size={19} strokeWidth={1.8} /> },
  { id: 'compare',  sectionId: 'comparisonSection', tooltip: 'Compare',      icon: <CompareIcon /> },
  { id: 'pricing',  sectionId: 'pricingSection',    tooltip: 'Pricing',      icon: <Tag       size={19} strokeWidth={1.8} /> },
];

const DARK_SECTION_IDS = ['piaSection', 'comparisonSection', 'spSection'];
const WAVE_HEIGHTS     = [38, 68, 48, 88, 58, 78, 44, 72, 52, 34, 62, 46, 80, 42];
const WAVE_DELAYS      = [0, .12, .24, .06, .18, .30, .09, .21, .15, .27, .03, .33, .19, .08];

// ── Icons ─────────────────────────────────────────────

function CompareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="7" height="14" rx="1.5" />
      <rect x="10" y="2" width="7" height="14" rx="1.5" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 42 42" fill="none" style={{ width: 36, height: 36 }}>
      <rect width="42" height="42" rx="10" fill="#1A1A18" />
      <rect x="11" y="9" width="3.5" height="24" fill="#F8F5F0" />
      <rect x="14.5" y="9" width="13" height="12" fill="#486CE3" />
      <polygon points="27.5,9 27.5,21 22,15" fill="#1A1A18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" style={{ width: 19, height: 19 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════
//  SOLUTIONS PANEL
//  Sempre renderizado (visibility:hidden quando fechado)
//  para evitar race conditions no reopen.
//  Texto escuro pois o glass flutua sobre fundo claro.
// ══════════════════════════════════════════════════════

function SolutionsPanel({ open }: { open: boolean }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      className={`sol-panel${open ? ' sol-panel--open' : ''}`}
    >
      <div className="sol-panel-inner">

        {/* ── List ── */}
        <div className="sol-panel-list">
          <div className="sol-panel-heading">Solutions</div>

          {SOLUTIONS.map((item, i) => (
            <a
              key={item.label}
              href="#"
              onClick={e => e.preventDefault()}
              className="sol-panel-item"
              style={{ transitionDelay: open ? `${50 + i * 32}ms` : '0ms' }}
            >
              <div className="sol-panel-icon">{item.icon}</div>
              <div>
                <div className="sol-panel-name">{item.label}</div>
                <div className="sol-panel-desc">{item.desc}</div>
              </div>
            </a>
          ))}
        </div>

        {/* ── Image ── */}
        <div className="sol-panel-image">
          <div className="sol-panel-orb" />

          {/* Pitch flag */}
          <svg
            className={`sol-panel-flag${open ? ' sol-panel-flag--visible' : ''}`}
            width="42" height="62" viewBox="0 0 42 62" fill="none"
          >
            <rect x="0" y="0" width="6" height="62" rx="3" fill="rgba(248,245,240,0.88)" />
            <path d="M6 4 L38 22 L6 40 Z" fill="#486CE3" />
          </svg>

          {/* Waveform */}
          <div className="sol-panel-wave">
            {WAVE_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="sol-wave-bar"
                style={{ height: `${h}%`, animationDelay: `${WAVE_DELAYS[i]}s` }}
              />
            ))}
          </div>

          {/* Tag */}
          <div className={`sol-panel-tag${open ? ' sol-panel-tag--visible' : ''}`}>
            Pitchhood
          </div>

          {/* Caption */}
          <div className={`sol-panel-caption${open ? ' sol-panel-caption--visible' : ''}`}>
            Built for the music industry
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────

export default function LandingDock() {
  const [activeId, setActiveId]           = useState<NavItemId | null>(null);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [onDark, setOnDark]               = useState(false);

  const itemsRef         = useRef<HTMLDivElement>(null);
  const itemEls          = useRef<(HTMLElement | null)[]>([]);
  const popTargets       = useRef<(HTMLElement | null)[]>([]);
  const solutionsOpenRef = useRef(false);

  const { navigateTo } = useNavigate();

  const scrollTo = useCallback((sectionId: string | 0) => {
    if (sectionId === 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Pop-in on mount
  useEffect(() => {
    const targets = popTargets.current.filter(Boolean) as HTMLElement[];
    targets.forEach(el => el.classList.add('dock-pop'));
    const timers = targets.map((el, i) =>
      setTimeout(() => el.classList.add('popped'), 120 + i * 60)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Sync ref + trava botão quando abre
  useEffect(() => {
    solutionsOpenRef.current = solutionsOpen;
    if (solutionsOpen) {
      const btn = itemEls.current[NAV_ITEMS.length];
      if (btn) btn.style.transform = 'scale(1)';
    }
  }, [solutionsOpen]);

  // Magnetic scale
  useEffect(() => {
    const wrap = itemsRef.current;
    if (!wrap) return;
    const onMove = (e: MouseEvent) => {
      if (solutionsOpenRef.current) return;
      itemEls.current.forEach(el => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(e.clientY - (r.top + r.height / 2));
        const s = d < 100 ? 1 + (1 - d / 100) * 0.22 : 1;
        if (!el.classList.contains('active')) el.style.transform = `scale(${s.toFixed(3)})`;
      });
    };
    const onLeave = () => {
      if (solutionsOpenRef.current) return;
      itemEls.current.forEach(el => {
        if (el && !el.classList.contains('active')) el.style.transform = 'scale(1)';
      });
    };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    return () => { wrap.removeEventListener('mousemove', onMove); wrap.removeEventListener('mouseleave', onLeave); };
  }, []);

  // Active + dark detection
  useEffect(() => {
    const allIds   = [...NAV_ITEMS.map(n => n.sectionId), ...DARK_SECTION_IDS];
    const elements = allIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        const match = NAV_ITEMS.find(n => n.sectionId === id);
        if (match) setActiveId(match.id);
        setOnDark(DARK_SECTION_IDS.includes(id));
      });
    }, { threshold: 0.4 });
    elements.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!solutionsOpen) return;
    const close = () => setSolutionsOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [solutionsOpen]);

  return (
    <>
      <nav
        className={`landing-dock${onDark ? ' dock-on-dark' : ''}`}
        aria-label="Site navigation"
      >
        <div className="dock-items" ref={itemsRef}>

          <button
            ref={el => { popTargets.current[0] = el; }}
            className="dock-logo-btn"
            onClick={() => { scrollTo(0); setActiveId(null); }}
            aria-label="Início"
          >
            <LogoMark />
            <span className="dock-tooltip">Home</span>
          </button>

          <div ref={el => { popTargets.current[1] = el; }} className="dock-divider" />

          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              ref={el => { popTargets.current[2 + i] = el; itemEls.current[i] = el; }}
              className={`dock-item${activeId === item.id ? ' active' : ''}`}
              onClick={() => { scrollTo(item.sectionId); setActiveId(item.id); }}
              aria-label={item.tooltip}
            >
              {item.icon}
              <span className="dock-tooltip">{item.tooltip}</span>
            </button>
          ))}

          <button
            ref={el => { popTargets.current[2 + NAV_ITEMS.length] = el; itemEls.current[NAV_ITEMS.length] = el; }}
            className={`dock-item dock-solutions-btn${solutionsOpen ? ' open' : ''}`}
            onClick={e => { e.stopPropagation(); setSolutionsOpen(p => !p); }}
            aria-label="Solutions"
            aria-expanded={solutionsOpen}
          >
            <Puzzle size={19} strokeWidth={1.8} />
            <span className="dock-tooltip">Solutions</span>
          </button>
        </div>

        <div className="dock-bottom">
          <button
            ref={el => { popTargets.current[2 + NAV_ITEMS.length + 1] = el; }}
            className="dock-avatar"
            aria-label="Login"
            onClick={() => navigateTo('/login')}
          >
            <UserIcon />
            <span className="dock-tooltip">Login</span>
          </button>

          <button
            ref={el => { popTargets.current[2 + NAV_ITEMS.length + 2] = el; }}
            className="dock-cta"
            aria-label="Get Started"
            onClick={() => navigateTo('/login')}
          >
            <ArrowRight size={19} strokeWidth={2.2} />
            <span className="dock-tooltip">Get Started</span>
          </button>
        </div>
      </nav>

      <SolutionsPanel open={solutionsOpen} />
    </>
  );
}
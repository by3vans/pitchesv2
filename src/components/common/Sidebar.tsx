'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import UsageBar from '@/components/billing/UsageBar';

const coreItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'Squares2X2Icon' },
  { label: 'Pitches', path: '/pitches-listing-dashboard', icon: 'PaperAirplaneIcon' },
  { label: 'Artists', path: '/artists', icon: 'MusicalNoteIcon' },
  { label: 'Contacts', path: '/contacts', icon: 'UsersIcon' },
];

const workflowItems = [
  { label: 'Activity', path: '/activity-dashboard', icon: 'BoltIcon' },
  { label: 'Reminders', path: '/reminders', icon: 'ClockIcon' },
  { label: 'Templates', path: '/templates-management', icon: 'DocumentDuplicateIcon' },
];

const systemItems = [
  { label: 'Notifications', path: '/notifications-center', icon: 'BellIcon' },
  { label: 'Settings', path: '/settings', icon: 'Cog6ToothIcon' },
];

const allNavItems = [...coreItems, ...workflowItems, ...systemItems];

const STORAGE_KEY = 'pm_mobile_drawer_open';
const WORKFLOW_KEY = 'pm_nav_workflow_open';
const SYSTEM_KEY = 'pm_nav_system_open';

// ── Flag-P Logo ───────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="0" y="0" width="4" height="26" rx="2" fill="var(--text)" />
      <path d="M4 2 L18 10 L4 18 Z" fill="#486CE3" />
    </svg>
  );
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span style={{
        fontFamily: "'Cabinet Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: '1rem',
        letterSpacing: '-0.03em',
        color: 'var(--text)',
        lineHeight: 1,
      }}>
        PitchHood
      </span>
    </div>
  );
}

// ── Nav Group ─────────────────────────────────────────────────────────────────
interface NavGroupProps {
  label: string;
  items: { label: string; path: string; icon: string }[];
  isOpen: boolean;
  onToggle: () => void;
  isActive: (path: string) => boolean;
  onLinkClick?: () => void;
  mobile?: boolean;
}

const NavGroup = ({ label, items, isOpen, onToggle, isActive, onLinkClick, mobile }: NavGroupProps) => {
  const hasActive = items.some((item) => isActive(item.path));

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors duration-150 group ${
          hasActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-expanded={isOpen}
      >
        <span style={{
          fontFamily: "'Azeret Mono', monospace",
          fontSize: '0.62rem',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--muted)',
        }}>
          {label}
        </span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
          <Icon name="ChevronDownIcon" size={12} variant="outline" />
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={`flex flex-col gap-0.5 pt-0.5 ${mobile ? 'pl-1' : ''}`}>
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onLinkClick}
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--blue-bg)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--muted)',
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon as any} size={16} variant="outline" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const storedDrawer = sessionStorage.getItem(STORAGE_KEY);
    if (storedDrawer === 'true') setMobileOpen(true);
    const storedWorkflow = sessionStorage.getItem(WORKFLOW_KEY);
    if (storedWorkflow === 'false') setWorkflowOpen(false);
    const storedSystem = sessionStorage.getItem(SYSTEM_KEY);
    if (storedSystem === 'false') setSystemOpen(false);
  }, []);

  useEffect(() => { sessionStorage.setItem(WORKFLOW_KEY, String(workflowOpen)); }, [workflowOpen]);
  useEffect(() => { sessionStorage.setItem(SYSTEM_KEY, String(systemOpen)); }, [systemOpen]);

  useEffect(() => {
    if (mobileOpen) {
      setDrawerVisible(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      sessionStorage.setItem(STORAGE_KEY, 'false');
      const timer = setTimeout(() => setDrawerVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [mobileOpen]);

  const isActive = (path: string) => {
    if (!mounted) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const activeNavItem = allNavItems.find((item) => isActive(item.path));
  const closeDrawer = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="pm-sidebar hidden md:flex" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        {/* Brand */}
        <div className="pm-sidebar-brand">
          <Link href="/pitches" className="focus:outline-none focus-visible:ring-2 rounded-lg" style={{ color: 'inherit', textDecoration: 'none' }}>
            <SidebarLogo />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-3 flex-1 overflow-y-auto" aria-label="Main navigation">
          <div className="flex flex-col gap-0.5 mb-1">
            {coreItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    background: active ? 'var(--blue-bg)' : 'transparent',
                    color: active ? 'var(--blue)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    transition: 'all 150ms',
                  }}
                  className="hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={item.icon as any} size={16} variant="outline" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />

          <NavGroup label="Workflow" items={workflowItems} isOpen={workflowOpen} onToggle={() => setWorkflowOpen(v => !v)} isActive={isActive} />

          <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />

          <NavGroup label="System" items={systemItems} isOpen={systemOpen} onToggle={() => setSystemOpen(v => !v)} isActive={isActive} />
        </nav>
        <UsageBar />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="pm-topbar md:hidden" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center w-full px-4 gap-4">
          <Link href="/pitches" className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 rounded-lg" style={{ textDecoration: 'none' }}>
            <SidebarLogo />
          </Link>

          {activeNavItem && (
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.875rem', color: 'var(--muted)' }}>
              {activeNavItem.label}
            </span>
          )}

          <button
            className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            type="button"
          >
            <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} variant="outline" />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerVisible && (
        <div className="md:hidden fixed inset-0 z-40" aria-hidden={!mobileOpen}>
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${mobileOpen ? 'opacity-40' : 'opacity-0'}`}
            onClick={closeDrawer}
          />

          <div
            className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ background: 'var(--bg-card)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <SidebarLogo />
              <button
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
                onClick={closeDrawer}
                aria-label="Close menu"
                type="button"
              >
                <Icon name="XMarkIcon" size={22} variant="outline" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col px-4 pt-3 gap-0.5 flex-1 overflow-y-auto" aria-label="Mobile navigation">
              {coreItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeDrawer}
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'var(--blue-bg)' : 'transparent',
                      color: active ? 'var(--blue)' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12,
                      minHeight: 48, transition: 'all 200ms',
                    }}
                    className="hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon name={item.icon as any} size={20} variant="outline" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />
              <NavGroup label="Workflow" items={workflowItems} isOpen={workflowOpen} onToggle={() => setWorkflowOpen(v => !v)} isActive={isActive} onLinkClick={closeDrawer} mobile />
              <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />
              <NavGroup label="System" items={systemItems} isOpen={systemOpen} onToggle={() => setSystemOpen(v => !v)} isActive={isActive} onLinkClick={closeDrawer} mobile />
            </nav>

            {/* Footer */}
            <div className="px-4 pb-8 pt-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
              <Link
                href="/pitch-creation-workflow"
                onClick={closeDrawer}
                className="pm-btn-primary w-full justify-center"
              >
                <Icon name="PlusIcon" size={18} variant="outline" />
                New Pitch
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

const coreItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'Squares2X2Icon' },
  { label: 'Pitches', path: '/pitches-listing-dashboard', icon: 'PaperAirplaneIcon' },
  { label: 'Artists', path: '/artists-listing-dashboard', icon: 'MusicalNoteIcon' },
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
        <span className="text-[10px] font-semibold uppercase tracking-widest select-none">
          {label}
        </span>
        <span
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
        >
          <Icon name="ChevronDownIcon" size={12} variant="outline" />
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`flex flex-col gap-0.5 pt-0.5 ${mobile ? 'pl-1' : ''}`}>
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onLinkClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
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

const Sidebar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  // Restore states from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedDrawer = sessionStorage.getItem(STORAGE_KEY);
    if (storedDrawer === 'true') setMobileOpen(true);

    const storedWorkflow = sessionStorage.getItem(WORKFLOW_KEY);
    if (storedWorkflow === 'false') setWorkflowOpen(false);

    const storedSystem = sessionStorage.getItem(SYSTEM_KEY);
    if (storedSystem === 'false') setSystemOpen(false);
  }, []);

  // Persist group states
  useEffect(() => {
    sessionStorage.setItem(WORKFLOW_KEY, String(workflowOpen));
  }, [workflowOpen]);

  useEffect(() => {
    sessionStorage.setItem(SYSTEM_KEY, String(systemOpen));
  }, [systemOpen]);

  // Animate drawer in/out and sync sessionStorage
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
      {/* Desktop Sidebar */}
      <aside className="pm-sidebar hidden md:flex">
        {/* Brand */}
        <div className="pm-sidebar-brand">
          <Link href="/pitches" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="9" cy="9" r="4" fill="white" opacity="0.9" />
                <path d="M9 2C9 2 13 5 13 9C13 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                <path d="M9 2C9 2 5 5 5 9C5 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <span className="font-heading font-bold text-sm text-foreground tracking-tight">
              Pitchhood
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-3 flex-1 overflow-y-auto" aria-label="Main navigation">
          {/* Core — always visible, no header toggle */}
          <div className="flex flex-col gap-0.5 mb-1">
            {coreItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={item.icon as any} size={16} variant="outline" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* Workflow group */}
          <NavGroup
            label="Workflow"
            items={workflowItems}
            isOpen={workflowOpen}
            onToggle={() => setWorkflowOpen((v) => !v)}
            isActive={isActive}
          />

          {/* Divider */}
          <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* System group */}
          <NavGroup
            label="System"
            items={systemItems}
            isOpen={systemOpen}
            onToggle={() => setSystemOpen((v) => !v)}
            isActive={isActive}
          />
        </nav>
      </aside>

      {/* Mobile Top Bar */}
      <header className="pm-topbar md:hidden">
        <div className="flex items-center w-full px-4 gap-4">
          <Link href="/pitches" className="flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="9" cy="9" r="4" fill="white" opacity="0.9" />
                <path d="M9 2C9 2 13 5 13 9C13 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                <path d="M9 2C9 2 5 5 5 9C5 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">Pitchhood</span>
          </Link>

          {activeNavItem && (
            <span className="text-sm font-medium text-muted-foreground">{activeNavItem.label}</span>
          )}

          <button
            className="ml-auto pm-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            type="button"
          >
            <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} variant="outline" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay + Panel */}
      {drawerVisible && (
        <div className="md:hidden fixed inset-0 z-40" aria-hidden={!mobileOpen}>
          {/* Backdrop overlay */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              mobileOpen ? 'opacity-40' : 'opacity-0'
            }`}
            onClick={closeDrawer}
            aria-label="Close menu overlay"
          />

          {/* Drawer panel */}
          <div
            className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-background shadow-2xl flex flex-col
              transform transition-transform duration-300 ease-in-out ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="9" cy="9" r="4" fill="white" opacity="0.9" />
                    <path d="M9 2C9 2 13 5 13 9C13 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <path d="M9 2C9 2 5 5 5 9C5 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-foreground tracking-tight">Pitchhood</span>
              </div>
              <button
                className="pm-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
                onClick={closeDrawer}
                aria-label="Close menu"
                type="button"
              >
                <Icon name="XMarkIcon" size={22} variant="outline" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-4 pt-3 gap-0.5 flex-1 overflow-y-auto" aria-label="Mobile navigation">
              {/* Core items */}
              {coreItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      active ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon name={item.icon as any} size={20} variant="outline" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

              {/* Workflow group */}
              <NavGroup
                label="Workflow"
                items={workflowItems}
                isOpen={workflowOpen}
                onToggle={() => setWorkflowOpen((v) => !v)}
                isActive={isActive}
                onLinkClick={closeDrawer}
                mobile
              />

              {/* Divider */}
              <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

              {/* System group */}
              <NavGroup
                label="System"
                items={systemItems}
                isOpen={systemOpen}
                onToggle={() => setSystemOpen((v) => !v)}
                isActive={isActive}
                onLinkClick={closeDrawer}
                mobile
              />
            </nav>

            {/* Footer action */}
            <div className="px-4 pb-8 pt-4 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
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

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConnectionStatus from '@/components/ui/ConnectionStatus';
import RealtimeBadge from '@/components/ui/RealtimeBadge';
import { useThemeContext } from '@/context/ThemeContext';
import Image from 'next/image';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { useToast } from '@/components/ui/Toast';

interface HeaderProps {
  isOpen?: boolean;
  onMenuToggle?: (open: boolean) => void;
}

const navItems = [
  { label: 'Artists', path: '/artists-listing-dashboard', icon: 'MusicalNoteIcon' },
  { label: 'Artist Detail', path: '/artist-detail-management', icon: 'UserCircleIcon' },
  { label: 'Contacts', path: '/contacts', icon: 'UsersIcon' },
  { label: 'Pitches', path: '/pitches', icon: 'PaperAirplaneIcon' },
  { label: 'Settings', path: '/settings', icon: 'Cog6ToothIcon' },
];

const Header = ({ isOpen = false, onMenuToggle }: HeaderProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(isOpen);
  const { resolvedTheme, toggleTheme } = useThemeContext();
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEvent = useCallback((event: import('@/hooks/useRealtimeSubscriptions').RealtimeEvent) => {
    showToast(event.message, event.toastType);
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    // Trigger a soft refresh by dispatching a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('realtime-refresh'));
  }, []);

  const { status: realtimeStatus } = useRealtimeSubscriptions({
    onEvent: handleEvent,
    onRefresh: handleRefresh,
  });

  const handleMenuToggle = () => {
    const next = !mobileOpen;
    setMobileOpen(next);
    onMenuToggle?.(next);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
    onMenuToggle?.(false);
  };

  const isActive = (path: string) => mounted && (pathname === path || pathname.startsWith(path + '/'));

  return (
    <>
      <header className="pm-topbar px-0">
        <div className="flex items-center w-full px-6 gap-8">
          <Link href="/pitches" className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg">
            <Image src="/assets/images/pitchhood-logo-light-1772649730204.png" alt="Pitchhood" width={140} height={32} className="hidden sm:block h-8 w-auto" priority />
            <Image src="/assets/images/pitchhood-logo-light-1772649730204.png" alt="Pitchhood" width={32} height={32} className="sm:hidden h-8 w-auto" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`pm-nav-link ${isActive(item.path) ? 'active' : ''}`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <Icon name={item.icon as any} size={16} variant="outline" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 ml-auto">
            <RealtimeBadge status={realtimeStatus} />
            <ConnectionStatus />
            <button
              onClick={toggleTheme}
              className="pm-btn min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
            >
              {resolvedTheme === 'dark' ? (
                <Icon name="SunIcon" size={18} variant="outline" />
              ) : (
                <Icon name="MoonIcon" size={18} variant="outline" />
              )}
            </button>
            <Link href="/pitches" className="pm-btn-primary" aria-label="Go to pitches">
              <Icon name="PlusIcon" size={16} variant="outline" />
              New Pitch
            </Link>
          </div>

          <button
            className="md:hidden ml-auto pm-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
            onClick={handleMenuToggle}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            type="button"
          >
            <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} variant="outline" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="pm-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2.5">
              <Image src="/assets/images/pitchhood-logo-light-1772649730204.png" alt="Pitchhood" width={140} height={32} className="h-8 w-auto" priority />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="pm-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                type="button"
              >
                {resolvedTheme === 'dark' ? (
                  <Icon name="SunIcon" size={20} variant="outline" />
                ) : (
                  <Icon name="MoonIcon" size={20} variant="outline" />
                )}
              </button>
              <button className="pm-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg" onClick={handleMobileClose} aria-label="Close menu" type="button">
                <Icon name="XMarkIcon" size={22} variant="outline" />
              </button>
            </div>
          </div>

          <nav className="flex flex-col px-4 pt-4 gap-1 flex-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleMobileClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-250 min-h-[52px] ${
                  isActive(item.path) ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <Icon name={item.icon as any} size={20} variant="outline" />
                {item.label}
                {isActive(item.path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />}
              </Link>
            ))}
          </nav>

          <div className="px-4 pb-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="mb-3">
              <ConnectionStatus />
            </div>
            <Link href="/pitches" onClick={handleMobileClose} className="pm-btn-primary w-full justify-center">
              <Icon name="PlusIcon" size={18} variant="outline" />
              New Pitch
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
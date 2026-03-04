'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import SmartSuggestions from '@/components/ui/SmartSuggestions';
import NewPitchModal from '@/components/ui/NewPitchModal';

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: string;
  color: string;
  progress: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'submitted' | 'approved' | 'sent' | 'added' | 'placed';
  href: string;
}

interface TopArtist {
  id: string;
  name: string;
  genre: string;
  initials: string;
  avatarColor: string;
  approvalRate: number;
  totalPitches: number;
  approvedPitches: number;
  trend: 'up' | 'down' | 'neutral';
}

const statCards: StatCard[] = [
  {
    label: 'Total Pitches',
    value: 142,
    sub: 'All time submissions',
    trend: 'up',
    trendValue: '+12 this month',
    icon: 'PaperAirplaneIcon',
    color: '#3b82f6',
    progress: 71,
  },
  {
    label: 'Artists',
    value: 38,
    sub: 'Active roster',
    trend: 'up',
    trendValue: '+3 this month',
    icon: 'MusicalNoteIcon',
    color: '#8b5cf6',
    progress: 76,
  },
  {
    label: 'Approval Rate',
    value: '64%',
    sub: 'Pitches placed / submitted',
    trend: 'up',
    trendValue: '+4% vs last month',
    icon: 'CheckCircleIcon',
    color: '#10b981',
    progress: 64,
  },
];

const activityFeed: ActivityItem[] = [
  {
    id: 'a1',
    title: 'Pitch placed',
    description: '"Noite de Verao" by Mariana Luz placed at Sony Music Brasil',
    timestamp: '02/03/2026 09:14',
    status: 'placed',
    href: '/pitch-detail-management',
  },
  {
    id: 'a2',
    title: 'Pitch approved',
    description: '"Raizes do Sertao" by Trio Nordestino approved for placement',
    timestamp: '01/03/2026 17:45',
    status: 'approved',
    href: '/pitch-detail-management',
  },
  {
    id: 'a3',
    title: 'Artist added',
    description: 'New artist "DJ Favela" added to roster with 3 initial pitches',
    timestamp: '01/03/2026 14:22',
    status: 'added',
    href: '/artists-listing-dashboard',
  },
  {
    id: 'a4',
    title: 'Pitch submitted',
    description: '"Batidao Carioca Vol. 3" submitted to Universal Music',
    timestamp: '01/03/2026 11:08',
    status: 'submitted',
    href: '/pitch-detail-management',
  },
  {
    id: 'a5',
    title: 'Pitch sent',
    description: '"Alma Livre" by Beatriz Santos sent to Warner Music for review',
    timestamp: '28/02/2026 16:30',
    status: 'sent',
    href: '/pitch-detail-management',
  },
  {
    id: 'a6',
    title: 'Pitch approved',
    description: '"Samba Moderno" by Grupo Carioca approved — awaiting placement',
    timestamp: '28/02/2026 10:15',
    status: 'approved',
    href: '/pitch-detail-management',
  },
  {
    id: 'a7',
    title: 'Pitch submitted',
    description: '"Forró Eletrônico" by Banda Nordeste submitted to EMI Records',
    timestamp: '27/02/2026 15:00',
    status: 'submitted',
    href: '/pitch-detail-management',
  },
  {
    id: 'a8',
    title: 'Artist added',
    description: 'New artist "Beatriz Santos" onboarded with genre: MPB',
    timestamp: '27/02/2026 09:30',
    status: 'added',
    href: '/artists-listing-dashboard',
  },
];

const topArtists: TopArtist[] = [
  {
    id: 'ta1',
    name: 'Mariana Luz',
    genre: 'Pop',
    initials: 'ML',
    avatarColor: '#3b82f6',
    approvalRate: 88,
    totalPitches: 17,
    approvedPitches: 15,
    trend: 'up',
  },
  {
    id: 'ta2',
    name: 'Trio Nordestino',
    genre: 'Forró',
    initials: 'TN',
    avatarColor: '#8b5cf6',
    approvalRate: 82,
    totalPitches: 22,
    approvedPitches: 18,
    trend: 'up',
  },
  {
    id: 'ta3',
    name: 'Beatriz Santos',
    genre: 'MPB',
    initials: 'BS',
    avatarColor: '#10b981',
    approvalRate: 75,
    totalPitches: 12,
    approvedPitches: 9,
    trend: 'neutral',
  },
  {
    id: 'ta4',
    name: 'DJ Favela',
    genre: 'Funk',
    initials: 'DF',
    avatarColor: '#f59e0b',
    approvalRate: 67,
    totalPitches: 9,
    approvedPitches: 6,
    trend: 'up',
  },
  {
    id: 'ta5',
    name: 'Grupo Carioca',
    genre: 'Samba',
    initials: 'GC',
    avatarColor: '#ef4444',
    approvalRate: 58,
    totalPitches: 19,
    approvedPitches: 11,
    trend: 'down',
  },
];

const statusConfig: Record<ActivityItem['status'], { label: string; bg: string; color: string; icon: string }> = {
  submitted: { label: 'Submitted', bg: '#eff6ff', color: '#1d4ed8', icon: 'PaperAirplaneIcon' },
  approved: { label: 'Approved', bg: '#d1fae5', color: '#065f46', icon: 'CheckCircleIcon' },
  sent: { label: 'Sent', bg: '#fef3c7', color: '#92400e', icon: 'EnvelopeIcon' },
  added: { label: 'Added', bg: '#f3e8ff', color: '#6b21a8', icon: 'PlusCircleIcon' },
  placed: { label: 'Placed', bg: '#dcfce7', color: '#14532d', icon: 'StarIcon' },
};

const quickActions = [
  { label: 'New Pitch', icon: 'PaperAirplaneIcon', href: '/pitch-creation-workflow', color: '#3b82f6' },
  { label: 'Add Artist', icon: 'MusicalNoteIcon', href: '/artists-listing-dashboard', color: '#8b5cf6' },
  { label: 'View Pitches', icon: 'ClipboardDocumentListIcon', href: '/pitches-listing-dashboard', color: '#10b981' },
  { label: 'Notifications', icon: 'BellIcon', href: '/notifications-center', color: '#f59e0b' },
];

export default function DashboardPage() {
  const [activityExpanded, setActivityExpanded] = useState<Set<string>>(new Set());
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [newPitchModalOpen, setNewPitchModalOpen] = useState(false);
  const [pitchModalContext, setPitchModalContext] = useState<{ artistId?: string; contactId?: string }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for real-time refresh events dispatched by the Header's subscription
  useEffect(() => {
    const handleRealtimeRefresh = () => {
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('realtime-refresh', handleRealtimeRefresh);
    return () => window.removeEventListener('realtime-refresh', handleRealtimeRefresh);
  }, []);

  const toggleActivity = (id: string) => {
    setActivityExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visibleActivity = showAllActivity ? activityFeed : activityFeed.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Header */}
          <div className="pm-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="pm-kicker">Overview</p>
                <h1 className="pm-h1">Dashboard</h1>
              </div>
              <button
                type="button"
                onClick={() => setNewPitchModalOpen(true)}
                className="pm-btn-primary shrink-0"
              >
                <Icon name="PlusIcon" size={16} variant="outline" />
                New Pitch
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="pm-panel hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${card.color}18` }}
                  >
                    <Icon name={card.icon as any} size={18} variant="outline" style={{ color: card.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon
                      name={card.trend === 'up' ? 'ArrowTrendingUpIcon' : card.trend === 'down' ? 'ArrowTrendingDownIcon' : 'MinusIcon'}
                      size={13}
                      variant="outline"
                      style={{ color: card.trend === 'up' ? '#10b981' : card.trend === 'down' ? '#ef4444' : '#6b7280' }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: card.trend === 'up' ? '#10b981' : card.trend === 'down' ? '#ef4444' : '#6b7280' }}
                    >
                      {card.trendValue}
                    </span>
                  </div>
                </div>

                <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                  {card.value}
                </p>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {card.label}
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted-foreground)' }}>{card.sub}</p>

                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${card.progress}%`, background: card.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Smart Suggestions */}
          <SmartSuggestions
            context="Insights"
            maxVisible={3}
            onPitchNow={(ctx) => {
              setPitchModalContext(ctx);
              setNewPitchModalOpen(true);
            }}
          />

          {/* Main Content: Activity + Top Artists */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Recent Activity Feed */}
            <div className="lg:col-span-3 pm-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="pm-kicker mb-0">Live</p>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Recent Activity</h2>
                </div>
                <Link
                  href="/activity-dashboard"
                  className="pm-btn text-xs py-1 px-2.5 flex items-center gap-1"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  View all
                  <Icon name="ArrowRightIcon" size={12} variant="outline" />
                </Link>
              </div>

              <div className="space-y-1">
                {visibleActivity.map((item) => {
                  const cfg = statusConfig[item.status];
                  const isExpanded = activityExpanded.has(item.id);
                  return (
                    <div key={item.id}>
                      <div
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted transition-colors duration-150"
                        style={{ background: isExpanded ? 'var(--color-muted)' : undefined }}
                        onClick={() => toggleActivity(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleActivity(item.id)}
                        aria-expanded={isExpanded}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: cfg.bg }}
                        >
                          <Icon name={cfg.icon as any} size={14} variant="outline" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                              {item.description}
                            </p>
                            <Icon
                              name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                              size={14}
                              variant="outline"
                              style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }}
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div
                          className="px-3 pb-3"
                          style={{ borderTop: '1px solid var(--color-border)' }}
                        >
                          <div className="pl-10 pt-2">
                            <p className="text-xs mb-2" style={{ color: 'var(--color-muted-foreground)' }}>
                              {item.title} &middot; {item.timestamp}
                            </p>
                            <Link
                              href={item.href}
                              className="pm-btn text-xs py-1 px-2.5 inline-flex items-center gap-1"
                            >
                              View Details
                              <Icon name="ArrowRightIcon" size={11} variant="outline" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {activityFeed.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivity((v) => !v)}
                  className="w-full mt-3 py-2 text-xs font-medium rounded-xl transition-colors duration-150 hover:bg-muted"
                  style={{ color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}
                >
                  {showAllActivity ? 'Show less' : `Show ${activityFeed.length - 5} more`}
                </button>
              )}
            </div>

            {/* Top Performing Artists */}
            <div className="lg:col-span-2 pm-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="pm-kicker mb-0">Rankings</p>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Top Artists</h2>
                </div>
                <Link
                  href="/artists-listing-dashboard"
                  className="pm-btn text-xs py-1 px-2.5 flex items-center gap-1"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  All artists
                  <Icon name="ArrowRightIcon" size={12} variant="outline" />
                </Link>
              </div>

              <div className="space-y-2">
                {topArtists.map((artist, idx) => (
                  <Link
                    key={artist.id}
                    href="/artists-listing-dashboard"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors duration-150"
                  >
                    {/* Rank */}
                    <span
                      className="text-xs font-bold w-4 text-center shrink-0"
                      style={{
                        color: idx === 0 ? '#f59e0b' : idx === 1 ? '#6b7280' : idx === 2 ? '#b45309' : 'var(--color-muted-foreground)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {idx + 1}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: artist.avatarColor }}
                      aria-label={`${artist.name} avatar`}
                    >
                      {artist.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                          {artist.name}
                        </p>
                        <Icon
                          name={artist.trend === 'up' ? 'ArrowTrendingUpIcon' : artist.trend === 'down' ? 'ArrowTrendingDownIcon' : 'MinusIcon'}
                          size={11}
                          variant="outline"
                          style={{ color: artist.trend === 'up' ? '#10b981' : artist.trend === 'down' ? '#ef4444' : '#6b7280', flexShrink: 0 }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontSize: '0.65rem' }}
                        >
                          {artist.genre}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {artist.approvedPitches}/{artist.totalPitches}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${artist.approvalRate}%`, background: artist.avatarColor }}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold shrink-0"
                          style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif', minWidth: '2.2rem', textAlign: 'right' }}
                        >
                          {artist.approvalRate}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div
                className="mt-4 pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Ranked by approval rate</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Avg 67%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pm-panel">
            <p className="pm-kicker mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                action.label === 'New Pitch' ? (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setNewPitchModalOpen(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all duration-150 text-center group w-full"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                      style={{ background: `${action.color}18` }}
                    >
                      <Icon name={action.icon as any} size={20} variant="outline" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                      {action.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all duration-150 text-center group"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                      style={{ background: `${action.color}18` }}
                    >
                      <Icon name={action.icon as any} size={20} variant="outline" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                      {action.label}
                    </span>
                  </Link>
                )
              ))}
            </div>
          </div>

        </div>
      </main>

      <NewPitchModal
        isOpen={newPitchModalOpen}
        onClose={() => { setNewPitchModalOpen(false); setPitchModalContext({}); }}
        initialArtistId={pitchModalContext.artistId}
        initialContactId={pitchModalContext.contactId}
      />
    </div>
  );
}

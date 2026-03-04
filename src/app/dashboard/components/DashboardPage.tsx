'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import SmartSuggestions from '@/components/ui/SmartSuggestions';
import NewPitchModal from '@/components/ui/NewPitchModal';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalPitches: number;
  totalArtists: number;
  approvalRate: number;
  pitchesThisMonth: number;
  artistsThisMonth: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'submitted' | 'approved' | 'sent' | 'added' | 'placed' | 'draft';
  href: string;
}

interface TopArtist {
  id: string;
  name: string;
  genre: string;
  initials: string;
  avatarColor: string;
  totalPitches: number;
  placedPitches: number;
  approvalRate: number;
}

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  draft: { label: 'Draft', bg: '#f3f4f6', color: '#374151', icon: 'DocumentIcon' },
  submitted: { label: 'Submitted', bg: '#eff6ff', color: '#1d4ed8', icon: 'PaperAirplaneIcon' },
  approved: { label: 'Approved', bg: '#d1fae5', color: '#065f46', icon: 'CheckCircleIcon' },
  sent: { label: 'Sent', bg: '#fef3c7', color: '#92400e', icon: 'EnvelopeIcon' },
  added: { label: 'Added', bg: '#f3e8ff', color: '#6b21a8', icon: 'PlusCircleIcon' },
  placed: { label: 'Placed', bg: '#dcfce7', color: '#14532d', icon: 'StarIcon' },
  hold: { label: 'Hold', bg: '#fef3c7', color: '#92400e', icon: 'PauseCircleIcon' },
};

const quickActions = [
  { label: 'New Pitch', icon: 'PaperAirplaneIcon', href: '/pitch-creation-workflow', color: '#3b82f6' },
  { label: 'Add Artist', icon: 'MusicalNoteIcon', href: '/artists-listing-dashboard', color: '#8b5cf6' },
  { label: 'View Pitches', icon: 'ClipboardDocumentListIcon', href: '/pitches-listing-dashboard', color: '#10b981' },
  { label: 'Notifications', icon: 'BellIcon', href: '/notifications-center', color: '#f59e0b' },
];

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalPitches: 0,
    totalArtists: 0,
    approvalRate: 0,
    pitchesThisMonth: 0,
    artistsThisMonth: 0,
  });
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState<Set<string>>(new Set());
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [newPitchModalOpen, setNewPitchModalOpen] = useState(false);
  const [pitchModalContext, setPitchModalContext] = useState<{ artistId?: string; contactId?: string }>({});

  const fetchDashboardData = async () => {
    console.log('[Dashboard] 🔄 Fetching dashboard data from Supabase...');
    setLoadingData(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch pitches
      console.log('[Dashboard] Querying pitches table...');
      const { data: pitches, error: pitchesError } = await supabase
        .from('pitches')
        .select('id, title, status, created_at, artist_id')
        .order('created_at', { ascending: false });

      if (pitchesError) {
        console.error('[Dashboard] ❌ Pitches query error:', pitchesError.message);
      } else {
        console.log('[Dashboard] ✅ Pitches fetched:', pitches?.length ?? 0, 'rows', pitches);
      }

      // Fetch artists
      console.log('[Dashboard] Querying artists table...');
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, genre, created_at')
        .order('created_at', { ascending: false });

      if (artistsError) {
        console.error('[Dashboard] ❌ Artists query error:', artistsError.message);
      } else {
        console.log('[Dashboard] ✅ Artists fetched:', artists?.length ?? 0, 'rows', artists);
      }

      const pitchList = pitches ?? [];
      const artistList = artists ?? [];

      // Compute stats
      const totalPitches = pitchList.length;
      const totalArtists = artistList.length;
      const placedPitches = pitchList.filter((p) => p.status === 'placed').length;
      const approvalRate = totalPitches > 0 ? Math.round((placedPitches / totalPitches) * 100) : 0;
      const pitchesThisMonth = pitchList.filter((p) => p.created_at >= startOfMonth).length;
      const artistsThisMonth = artistList.filter((a) => a.created_at >= startOfMonth).length;

      console.log('[Dashboard] Stats computed:', { totalPitches, totalArtists, approvalRate, pitchesThisMonth, artistsThisMonth });

      setStats({ totalPitches, totalArtists, approvalRate, pitchesThisMonth, artistsThisMonth });

      // Build activity feed from recent pitches
      const activity: ActivityItem[] = pitchList.slice(0, 8).map((p) => {
        const artist = artistList.find((a) => a.id === p.artist_id);
        const artistName = artist?.name ?? 'Unknown Artist';
        const statusMap: Record<string, ActivityItem['status']> = {
          placed: 'placed',
          approved: 'approved',
          sent: 'sent',
          submitted: 'submitted',
          draft: 'draft',
          hold: 'sent',
        };
        return {
          id: p.id,
          title: `Pitch ${p.status}`,
          description: `"${p.title}" by ${artistName}`,
          timestamp: new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: statusMap[p.status] ?? 'submitted',
          href: '/pitch-detail-management',
        };
      });
      console.log('[Dashboard] Activity feed built:', activity.length, 'items');
      setActivityFeed(activity);

      // Build top artists by pitch count
      const artistPitchMap: Record<string, { total: number; placed: number }> = {};
      pitchList.forEach((p) => {
        if (!p.artist_id) return;
        if (!artistPitchMap[p.artist_id]) artistPitchMap[p.artist_id] = { total: 0, placed: 0 };
        artistPitchMap[p.artist_id].total++;
        if (p.status === 'placed') artistPitchMap[p.artist_id].placed++;
      });

      const top: TopArtist[] = artistList
        .filter((a) => artistPitchMap[a.id])
        .map((a, idx) => ({
          id: a.id,
          name: a.name,
          genre: a.genre ?? 'Unknown',
          initials: getInitials(a.name),
          avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          totalPitches: artistPitchMap[a.id]?.total ?? 0,
          placedPitches: artistPitchMap[a.id]?.placed ?? 0,
          approvalRate: artistPitchMap[a.id]?.total > 0
            ? Math.round((artistPitchMap[a.id].placed / artistPitchMap[a.id].total) * 100)
            : 0,
        }))
        .sort((a, b) => b.approvalRate - a.approvalRate)
        .slice(0, 5);

      console.log('[Dashboard] Top artists computed:', top.length, 'artists', top);
      setTopArtists(top);
    } catch (err: any) {
      console.error('[Dashboard] ❌ Unexpected error fetching dashboard data:', err?.message ?? err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for real-time refresh events dispatched by the Header's subscription
  useEffect(() => {
    const handleRealtimeRefresh = () => {
      console.log('[Dashboard] Realtime refresh event received — refetching data...');
      fetchDashboardData();
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

  const statCards = [
    {
      label: 'Total Pitches',
      value: loadingData ? '...' : stats.totalPitches,
      sub: 'All time submissions',
      trend: 'up' as const,
      trendValue: `+${stats.pitchesThisMonth} this month`,
      icon: 'PaperAirplaneIcon',
      color: '#3b82f6',
      progress: Math.min(stats.totalPitches, 100),
    },
    {
      label: 'Artists',
      value: loadingData ? '...' : stats.totalArtists,
      sub: 'Active roster',
      trend: 'up' as const,
      trendValue: `+${stats.artistsThisMonth} this month`,
      icon: 'MusicalNoteIcon',
      color: '#8b5cf6',
      progress: Math.min(stats.totalArtists * 2, 100),
    },
    {
      label: 'Approval Rate',
      value: loadingData ? '...' : `${stats.approvalRate}%`,
      sub: 'Pitches placed / submitted',
      trend: 'up' as const,
      trendValue: 'Based on placements',
      icon: 'CheckCircleIcon',
      color: '#10b981',
      progress: stats.approvalRate,
    },
  ];

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
                      name="ArrowTrendingUpIcon"
                      size={13}
                      variant="outline"
                      style={{ color: '#10b981' }}
                    />
                    <span className="text-xs font-medium" style={{ color: '#10b981' }}>
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

              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted-foreground)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="PaperAirplaneIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>No activity yet. Create your first pitch!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {visibleActivity.map((item) => {
                    const cfg = statusConfig[item.status] ?? statusConfig.submitted;
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
              )}

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

              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted-foreground)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : topArtists.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="MusicalNoteIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>No artists with pitches yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topArtists.map((artist, idx) => (
                    <Link
                      key={artist.id}
                      href="/artists-listing-dashboard"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors duration-150"
                    >
                      <span
                        className="text-xs font-bold w-4 text-center shrink-0"
                        style={{
                          color: idx === 0 ? '#f59e0b' : idx === 1 ? '#6b7280' : idx === 2 ? '#b45309' : 'var(--color-muted-foreground)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: artist.avatarColor }}
                        aria-label={`${artist.name} avatar`}
                      >
                        {artist.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                            {artist.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontSize: '0.65rem' }}
                          >
                            {artist.genre}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            {artist.placedPitches}/{artist.totalPitches}
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
              )}

              <div
                className="mt-4 pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Ranked by placement rate</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {topArtists.length > 0
                      ? `Avg ${Math.round(topArtists.reduce((s, a) => s + a.approvalRate, 0) / topArtists.length)}%`
                      : 'No data'}
                  </span>
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

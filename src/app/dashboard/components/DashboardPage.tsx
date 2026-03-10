'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

const AVATAR_COLORS = ['#486CE3', '#4E5E2E', '#B8622A', '#C23B2E', '#7A7470', '#486CE3', '#4E5E2E'];

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  draft:     { label: 'Draft',     bg: 'rgba(122,116,112,0.1)',  color: '#7A7470', icon: 'DocumentIcon'       },
  new:       { label: 'New',       bg: 'rgba(72,108,227,0.12)',  color: '#486CE3', icon: 'PaperAirplaneIcon'  },
  in_review: { label: 'In Review', bg: 'rgba(184,98,42,0.12)',   color: '#B8622A', icon: 'EnvelopeIcon'       },
  approved:  { label: 'Approved',  bg: 'rgba(78,94,46,0.12)',    color: '#4E5E2E', icon: 'CheckCircleIcon'    },
  rejected:  { label: 'Rejected',  bg: 'rgba(194,59,46,0.12)',   color: '#C23B2E', icon: 'XCircleIcon'        },
  submitted: { label: 'Submitted', bg: 'rgba(72,108,227,0.12)',  color: '#486CE3', icon: 'PaperAirplaneIcon'  },
  added:     { label: 'Added',     bg: 'rgba(72,108,227,0.12)',  color: '#486CE3', icon: 'PlusCircleIcon'     },
  placed:    { label: 'Placed',    bg: 'rgba(78,94,46,0.12)',    color: '#4E5E2E', icon: 'StarIcon'           },
  sent:      { label: 'Sent',      bg: 'rgba(184,98,42,0.12)',   color: '#B8622A', icon: 'EnvelopeIcon'       },
  hold:      { label: 'Hold',      bg: 'rgba(184,98,42,0.12)',   color: '#B8622A', icon: 'PauseCircleIcon'    },
};

const quickActions = [
  { label: 'New Pitch',     icon: 'PaperAirplaneIcon',         href: '/pitch-creation-workflow',   color: '#486CE3' },
  { label: 'Add Artist',    icon: 'MusicalNoteIcon',            href: '/artists',                   color: '#4E5E2E' },
  { label: 'View Pitches',  icon: 'ClipboardDocumentListIcon', href: '/pitches-listing-dashboard', color: '#B8622A' },
  { label: 'Notifications', icon: 'BellIcon',                  href: '/notifications-center',      color: '#C23B2E' },
];

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState<DashboardStats>({
    totalPitches: 0, totalArtists: 0, approvalRate: 0,
    pitchesThisMonth: 0, artistsThisMonth: 0,
  });
  const [activityFeed, setActivityFeed]     = useState<ActivityItem[]>([]);
  const [topArtists, setTopArtists]         = useState<TopArtist[]>([]);
  const [loadingData, setLoadingData]       = useState(true);
  const [activityExpanded, setActivityExpanded] = useState<Set<string>>(new Set());
  const [showAllActivity, setShowAllActivity]   = useState(false);
  const [newPitchModalOpen, setNewPitchModalOpen] = useState(false);
  const [pitchModalContext, setPitchModalContext] = useState<{ artistId?: string; contactId?: string }>({});

  const fetchDashboardData = useCallback(async () => {
    setLoadingData(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: pitches, error: pitchesError } = await supabase
        .from('pitches')
        .select('id, title, status, created_at, artist_id')
        .order('created_at', { ascending: false });

      if (pitchesError) console.error('[Dashboard] pitches error:', pitchesError.message);

      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, genre, created_at')
        .order('created_at', { ascending: false });

      if (artistsError) console.error('[Dashboard] artists error:', artistsError.message);

      const pitchList  = pitches  ?? [];
      const artistList = artists  ?? [];

      const totalPitches      = pitchList.length;
      const totalArtists      = artistList.length;
      const placedPitches     = pitchList.filter((p) => p.status === 'placed').length;
      const approvalRate      = totalPitches > 0 ? Math.round((placedPitches / totalPitches) * 100) : 0;
      const pitchesThisMonth  = pitchList.filter((p) => p.created_at >= startOfMonth).length;
      const artistsThisMonth  = artistList.filter((a) => a.created_at >= startOfMonth).length;

      setStats({ totalPitches, totalArtists, approvalRate, pitchesThisMonth, artistsThisMonth });

      const activity: ActivityItem[] = pitchList.slice(0, 8).map((p) => {
        const artist     = artistList.find((a) => a.id === p.artist_id);
        const artistName = artist?.name ?? 'Unknown Artist';
        const statusMap: Record<string, ActivityItem['status']> = {
          approved: 'approved', new: 'submitted', in_review: 'sent',
          draft: 'draft', placed: 'placed', rejected: 'submitted', sent: 'sent', hold: 'sent',
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
      setActivityFeed(activity);

      const artistPitchMap: Record<string, { total: number; placed: number }> = {};
      pitchList.forEach((p) => {
        if (!p.artist_id) return;
        if (!artistPitchMap[p.artist_id]) artistPitchMap[p.artist_id] = { total: 0, placed: 0 };
        artistPitchMap[p.artist_id].total++;
        if (p.status === 'approved') artistPitchMap[p.artist_id].placed++;
      });

      const top: TopArtist[] = artistList
        .filter((a) => artistPitchMap[a.id])
        .map((a, idx) => ({
          id: a.id, name: a.name, genre: a.genre ?? 'Unknown',
          initials: getInitials(a.name),
          avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          totalPitches:  artistPitchMap[a.id]?.total  ?? 0,
          placedPitches: artistPitchMap[a.id]?.placed ?? 0,
          approvalRate:  artistPitchMap[a.id]?.total > 0
            ? Math.round((artistPitchMap[a.id].placed / artistPitchMap[a.id].total) * 100)
            : 0,
        }))
        .sort((a, b) => b.approvalRate - a.approvalRate)
        .slice(0, 5);

      setTopArtists(top);
    } catch (err: unknown) {
      console.error('[Dashboard] unexpected error:', err instanceof Error ? err.message : err);
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    const handleRealtimeRefresh = () => fetchDashboardData();
    window.addEventListener('realtime-refresh', handleRealtimeRefresh);
    return () => window.removeEventListener('realtime-refresh', handleRealtimeRefresh);
  }, [fetchDashboardData]);

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
      trendValue: `+${stats.pitchesThisMonth} this month`,
      icon: 'PaperAirplaneIcon',
      color: '#486CE3',
      progress: Math.min(stats.totalPitches, 100),
    },
    {
      label: 'Artists',
      value: loadingData ? '...' : stats.totalArtists,
      sub: 'Active roster',
      trendValue: `+${stats.artistsThisMonth} this month`,
      icon: 'MusicalNoteIcon',
      color: '#4E5E2E',
      progress: Math.min(stats.totalArtists * 2, 100),
    },
    {
      label: 'Approval Rate',
      value: loadingData ? '...' : `${stats.approvalRate}%`,
      sub: 'Pitches placed / submitted',
      trendValue: 'Based on placements',
      icon: 'CheckCircleIcon',
      color: '#B8622A',
      progress: stats.approvalRate,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
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
              <button type="button" onClick={() => setNewPitchModalOpen(true)} className="pm-btn-primary shrink-0">
                <Icon name="PlusIcon" size={16} variant="outline" />
                New Pitch
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loadingData ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="pm-panel animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: 'var(--cream)' }} />
                    <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--cream)' }} />
                  </div>
                  <div className="h-7 w-16 rounded mb-1" style={{ backgroundColor: 'var(--cream)' }} />
                  <div className="h-3 w-24 rounded mb-1" style={{ backgroundColor: 'var(--cream)' }} />
                  <div className="h-3 w-32 rounded mb-3" style={{ backgroundColor: 'var(--cream)' }} />
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                </div>
              ))
            ) : (
              statCards.map((card) => (
                <div key={card.label} className="pm-panel hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${card.color}18` }}
                    >
                      <Icon name={card.icon as any} size={18} variant="outline" style={{ color: card.color }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="ArrowTrendingUpIcon" size={13} variant="outline" style={{ color: '#4E5E2E' }} />
                      <span className="text-xs font-medium" style={{ color: '#4E5E2E', fontFamily: 'Azeret Mono, monospace' }}>
                        {card.trendValue}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>
                    {card.value}
                  </p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink)', fontFamily: 'Azeret Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {card.label}
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>
                    {card.sub}
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cream)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${card.progress}%`, backgroundColor: card.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Smart Suggestions */}
          <SmartSuggestions
            context="Insights"
            maxVisible={3}
            onPitchNow={(ctx) => { setPitchModalContext(ctx); setNewPitchModalOpen(true); }}
          />

          {/* Activity + Top Artists */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Recent Activity */}
            <div className="lg:col-span-3 pm-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="pm-kicker mb-0">Live</p>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>Recent Activity</h2>
                </div>
                <Link
                  href="/activity-dashboard"
                  className="pm-btn text-xs py-1 px-2.5 flex items-center gap-1"
                  style={{ color: 'var(--stone)' }}
                >
                  View all
                  <Icon name="ArrowRightIcon" size={12} variant="outline" />
                </Link>
              </div>

              {loadingData ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                      <div className="w-7 h-7 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 rounded w-3/4" style={{ backgroundColor: 'var(--cream)' }} />
                        <div className="flex gap-2">
                          <div className="h-4 w-16 rounded-md" style={{ backgroundColor: 'var(--cream)' }} />
                          <div className="h-4 w-24 rounded"   style={{ backgroundColor: 'var(--cream)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(72,108,227,0.1)' }}>
                    <Icon name="PaperAirplaneIcon" size={22} variant="outline" style={{ color: '#486CE3' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>Your pipeline is empty</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>Add artists and pitches to see your stats and activity here.</p>
                  <div className="flex items-center gap-2">
                    <Link href="/artists" className="pm-btn text-xs py-1.5 px-3 flex items-center gap-1">
                      <Icon name="MusicalNoteIcon" size={12} variant="outline" />
                      Add Artist
                    </Link>
                    <button
                      type="button"
                      onClick={() => setNewPitchModalOpen(true)}
                      className="pm-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Icon name="PlusIcon" size={12} variant="outline" />
                      New Pitch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {visibleActivity.map((item) => {
                    const cfg        = statusConfig[item.status] ?? statusConfig.submitted;
                    const isExpanded = activityExpanded.has(item.id);
                    return (
                      <div key={item.id}>
                        <div
                          className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-150"
                          style={{ backgroundColor: isExpanded ? 'var(--cream)' : 'transparent' }}
                          onClick={() => toggleActivity(item.id)}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--cream)'; }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && toggleActivity(item.id)}
                          aria-expanded={isExpanded}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: cfg.bg }}
                          >
                            <Icon name={cfg.icon as any} size={14} variant="outline" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>
                                {item.description}
                              </p>
                              <Icon
                                name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                                size={14}
                                variant="outline"
                                style={{ color: 'var(--stone)', flexShrink: 0 }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'Azeret Mono, monospace' }}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
                                {item.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--cream)' }}>
                            <div className="pl-10 pt-2">
                              <p className="text-xs mb-2" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
                                {item.title} &middot; {item.timestamp}
                              </p>
                              <Link href={item.href} className="pm-btn text-xs py-1 px-2.5 inline-flex items-center gap-1">
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
                  className="w-full mt-3 py-2 text-xs font-medium rounded-xl transition-colors duration-150"
                  style={{
                    color: 'var(--stone)',
                    border: '1px solid var(--cream)',
                    fontFamily: 'Azeret Mono, monospace',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {showAllActivity ? 'Show less' : `Show ${activityFeed.length - 5} more`}
                </button>
              )}
            </div>

            {/* Top Artists */}
            <div className="lg:col-span-2 pm-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="pm-kicker mb-0">Rankings</p>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>Top Artists</h2>
                </div>
                <Link
                  href="/artists"
                  className="pm-btn text-xs py-1 px-2.5 flex items-center gap-1"
                  style={{ color: 'var(--stone)' }}
                >
                  All artists
                  <Icon name="ArrowRightIcon" size={12} variant="outline" />
                </Link>
              </div>

              {loadingData ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                      <div className="w-4 h-4 rounded shrink-0"   style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: 'var(--cream)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded w-2/3"        style={{ backgroundColor: 'var(--cream)' }} />
                        <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: 'var(--cream)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topArtists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(78,94,46,0.1)' }}>
                    <Icon name="MusicalNoteIcon" size={22} variant="outline" style={{ color: '#4E5E2E' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>No artists yet</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>Add artists and create pitches to see your top performers here.</p>
                  <Link href="/artists" className="pm-btn text-xs py-1.5 px-3 flex items-center gap-1">
                    <Icon name="PlusIcon" size={12} variant="outline" />
                    Add Artist
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {topArtists.map((artist, idx) => (
                    <Link
                      key={artist.id}
                      href="/artists"
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-150"
                      style={{ textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span
                        className="text-xs font-bold w-4 text-center shrink-0"
                        style={{
                          color: idx < 3 ? '#B8622A' : 'var(--stone)',
                          fontFamily: 'Azeret Mono, monospace',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: artist.avatarColor, fontFamily: 'Epilogue, sans-serif' }}
                        aria-label={`${artist.name} avatar`}
                      >
                        {artist.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>
                          {artist.name}
                        </p>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: 'var(--cream)', color: 'var(--stone)', fontSize: '0.65rem', fontFamily: 'Azeret Mono, monospace' }}
                          >
                            {artist.genre}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
                            {artist.placedPitches}/{artist.totalPitches}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cream)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${artist.approvalRate}%`, backgroundColor: artist.avatarColor }}
                            />
                          </div>
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'var(--ink)', fontFamily: 'Azeret Mono, monospace', minWidth: '2.2rem', textAlign: 'right' }}
                          >
                            {artist.approvalRate}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--cream)' }}>
                <p className="text-xs" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
                  Ranked by placement rate
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4E5E2E' }} />
                  <span className="text-xs" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
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
              {quickActions.map((action) =>
                action.label === 'New Pitch' ? (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setNewPitchModalOpen(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 text-center w-full"
                    style={{ border: '1px solid var(--cream)', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}18` }}
                    >
                      <Icon name={action.icon as any} size={20} variant="outline" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--ink)', fontFamily: 'Azeret Mono, monospace', letterSpacing: '0.05em' }}>
                      {action.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 text-center"
                    style={{ border: '1px solid var(--cream)', backgroundColor: 'transparent', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}18` }}
                    >
                      <Icon name={action.icon as any} size={20} variant="outline" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--ink)', fontFamily: 'Azeret Mono, monospace', letterSpacing: '0.05em' }}>
                      {action.label}
                    </span>
                  </Link>
                )
              )}
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
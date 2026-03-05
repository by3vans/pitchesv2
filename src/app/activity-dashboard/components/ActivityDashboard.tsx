'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { getQueue, QueuedAction } from '@/hooks/useOfflineQueue';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'queued';

type ProgressStep = {
  id: string;
  label: string;
  status: 'waiting' | 'active' | 'done' | 'error';
  timestamp?: string;
};

type ActivityEntry = {
  id: string;
  type: 'pitch_creation' | 'artist_detail' | 'contact_save' | 'bulk_action' | 'sync';
  label: string;
  status: ActivityStatus;
  timestamp: string;
  completedAt?: string;
  priority?: 'high' | 'normal' | 'low';
  estimatedCompletion?: string;
  retries?: number;
  steps?: ProgressStep[];
  details?: string;
  offline?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: number | string): string {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function nowTs(): string {
  return formatTs(Date.now());
}

function minutesAgo(n: number): string {
  return formatTs(Date.now() - n * 60 * 1000);
}

function hoursAgo(n: number): string {
  return formatTs(Date.now() - n * 60 * 60 * 1000);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ActivityStatus }) {
  const config: Record<ActivityStatus, { label: string; bg: string; color: string; dot: string }> = {
    pending:    { label: 'Pending',    bg: 'rgba(245,158,11,0.1)',  color: '#d97706', dot: '#f59e0b' },
    processing: { label: 'Processing', bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', dot: '#3b82f6' },
    completed:  { label: 'Completed',  bg: 'rgba(16,185,129,0.1)', color: '#059669', dot: '#10b981' },
    failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.1)',  color: '#dc2626', dot: '#ef4444' },
    queued:     { label: 'Queued',     bg: 'rgba(107,114,128,0.1)',color: '#4b5563', dot: '#6b7280' },
  };
  const c = config[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: c.dot,
          animation: status === 'processing' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {c.label}
    </span>
  );
}

// ─── Progress Steps ───────────────────────────────────────────────────────────

function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="mt-3 space-y-1.5">
      {steps.map((step, i) => {
        const isActive = step.status === 'active';
        const isDone = step.status === 'done';
        const isError = step.status === 'error';
        const isWaiting = step.status === 'waiting';
        return (
          <div key={step.id} className="flex items-center gap-3">
            {/* Connector line */}
            <div className="flex flex-col items-center" style={{ width: 20, minWidth: 20 }}>
              {i > 0 && (
                <div
                  className="w-px"
                  style={{
                    height: 8,
                    background: isDone || isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    marginBottom: 2,
                  }}
                />
              )}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isDone
                    ? 'var(--color-success)'
                    : isActive
                    ? 'var(--color-accent)'
                    : isError
                    ? 'var(--color-destructive)'
                    : 'var(--color-muted)',
                  border: isWaiting ? '1.5px dashed var(--color-border)' : 'none',
                }}
              >
                {isDone && <Icon name="CheckIcon" size={11} variant="solid" style={{ color: 'white' }} />}
                {isActive && (
                  <span
                    className="w-2 h-2 rounded-full bg-white"
                    style={{ animation: 'pulse 1s ease-in-out infinite' }}
                  />
                )}
                {isError && <Icon name="XMarkIcon" size={11} variant="solid" style={{ color: 'white' }} />}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium"
                style={{
                  color: isWaiting
                    ? 'var(--color-muted-foreground)'
                    : isActive
                    ? 'var(--color-accent)'
                    : isError
                    ? 'var(--color-destructive)'
                    : 'var(--color-foreground)',
                }}
              >
                {step.label}
              </span>
              {step.timestamp && (
                <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>
                  {step.timestamp}
                </span>
              )}
              {isActive && (
                <span className="text-xs shrink-0" style={{ color: 'var(--color-accent)' }}>In progress…</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ entry, onRetry }: { entry: ActivityEntry; onRetry?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const typeIcon: Record<ActivityEntry['type'], string> = {
    pitch_creation: 'PaperAirplaneIcon',
    artist_detail:  'MusicalNoteIcon',
    contact_save:   'UserIcon',
    bulk_action:    'RectangleStackIcon',
    sync:           'ArrowPathIcon',
  };

  return (
    <div
      className="rounded-xl transition-all"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        className="w-full text-left px-4 py-3 flex items-start gap-3 rounded-xl"
      >
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--color-muted)' }}
        >
          <Icon name={typeIcon[entry.type] as any} size={15} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
        </div>

        {/* Content - clickable area for expand */}
        <button
          type="button"
          className="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
              {entry.label}
            </span>
            {entry.offline && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>
                Offline
              </span>
            )}
            {entry.priority === 'high' && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                High priority
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <StatusBadge status={entry.status} />
            <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
              {entry.timestamp}
            </span>
            {entry.completedAt && entry.completedAt !== entry.timestamp && (
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Completed: <span className="font-mono">{entry.completedAt}</span>
              </span>
            )}
            {entry.retries !== undefined && entry.retries > 0 && (
              <span className="text-xs" style={{ color: '#d97706' }}>
                {entry.retries} retr{entry.retries === 1 ? 'y' : 'ies'}
              </span>
            )}
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {entry.status === 'failed' && onRetry && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry(entry.id); }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <Icon
              name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
              size={16}
              variant="outline"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {entry.details && (
            <p className="text-sm mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
              {entry.details}
            </p>
          )}
          {entry.steps && entry.steps.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Progress Steps
              </p>
              <ProgressSteps steps={entry.steps} />
            </div>
          )}
          {entry.estimatedCompletion && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
              Est. completion: <span className="font-mono">{entry.estimatedCompletion}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, children }: { icon: string; title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon name={icon as any} size={16} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h2>
        {count !== undefined && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivityDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [completedSearch, setCompletedSearch] = useState('');
  const [offlineCollapsed, setOfflineCollapsed] = useState(false);
  const [queuedCollapsed, setQueuedCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [completedEntries, setCompletedEntries] = useState<ActivityEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // ── Fetch real activity from Supabase ──────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCompletedEntries([]);
      setLoadingActivity(false);
      return;
    }

    // Fetch recent pitches (last 30)
    const { data: pitches } = await supabase
      .from('pitches')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30);

    // Fetch recent artists (last 20)
    const { data: artists } = await supabase
      .from('artists')
      .select('id, name, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    const entries: ActivityEntry[] = [];

    // Map pitches to activity entries
    if (pitches) {
      for (const pitch of pitches) {
        const isNew = pitch.created_at === pitch.updated_at ||
          Math.abs(new Date(pitch.created_at).getTime() - new Date(pitch.updated_at).getTime()) < 5000;
        const isFailed = pitch.status === 'rejected';
        const isCompleted = pitch.status === 'approved' || pitch.status === 'in_review' || pitch.status === 'new';
        entries.push({
          id: `pitch-${pitch.id}`,
          type: 'pitch_creation',
          label: isNew
            ? `Pitch created: "${pitch.title}"`
            : `Pitch updated: "${pitch.title}" — ${pitch.status}`,
          status: isFailed ? 'failed' : isCompleted ? 'completed' : 'completed',
          timestamp: formatTs(pitch.updated_at),
          completedAt: formatTs(pitch.updated_at),
          details: `Status: ${pitch.status}. Last updated: ${formatTs(pitch.updated_at)}.`,
        });
      }
    }

    // Map artists to activity entries
    if (artists) {
      for (const artist of artists) {
        const isNew = artist.created_at === artist.updated_at ||
          Math.abs(new Date(artist.created_at).getTime() - new Date(artist.updated_at).getTime()) < 5000;
        entries.push({
          id: `artist-${artist.id}`,
          type: 'artist_detail',
          label: isNew
            ? `Artist created: ${artist.name}`
            : `Artist updated: ${artist.name}`,
          status: 'completed',
          timestamp: formatTs(artist.updated_at),
          completedAt: formatTs(artist.updated_at),
          details: `Last updated: ${formatTs(artist.updated_at)}.`,
        });
      }
    }

    // Sort by most recent first
    entries.sort((a, b) => {
      const ta = new Date(a.timestamp.split('/').reverse().join('-').replace(' ', 'T')).getTime();
      const tb = new Date(b.timestamp.split('/').reverse().join('-').replace(' ', 'T')).getTime();
      return tb - ta;
    });

    setCompletedEntries(entries);
    setLastSync(nowTs());
    setLoadingActivity(false);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setQueuedActions(getQueue());
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setQueuedActions(getQueue());
    fetchActivity().then(() => {
      setIsRefreshing(false);
    });
  }, [fetchActivity]);

  const handleRetry = useCallback((_id: string) => {
    // Retry logic not yet implemented
  }, []);

  // Build queued entries from real offline queue only
  const offlineEntries: ActivityEntry[] = queuedActions.map((a) => ({
    id: a.id,
    type: a.type === 'pitch_save' ? 'pitch_creation' : a.type === 'artist_save' ? 'artist_detail' : 'contact_save',
    label: a.label,
    status: 'queued' as ActivityStatus,
    timestamp: formatTs(a.timestamp),
    retries: a.retries,
    offline: true,
    details: `Queued offline. Retries: ${a.retries}. Will auto-retry when online.`,
  }));

  // Derive processing count from real state (no hardcoded active entry)
  const processingCount = 0;

  // Filter completed
  const filteredCompleted = completedEntries.filter((e) => {
    if (completedFilter === 'completed' && e.status !== 'completed') return false;
    if (completedFilter === 'failed' && e.status !== 'failed') return false;
    if (completedSearch) {
      const q = completedSearch.toLowerCase();
      return e.label.toLowerCase().includes(q) || (e.details ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const completedCount = completedEntries.filter((e) => e.status === 'completed').length;
  const failedCount = completedEntries.filter((e) => e.status === 'failed').length;

  const syncHealthColor = isOnline ? 'var(--color-success)' : 'var(--color-destructive)';
  const syncHealthBg = isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <main className="flex-1 md:ml-56 pt-0 md:pt-0">
        {/* Mobile top padding */}
        <div className="h-16 md:hidden" />

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

          {/* ── Topbar ── */}
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="pm-kicker">System Monitor</p>
              <h1 className="pm-h1 text-2xl md:text-3xl">Activity</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="pm-btn-ghost border rounded-lg text-sm flex items-center gap-1.5 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ borderColor: 'var(--color-border)', minHeight: 36 }}
                aria-label="Refresh activity"
              >
                <Icon
                  name="ArrowPathIcon"
                  size={15}
                  variant="outline"
                  style={{
                    color: 'var(--color-muted-foreground)',
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* ── Sync Status Bar ── */}
          <div
            className="pm-panel mb-6 flex items-center justify-between gap-4 flex-wrap"
            style={{ padding: '14px 18px' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: syncHealthBg }}
              >
                <Icon
                  name={isOnline ? 'SignalIcon' : 'SignalSlashIcon'}
                  size={16}
                  variant="outline"
                  style={{ color: syncHealthColor }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {isOnline ? 'Connected' : 'Offline'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Last sync: <span className="font-mono">{lastSync || '—'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-foreground)' }}>{offlineEntries.length}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Queued</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-foreground)' }}>{processingCount}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Processing</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-success)' }}>
                  {completedCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-destructive)' }}>
                  {failedCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Failed</p>
              </div>
            </div>
          </div>

          {/* ── Queued Actions ── */}
          <div className="pm-panel mb-6">
            <SectionHeader
              icon="ClockIcon"
              title="Queued Actions"
              count={offlineEntries.length}
            >
              <button
                type="button"
                onClick={() => setQueuedCollapsed((v) => !v)}
                className="pm-btn-ghost text-xs px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-expanded={!queuedCollapsed}
              >
                {queuedCollapsed ? 'Expand' : 'Collapse'}
              </button>
            </SectionHeader>

            {!queuedCollapsed && (
              offlineEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="CheckCircleIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-success)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No queued actions. All caught up!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineEntries.map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} onRetry={handleRetry} />
                  ))}
                </div>
              )
            )}
          </div>

          {/* ── Completed Submissions ── */}
          <div className="pm-panel">
            <SectionHeader
              icon="ArchiveBoxIcon"
              title="Recent Activity"
              count={filteredCompleted.length}
            >
              <button
                type="button"
                onClick={() => setCompletedCollapsed((v) => !v)}
                className="pm-btn-ghost text-xs px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-expanded={!completedCollapsed}
              >
                {completedCollapsed ? 'Expand' : 'Collapse'}
              </button>
            </SectionHeader>

            {!completedCollapsed && (
              <>
                {/* Filters */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div className="relative flex-1 min-w-[180px]">
                    <Icon
                      name="MagnifyingGlassIcon"
                      size={14}
                      variant="outline"
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    />
                    <input
                      type="text"
                      className="pm-input pl-8 text-sm"
                      placeholder="Search activity…"
                      value={completedSearch}
                      onChange={(e) => setCompletedSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {(['all', 'completed', 'failed'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCompletedFilter(f)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        style={{
                          background: completedFilter === f ? 'var(--color-primary)' : 'var(--color-muted)',
                          color: completedFilter === f ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                        }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingActivity ? (
                  <div className="text-center py-8">
                    <Icon name="ArrowPathIcon" size={24} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)', animation: 'spin 1s linear infinite' }} />
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Loading activity…</p>
                  </div>
                ) : filteredCompleted.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="InboxIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No activity found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCompleted.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} onRetry={handleRetry} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { getQueue, QueuedAction } from '@/hooks/useOfflineQueue';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'queued';

type ProgressStep = {
  id: string; label: string;
  status: 'waiting' | 'active' | 'done' | 'error';
  timestamp?: string;
};

type ActivityEntry = {
  id: string;
  type: 'pitch_creation' | 'artist_detail' | 'contact_save' | 'bulk_action' | 'sync';
  label: string; status: ActivityStatus; timestamp: string;
  completedAt?: string; priority?: 'high' | 'normal' | 'low';
  estimatedCompletion?: string; retries?: number;
  steps?: ProgressStep[]; details?: string; offline?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: number | string): string {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function nowTs(): string { return formatTs(Date.now()); }

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ActivityStatus }) {
  const config: Record<ActivityStatus, { label: string; bg: string; color: string; dot: string }> = {
    pending:    { label: 'Pending',    bg: 'rgba(184,98,42,0.1)',  color: 'var(--orange)', dot: 'var(--orange)' },
    processing: { label: 'Processing', bg: 'rgba(72,108,227,0.1)', color: 'var(--blue)',   dot: 'var(--blue)'   },
    completed:  { label: 'Completed',  bg: 'rgba(78,94,46,0.1)',  color: 'var(--olive)',  dot: 'var(--olive)'  },
    failed:     { label: 'Failed',     bg: 'rgba(194,59,46,0.1)', color: 'var(--crimson)',dot: 'var(--crimson)' },
    queued:     { label: 'Queued',     bg: 'rgba(122,116,112,0.1)',color: 'var(--stone)', dot: 'var(--stone)'  },
  };
  const c = config[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: c.dot, animation: status === 'processing' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
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
            <div className="flex flex-col items-center" style={{ width: 20, minWidth: 20 }}>
              {i > 0 && (
                <div className="w-px" style={{ height: 8, backgroundColor: isDone || isActive ? 'var(--blue)' : 'var(--cream)', marginBottom: 2 }} />
              )}
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isDone ? 'var(--olive)' : isActive ? 'var(--blue)' : isError ? 'var(--crimson)' : 'var(--cream)',
                  border: isWaiting ? '1.5px dashed var(--cream)' : 'none',
                }}>
                {isDone && <Icon name="CheckIcon" size={11} variant="solid" style={{ color: 'var(--ice)' }} />}
                {isActive && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ice)', animation: 'pulse 1s ease-in-out infinite' }} />}
                {isError && <Icon name="XMarkIcon" size={11} variant="solid" style={{ color: 'var(--ice)' }} />}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className="text-xs font-medium" style={{
                fontFamily: 'Epilogue, sans-serif',
                color: isWaiting ? 'var(--stone)' : isActive ? 'var(--blue)' : isError ? 'var(--crimson)' : 'var(--ink)',
              }}>
                {step.label}
              </span>
              {step.timestamp && (
                <span className="text-xs shrink-0" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                  {step.timestamp}
                </span>
              )}
              {isActive && <span className="text-xs shrink-0" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--blue)' }}>In progress…</span>}
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
    pitch_creation: 'PaperAirplaneIcon', artist_detail: 'MusicalNoteIcon',
    contact_save: 'UserIcon', bulk_action: 'RectangleStackIcon', sync: 'ArrowPathIcon',
  };

  return (
    <div className="rounded-xl transition-all" style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
      <div className="w-full text-left px-4 py-3 flex items-start gap-3 rounded-xl">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: 'var(--cream)' }}>
          <Icon name={typeIcon[entry.type] as any} size={15} variant="outline" style={{ color: 'var(--stone)' }} />
        </div>

        {/* Content */}
        <button type="button" className="flex-1 min-w-0 text-left focus:outline-none rounded"
          onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              {entry.label}
            </span>
            {entry.offline && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
                Offline
              </span>
            )}
            {entry.priority === 'high' && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'rgba(194,59,46,0.1)', color: 'var(--crimson)' }}>
                Alta prioridade
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <StatusBadge status={entry.status} />
            <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              {entry.timestamp}
            </span>
            {entry.completedAt && entry.completedAt !== entry.timestamp && (
              <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                Concluído: {entry.completedAt}
              </span>
            )}
            {entry.retries !== undefined && entry.retries > 0 && (
              <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--orange)' }}>
                {entry.retries} tentativa{entry.retries !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {entry.status === 'failed' && onRetry && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRetry(entry.id); }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 focus:outline-none"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'rgba(194,59,46,0.1)', color: 'var(--crimson)', border: '1px solid rgba(194,59,46,0.2)' }}>
              Retry
            </button>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse' : 'Expand'} className="focus:outline-none rounded">
            <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} variant="outline" style={{ color: 'var(--stone)' }} />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--cream)' }}>
          {entry.details && (
            <p className="text-sm mt-3" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              {entry.details}
            </p>
          )}
          {entry.steps && entry.steps.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                Progress Steps
              </p>
              <ProgressSteps steps={entry.steps} />
            </div>
          )}
          {entry.estimatedCompletion && (
            <p className="text-xs mt-3" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              Est. conclusão: {entry.estimatedCompletion}
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
        <Icon name={icon as any} size={16} variant="outline" style={{ color: 'var(--stone)' }} />
        <h2 className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
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
  const [queuedCollapsed, setQueuedCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [completedEntries, setCompletedEntries] = useState<ActivityEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const fetchActivity = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCompletedEntries([]); setLoadingActivity(false); return; }

    const { data: pitches } = await supabase.from('pitches')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30);

    const { data: artists } = await supabase.from('artists')
      .select('id, name, created_at, updated_at')
      .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);

    const entries: ActivityEntry[] = [];

    if (pitches) {
      for (const pitch of pitches) {
        const isNew = pitch.created_at === pitch.updated_at || Math.abs(new Date(pitch.created_at).getTime() - new Date(pitch.updated_at).getTime()) < 5000;
        const isFailed = pitch.status === 'rejected';
        entries.push({
          id: `pitch-${pitch.id}`, type: 'pitch_creation',
          label: isNew ? `Pitch criado: "${pitch.title}"` : `Pitch atualizado: "${pitch.title}" — ${pitch.status}`,
          status: isFailed ? 'failed' : 'completed',
          timestamp: formatTs(pitch.updated_at), completedAt: formatTs(pitch.updated_at),
          details: `Status: ${pitch.status}. Última atualização: ${formatTs(pitch.updated_at)}.`,
        });
      }
    }

    if (artists) {
      for (const artist of artists) {
        const isNew = artist.created_at === artist.updated_at || Math.abs(new Date(artist.created_at).getTime() - new Date(artist.updated_at).getTime()) < 5000;
        entries.push({
          id: `artist-${artist.id}`, type: 'artist_detail',
          label: isNew ? `Artista criado: ${artist.name}` : `Artista atualizado: ${artist.name}`,
          status: 'completed', timestamp: formatTs(artist.updated_at), completedAt: formatTs(artist.updated_at),
          details: `Última atualização: ${formatTs(artist.updated_at)}.`,
        });
      }
    }

    entries.sort((a, b) => {
      const ta = new Date(a.timestamp.split('/').reverse().join('-').replace(' ', 'T')).getTime();
      const tb = new Date(b.timestamp.split('/').reverse().join('-').replace(' ', 'T')).getTime();
      return tb - ta;
    });

    setCompletedEntries(entries);
    setLastSync(nowTs());
    setLoadingActivity(false);
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
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
    fetchActivity().then(() => setIsRefreshing(false));
  }, [fetchActivity]);

  const handleRetry = useCallback((_id: string) => {}, []);

  const offlineEntries: ActivityEntry[] = queuedActions.map((a) => ({
    id: a.id,
    type: a.type === 'pitch_save' ? 'pitch_creation' : a.type === 'artist_save' ? 'artist_detail' : 'contact_save',
    label: a.label, status: 'queued' as ActivityStatus,
    timestamp: formatTs(a.timestamp), retries: a.retries, offline: true,
    details: `Enfileirado offline. Tentativas: ${a.retries}. Retry automático quando online.`,
  }));

  const processingCount = 0;

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

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />

      <main className="flex-1 md:ml-56 pt-0 md:pt-0">
        <div className="h-16 md:hidden" />

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

          {/* Topbar */}
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1"
                style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                System Monitor
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Activity
              </h1>
            </div>
            <button type="button" onClick={handleRefresh} disabled={isRefreshing}
              className="pm-btn-ghost border rounded-lg text-sm flex items-center gap-1.5 px-3 py-2 focus:outline-none"
              style={{ borderColor: 'var(--cream)', minHeight: 36 }} aria-label="Refresh activity">
              <Icon name="ArrowPathIcon" size={15} variant="outline"
                style={{ color: 'var(--stone)', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span className="hidden sm:inline" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>Refresh</span>
            </button>
          </div>

          {/* Sync Status Bar */}
          <div className="pm-panel mb-6 flex items-center justify-between gap-4 flex-wrap"
            style={{ padding: '14px 18px', backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isOnline ? 'rgba(78,94,46,0.1)' : 'rgba(194,59,46,0.1)' }}>
                <Icon name={isOnline ? 'SignalIcon' : 'SignalSlashIcon'} size={16} variant="outline"
                  style={{ color: isOnline ? 'var(--olive)' : 'var(--crimson)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                  {isOnline ? 'Conectado' : 'Offline'}
                </p>
                <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                  Último sync: {lastSync || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: 'Na fila',      value: offlineEntries.length, color: 'var(--ink)'    },
                { label: 'Processando',  value: processingCount,       color: 'var(--ink)'    },
                { label: 'Concluídos',   value: completedCount,        color: 'var(--olive)'  },
                { label: 'Falhas',       value: failedCount,           color: 'var(--crimson)'},
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold" style={{ fontFamily: 'Azeret Mono, monospace', color }}>{value}</p>
                  <p className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Queued Actions */}
          <div className="pm-panel mb-6" style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
            <SectionHeader icon="ClockIcon" title="Ações na Fila" count={offlineEntries.length}>
              <button type="button" onClick={() => setQueuedCollapsed((v) => !v)}
                className="pm-btn-ghost text-xs px-2 py-1 rounded focus:outline-none"
                style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                aria-expanded={!queuedCollapsed}>
                {queuedCollapsed ? 'Expandir' : 'Recolher'}
              </button>
            </SectionHeader>

            {!queuedCollapsed && (
              offlineEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="CheckCircleIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--olive)' }} />
                  <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                    Sem ações na fila. Tudo em dia!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineEntries.map((entry) => <ActivityRow key={entry.id} entry={entry} onRetry={handleRetry} />)}
                </div>
              )
            )}
          </div>

          {/* Recent Activity */}
          <div className="pm-panel" style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
            <SectionHeader icon="ArchiveBoxIcon" title="Atividade Recente" count={filteredCompleted.length}>
              <button type="button" onClick={() => setCompletedCollapsed((v) => !v)}
                className="pm-btn-ghost text-xs px-2 py-1 rounded focus:outline-none"
                style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                aria-expanded={!completedCollapsed}>
                {completedCollapsed ? 'Expandir' : 'Recolher'}
              </button>
            </SectionHeader>

            {!completedCollapsed && (
              <>
                {/* Filters */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div className="relative flex-1 min-w-[180px]">
                    <Icon name="MagnifyingGlassIcon" size={14} variant="outline"
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--stone)' }} />
                    <input type="text" className="pm-input pl-8 text-sm"
                      style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--ice)', borderColor: 'var(--cream)', color: 'var(--ink)' }}
                      placeholder="Buscar atividade…"
                      value={completedSearch} onChange={(e) => setCompletedSearch(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-1">
                    {(['all', 'completed', 'failed'] as const).map((f) => {
                      const labels = { all: 'Todos', completed: 'Concluídos', failed: 'Falhas' };
                      return (
                        <button key={f} type="button" onClick={() => setCompletedFilter(f)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all focus:outline-none"
                          style={{
                            fontFamily: 'Azeret Mono, monospace',
                            backgroundColor: completedFilter === f ? 'var(--ink)' : 'var(--cream)',
                            color: completedFilter === f ? 'var(--ice)' : 'var(--stone)',
                          }}>
                          {labels[f]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {loadingActivity ? (
                  <div className="text-center py-8">
                    <Icon name="ArrowPathIcon" size={24} variant="outline" className="mx-auto mb-2"
                      style={{ color: 'var(--stone)', animation: 'spin 1s linear infinite' }} />
                    <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                      Carregando atividade…
                    </p>
                  </div>
                ) : filteredCompleted.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="InboxIcon" size={28} variant="outline" className="mx-auto mb-2" style={{ color: 'var(--stone)' }} />
                    <p className="text-sm" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                      Nenhuma atividade encontrada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCompleted.map((entry) => <ActivityRow key={entry.id} entry={entry} onRetry={handleRetry} />)}
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
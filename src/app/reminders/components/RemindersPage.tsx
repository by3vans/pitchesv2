'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Sidebar from '@/components/common/Sidebar';
import { createClient } from '@/lib/supabase/client';

type ReminderStatus = 'pending' | 'snoozed' | 'completed';
type FilterType = 'all' | 'pending' | 'snoozed' | 'completed';

interface Reminder {
  id: string; pitchId: string; pitchTitle: string; pitchStatus: string;
  contactName: string; reminderDate: string; status: ReminderStatus; snoozedUntil: string | null;
}

const PITCH_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'var(--cream)',               color: 'var(--stone)'   },
  new:       { bg: 'var(--cream)',               color: 'var(--stone)'   },
  in_review: { bg: 'rgba(184,98,42,0.1)',        color: 'var(--orange)'  },
  sent:      { bg: 'rgba(72,108,227,0.1)',       color: 'var(--blue)'    },
  approved:  { bg: 'rgba(78,94,46,0.1)',         color: 'var(--olive)'   },
  placed:    { bg: 'rgba(78,94,46,0.1)',         color: 'var(--olive)'   },
  rejected:  { bg: 'rgba(194,59,46,0.1)',        color: 'var(--crimson)' },
  hold:      { bg: 'rgba(184,98,42,0.1)',        color: 'var(--orange)'  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function getDaysLabel(iso: string): { label: string; overdue: boolean } {
  const now = new Date(); const d = new Date(iso);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: `${Math.abs(diff)}d em atraso`, overdue: true };
  if (diff === 0) return { label: 'Hoje',   overdue: false };
  if (diff === 1) return { label: 'Amanhã', overdue: false };
  return { label: `Em ${diff} dias`, overdue: false };
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['var(--blue)', 'var(--olive)', 'var(--orange)', 'var(--crimson)', 'var(--stone)', 'var(--ink)'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function RemindersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);
  const snoozeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) setSnoozeMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setReminders([]); return; }
      const { data, error } = await supabase
        .from('reminders')
        .select('id, pitch_id, contact_name, reminder_date, status, snoozed_until, pitches(title, status)')
        .eq('user_id', user.id).order('reminder_date', { ascending: true });
      if (error) throw error;
      const mapped: Reminder[] = (data ?? []).map((row) => {
        const pitch = Array.isArray(row.pitches) ? row.pitches[0] : row.pitches;
        return {
          id: row.id, pitchId: row.pitch_id,
          pitchTitle: pitch?.title ?? 'Pitch desconhecido',
          pitchStatus: pitch?.status ?? 'draft',
          contactName: row.contact_name ?? '—',
          reminderDate: row.reminder_date,
          status: (row.status as ReminderStatus) ?? 'pending',
          snoozedUntil: row.snoozed_until ?? null,
        };
      });
      setReminders(mapped);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('[RemindersPage]', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const markComplete = async (id: string) => {
    setSnoozeMenuId(null);
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: 'completed' } : r));
    const { error } = await supabase.from('reminders').update({ status: 'completed' }).eq('id', id);
    if (error) { if (process.env.NODE_ENV === 'development') console.error(error.message); fetchReminders(); }
  };

  const snooze = async (id: string, days: number) => {
    setSnoozeMenuId(null);
    const newDate = new Date(); newDate.setDate(newDate.getDate() + days);
    const iso = newDate.toISOString();
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: 'snoozed', reminderDate: iso, snoozedUntil: iso } : r));
    const { error } = await supabase.from('reminders').update({ status: 'snoozed', reminder_date: iso, snoozed_until: iso }).eq('id', id);
    if (error) { if (process.env.NODE_ENV === 'development') console.error(error.message); fetchReminders(); }
  };

  const filtered = reminders.filter((r) => filter === 'all' || r.status === filter);
  const now = new Date();
  const overdue   = filtered.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) < now);
  const upcoming  = filtered.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) >= now);
  const completed = filtered.filter((r) => r.status === 'completed');
  const overdueCount = reminders.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) < now).length;

  // ── ReminderRow ──────────────────────────────────────────────────────────────
  const ReminderRow = ({ reminder }: { reminder: Reminder }) => {
    const isOverdue    = new Date(reminder.reminderDate) < now && reminder.status !== 'completed';
    const daysInfo     = getDaysLabel(reminder.reminderDate);
    const pitchCfg     = PITCH_STATUS_CONFIG[reminder.pitchStatus] ?? PITCH_STATUS_CONFIG.draft;
    const isSnoozeOpen = snoozeMenuId === reminder.id;
    const initials     = getInitials(reminder.contactName);
    const avatarColor  = getAvatarColor(reminder.contactName);

    return (
      <div className="group flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200"
        style={{
          backgroundColor: isOverdue ? 'rgba(194,59,46,0.03)' : 'var(--ice)',
          borderColor: reminder.status === 'completed' ? 'var(--cream)' : isOverdue ? 'rgba(194,59,46,0.2)' : 'var(--cream)',
          opacity: reminder.status === 'completed' ? 0.6 : 1,
        }}>

        {/* Status dot */}
        <div className="shrink-0">
          {reminder.status === 'completed' ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(78,94,46,0.1)' }}>
              <Icon name="CheckIcon" size={14} variant="solid" style={{ color: 'var(--olive)' }} />
            </div>
          ) : isOverdue ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(194,59,46,0.1)' }}>
              <Icon name="ExclamationCircleIcon" size={14} variant="solid" style={{ color: 'var(--crimson)' }} />
            </div>
          ) : reminder.status === 'snoozed' ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(184,98,42,0.1)' }}>
              <Icon name="ClockIcon" size={14} variant="outline" style={{ color: 'var(--orange)' }} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(72,108,227,0.1)' }}>
              <Icon name="ClockIcon" size={14} variant="outline" style={{ color: 'var(--blue)' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <Link href={`/pitches/${reminder.pitchId}`}
              className="text-sm font-semibold truncate hover:underline"
              style={{
                fontFamily: 'Epilogue, sans-serif',
                color: reminder.status === 'completed' ? 'var(--stone)' : 'var(--ink)',
                textDecoration: reminder.status === 'completed' ? 'line-through' : 'none',
              }}>
              {reminder.pitchTitle}
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ fontFamily: 'Azeret Mono, monospace', fontSize: '0.68rem', backgroundColor: pitchCfg.bg, color: pitchCfg.color }}>
              {reminder.pitchStatus}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: avatarColor, fontSize: '0.55rem', fontWeight: 700 }}
                aria-hidden="true">
                {initials}
              </div>
              <span className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                {reminder.contactName}
              </span>
            </div>
            <span style={{ color: 'var(--cream)' }}>·</span>
            <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              {formatDate(reminder.reminderDate)}
            </span>
            <span className="text-xs font-medium"
              style={{
                fontFamily: 'Azeret Mono, monospace',
                color: daysInfo.overdue ? 'var(--crimson)' : reminder.status === 'snoozed' ? 'var(--orange)' : 'var(--blue)',
              }}>
              {reminder.status === 'snoozed' ? `Adiado · ${daysInfo.label}` : daysInfo.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        {reminder.status !== 'completed' && (
          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => markComplete(reminder.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'rgba(78,94,46,0.08)', color: 'var(--olive)', border: '1px solid rgba(78,94,46,0.2)' }}
              aria-label={`Marcar ${reminder.pitchTitle} como concluído`}>
              <Icon name="CheckIcon" size={12} variant="solid" />
              Concluir
            </button>

            <div className="relative" ref={isSnoozeOpen ? snoozeRef : undefined}>
              <button type="button"
                onClick={() => setSnoozeMenuId(isSnoozeOpen ? null : reminder.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none"
                style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'rgba(184,98,42,0.08)', color: 'var(--orange)', border: '1px solid rgba(184,98,42,0.2)' }}
                aria-label={`Adiar ${reminder.pitchTitle}`}
                aria-expanded={isSnoozeOpen} aria-haspopup="true">
                <Icon name="ClockIcon" size={12} variant="outline" />
                Adiar
                <Icon name="ChevronDownIcon" size={10} variant="outline" />
              </button>

              {isSnoozeOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)', minWidth: '140px' }}
                  role="menu">
                  {[{ days: 1, label: '+1 dia' }, { days: 3, label: '+3 dias' }, { days: 7, label: '+7 dias' }].map((opt) => (
                    <button key={opt.days} type="button" onClick={() => snooze(reminder.id, opt.days)}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors focus:outline-none"
                      style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Section ──────────────────────────────────────────────────────────────────
  const Section = ({ title, items, accent }: { title: string; items: Reminder[]; accent: string }) => {
    const [collapsed, setCollapsed] = useState(false);
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <button type="button" onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 mb-3 w-full text-left focus:outline-none">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
          <span className="text-xs font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
            {title}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full ml-1"
            style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
            {items.length}
          </span>
          <Icon name={collapsed ? 'ChevronRightIcon' : 'ChevronDownIcon'} size={14} variant="outline"
            className="ml-auto transition-colors" style={{ color: 'var(--stone)' }} />
        </button>
        {!collapsed && (
          <div className="space-y-2">
            {items.map((r) => <ReminderRow key={r.id} reminder={r} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />
      <main className="flex-1 md:pl-56 pt-16 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="pm-kicker mb-1">Follow-ups</p>
              <h1 className="pm-h1">Lembretes</h1>
              {overdueCount > 0 && (
                <p className="text-sm mt-1" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}>
                  {overdueCount} lembrete{overdueCount !== 1 ? 's' : ''} em atraso
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/pitches/new" className="pm-btn border"
                style={{ borderColor: 'var(--cream)' }}>
                <Icon name="PlusIcon" size={15} variant="outline" />
                Adicionar
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Pendentes',  value: reminders.filter((r) => r.status === 'pending').length,   accent: 'var(--blue)',    bg: 'rgba(72,108,227,0.06)',  border: 'rgba(72,108,227,0.15)'  },
              { label: 'Em atraso',  value: overdueCount,                                              accent: 'var(--crimson)', bg: 'rgba(194,59,46,0.06)',   border: 'rgba(194,59,46,0.15)'  },
              { label: 'Concluídos', value: reminders.filter((r) => r.status === 'completed').length,  accent: 'var(--olive)',   bg: 'rgba(78,94,46,0.06)',    border: 'rgba(78,94,46,0.15)'   },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 rounded-xl text-center"
                style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}` }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Azeret Mono, monospace', color: stat.accent, letterSpacing: '-0.03em' }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Filter toggles */}
          <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
            style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}>
            {(['all', 'pending', 'snoozed', 'completed'] as FilterType[]).map((f) => {
              const labels: Record<FilterType, string> = { all: `Todos (${reminders.length})`, pending: 'Pendentes', snoozed: 'Adiados', completed: 'Concluídos' };
              return (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none"
                  style={{
                    fontFamily: 'Epilogue, sans-serif',
                    backgroundColor: filter === f ? 'var(--ice)' : 'transparent',
                    color: filter === f ? 'var(--ink)' : 'var(--stone)',
                    boxShadow: filter === f ? '0 1px 3px rgba(26,26,24,0.08)' : 'none',
                  }}>
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--cream)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: 'var(--cream)' }}>
                <Icon name="ClockIcon" size={22} variant="outline" style={{ color: 'var(--stone)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Nenhum lembrete encontrado
              </p>
              <p className="text-xs mt-1" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Crie um pitch com lembrete para ver aqui.
              </p>
            </div>
          ) : (
            <>
              <Section title="Em Atraso"  items={overdue}   accent="var(--crimson)" />
              <Section title="Próximos"   items={upcoming}  accent="var(--blue)"    />
              <Section title="Concluídos" items={completed} accent="var(--olive)"   />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
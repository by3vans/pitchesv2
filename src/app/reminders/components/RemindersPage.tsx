'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Sidebar from '@/components/common/Sidebar';
import { createClient } from '@/lib/supabase/client';

type ReminderStatus = 'pending' | 'snoozed' | 'completed';
type FilterType = 'all' | 'pending' | 'snoozed' | 'completed';

interface Reminder {
  id: string;
  pitchId: string;
  pitchTitle: string;
  pitchStatus: string;
  contactName: string;
  reminderDate: string;
  status: ReminderStatus;
  snoozedUntil: string | null;
}

const PITCH_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  draft:     { bg: 'bg-gray-100',    text: 'text-gray-600'   },
  new:       { bg: 'bg-gray-100',    text: 'text-gray-600'   },
  in_review: { bg: 'bg-amber-50',    text: 'text-amber-700'  },
  sent:      { bg: 'bg-blue-50',     text: 'text-blue-600'   },
  approved:  { bg: 'bg-emerald-50',  text: 'text-emerald-700'},
  placed:    { bg: 'bg-emerald-50',  text: 'text-emerald-700'},
  rejected:  { bg: 'bg-red-50',      text: 'text-red-600'    },
  hold:      { bg: 'bg-amber-50',    text: 'text-amber-700'  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDaysLabel(iso: string): { label: string; overdue: boolean } {
  const now  = new Date();
  const d    = new Date(iso);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Today',    overdue: false };
  if (diff === 1) return { label: 'Tomorrow', overdue: false };
  return { label: `In ${diff} days`, overdue: false };
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
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

  // Close snooze menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeMenuId(null);
      }
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
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;

      const mapped: Reminder[] = (data ?? []).map((row) => {
        const pitch = Array.isArray(row.pitches) ? row.pitches[0] : row.pitches;
        return {
          id: row.id,
          pitchId: row.pitch_id,
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
      if (process.env.NODE_ENV === 'development') {
        console.error('[RemindersPage] fetch error:', err instanceof Error ? err.message : err);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const markComplete = async (id: string) => {
    setSnoozeMenuId(null);
    // Optimistic update
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: 'completed' } : r));
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'completed' })
      .eq('id', id);
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[RemindersPage] markComplete error:', error.message);
      fetchReminders(); // revert on error
    }
  };

  const snooze = async (id: string, days: number) => {
    setSnoozeMenuId(null);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    const iso = newDate.toISOString();
    // Optimistic update
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: 'snoozed', reminderDate: iso, snoozedUntil: iso } : r));
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'snoozed', reminder_date: iso, snoozed_until: iso })
      .eq('id', id);
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[RemindersPage] snooze error:', error.message);
      fetchReminders();
    }
  };

  const filtered = reminders.filter((r) => filter === 'all' || r.status === filter);
  const now = new Date();
  const overdue   = filtered.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) < now);
  const upcoming  = filtered.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) >= now);
  const completed = filtered.filter((r) => r.status === 'completed');

  const overdueCount = reminders.filter((r) => r.status !== 'completed' && new Date(r.reminderDate) < now).length;

  // ── ReminderRow ──────────────────────────────────────────────────────────────
  const ReminderRow = ({ reminder }: { reminder: Reminder }) => {
    const isOverdue   = new Date(reminder.reminderDate) < now && reminder.status !== 'completed';
    const daysInfo    = getDaysLabel(reminder.reminderDate);
    const pitchCfg    = PITCH_STATUS_CONFIG[reminder.pitchStatus] ?? PITCH_STATUS_CONFIG.draft;
    const isSnoozeOpen = snoozeMenuId === reminder.id;
    const initials    = getInitials(reminder.contactName);
    const avatarColor = getAvatarColor(reminder.contactName);

    return (
      <div className={`group flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 ${
        reminder.status === 'completed'
          ? 'opacity-60'
          : isOverdue
          ? 'border-red-100 bg-red-50/30 hover:border-red-200'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      }`}>
        {/* Status dot */}
        <div className="shrink-0">
          {reminder.status === 'completed' ? (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Icon name="CheckIcon" size={14} variant="solid" className="text-emerald-600" />
            </div>
          ) : isOverdue ? (
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="ExclamationCircleIcon" size={14} variant="solid" className="text-red-500" />
            </div>
          ) : reminder.status === 'snoozed' ? (
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Icon name="ClockIcon" size={14} variant="outline" className="text-amber-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon name="ClockIcon" size={14} variant="outline" className="text-blue-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <Link
              href={`/pitch-detail-management?id=${reminder.pitchId}`}
              className={`text-sm font-semibold truncate hover:underline ${
                reminder.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}>
              {reminder.pitchTitle}
            </Link>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${pitchCfg.bg} ${pitchCfg.text}`}
              style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.68rem' }}>
              {reminder.pitchStatus}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: avatarColor, fontSize: '0.55rem', fontWeight: 700 }}
                aria-hidden="true">
                {initials}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {reminder.contactName}
              </span>
            </div>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
              {formatDate(reminder.reminderDate)}
            </span>
            <span
              className={`text-xs font-medium ${
                daysInfo.overdue ? 'text-red-500' : reminder.status === 'snoozed' ? 'text-amber-600' : 'text-blue-500'
              }`}
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {reminder.status === 'snoozed' ? `Snoozed · ${daysInfo.label}` : daysInfo.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        {reminder.status !== 'completed' && (
          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => markComplete(reminder.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'IBM Plex Sans, sans-serif' }}
              aria-label={`Mark ${reminder.pitchTitle} as complete`}>
              <Icon name="CheckIcon" size={12} variant="solid" />
              Complete
            </button>

            {/* Snooze dropdown */}
            <div className="relative" ref={isSnoozeOpen ? snoozeRef : undefined}>
              <button
                type="button"
                onClick={() => setSnoozeMenuId(isSnoozeOpen ? null : reminder.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                aria-label={`Snooze ${reminder.pitchTitle}`}
                aria-expanded={isSnoozeOpen}
                aria-haspopup="true">
                <Icon name="ClockIcon" size={12} variant="outline" />
                Snooze
                <Icon name="ChevronDownIcon" size={10} variant="outline" />
              </button>

              {isSnoozeOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', minWidth: '140px' }}
                  role="menu">
                  {[{ days: 1, label: '+1 day' }, { days: 3, label: '+3 days' }, { days: 7, label: '+7 days' }].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => snooze(reminder.id, opt.days)}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-muted focus:outline-none"
                      style={{ color: 'var(--color-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}
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
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 mb-3 w-full text-left focus:outline-none group">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {title}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {items.length}
          </span>
          <Icon name={collapsed ? 'ChevronRightIcon' : 'ChevronDownIcon'} size={14} variant="outline" className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors" />
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
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 md:pl-56 pt-16 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="pm-kicker mb-1">Follow-ups</p>
              <h1 className="pm-h1">Reminders</h1>
              {overdueCount > 0 && (
                <p className="text-sm mt-1" style={{ color: '#ef4444', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {overdueCount} overdue reminder{overdueCount !== 1 ? 's' : ''} need attention
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/pitch-creation-workflow" className="pm-btn border" style={{ borderColor: 'var(--color-border)' }}>
                <Icon name="PlusIcon" size={15} variant="outline" />
                Add Reminder
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Pending',   value: reminders.filter((r) => r.status === 'pending').length,   color: '#3b82f6', bg: 'rgba(59,130,246,0.06)'  },
              { label: 'Overdue',   value: overdueCount,                                              color: '#ef4444', bg: 'rgba(239,68,68,0.06)'   },
              { label: 'Completed', value: reminders.filter((r) => r.status === 'completed').length,  color: '#10b981', bg: 'rgba(16,185,129,0.06)'  },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 rounded-xl text-center" style={{ background: stat.bg, border: `1px solid ${stat.color}22` }}>
                <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Filter toggles */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
            style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
            {(['all', 'pending', 'snoozed', 'completed'] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {f === 'all' ? `All (${reminders.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl border border-gray-100 bg-white animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-muted)' }}>
                <Icon name="ClockIcon" size={22} variant="outline" className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>No reminders found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Create a pitch with a reminder to see it here.</p>
            </div>
          ) : (
            <>
              <Section title="Overdue"   items={overdue}   accent="#ef4444" />
              <Section title="Upcoming"  items={upcoming}  accent="#3b82f6" />
              <Section title="Completed" items={completed} accent="#10b981" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
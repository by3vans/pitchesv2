'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type NotificationType = 'activity' | 'status_change' | 'reconnection';
type NotificationCategory = 'all' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  detail?: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionHref?: string;
  meta?: Record<string, string>;
}

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: string; accent: string; bg: string; border: string; dotColor: string }> = {
  activity: {
    label: 'Activity',
    icon: 'BoltIcon',
    accent: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    dotColor: '#3b82f6',
  },
  status_change: {
    label: 'Status Change',
    icon: 'ArrowPathIcon',
    accent: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    dotColor: '#10b981',
  },
  reconnection: {
    label: 'Connection',
    icon: 'WifiIcon',
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    dotColor: '#f59e0b',
  },
};

function groupByDate(notifications: Notification[]): { date: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const date = n.timestamp.split(' ')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

function formatDateLabel(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(+year, +month - 1, +day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[notification.type];

  return (
    <div
      className={`group relative flex gap-4 px-4 py-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
        notification.isRead ? 'bg-white border-gray-100' : 'bg-white border-gray-200'
      }`}
      style={!notification.isRead ? { borderLeftWidth: 3, borderLeftColor: cfg.accent } : {}}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon name={cfg.icon as Parameters<typeof Icon>[0]['name']} size={16} variant="outline" style={{ color: cfg.accent }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
            {!notification.isRead && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: cfg.bg, color: cfg.accent }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dotColor }} />
                New
              </span>
            )}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            >
              {cfg.label}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-mono shrink-0">{notification.timestamp}</span>
        </div>

        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>

        {notification.type === 'status_change' && notification.meta?.from && notification.meta?.to && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{notification.meta.from}</span>
            <Icon name="ArrowRightIcon" size={10} variant="outline" className="text-gray-400" />
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: notification.meta.to === 'Placed' || notification.meta.to === 'Aprovado' ? '#d1fae5' : notification.meta.to === 'Rejeitado' ? '#fee2e2' : '#dbeafe',
                color: notification.meta.to === 'Placed' || notification.meta.to === 'Aprovado' ? '#059669' : notification.meta.to === 'Rejeitado' ? '#dc2626' : '#2563eb',
              }}
            >
              {notification.meta.to}
            </span>
          </div>
        )}

        {notification.detail && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={12} variant="outline" />
              {expanded ? 'Hide details' : 'Show details'}
            </button>
            {expanded && (
              <div
                className="mt-2 px-3 py-2.5 rounded-lg text-xs text-gray-500 leading-relaxed"
                style={{ background: '#f9fafb', border: '1px solid #f3f4f6', fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                {notification.detail}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {notification.actionLabel && notification.actionHref && (
            <a
              href={notification.actionHref}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px]"
              style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}
            >
              <Icon name="ArrowTopRightOnSquareIcon" size={11} variant="outline" />
              {notification.actionLabel}
            </a>
          )}
          {!notification.isRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all min-h-[32px]"
            >
              <Icon name="CheckIcon" size={11} variant="outline" />
              Mark as read
            </button>
          )}
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all min-h-[32px] opacity-0 group-hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <Icon name="XMarkIcon" size={11} variant="outline" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      const mapped: Notification[] = (data ?? []).map((row) => ({
        id: row.id,
        type: row.type === 'pitch_status' ? 'status_change' : 'activity' as NotificationType,
        title: row.title,
        message: row.body ?? '',
        timestamp: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isRead: row.read,
        actionLabel: row.link ? 'Ver pitch' : undefined,
        actionHref: row.link ?? undefined,
      }));
      setNotifications(mapped);
    } finally {
      setLoadingNotifs(false);
    }
  }, [supabase]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter((n) => n.type === activeCategory);
  }, [notifications, activeCategory]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismiss = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
  };

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const categoryCounts = useMemo(() => ({
    all: notifications.length,
    activity: notifications.filter((n) => n.type === 'activity').length,
    status_change: notifications.filter((n) => n.type === 'status_change').length,
    reconnection: notifications.filter((n) => n.type === 'reconnection').length,
  }), [notifications]);

  const categoryTabs: { key: NotificationCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'BellIcon' },
    { key: 'activity', label: 'Activity', icon: 'BoltIcon' },
    { key: 'status_change', label: 'Status Changes', icon: 'ArrowPathIcon' },
    { key: 'reconnection', label: 'Connection', icon: 'WifiIcon' },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--pm-background)' }}>
      <Sidebar />
      <main className="flex-1 md:ml-56 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="pm-kicker">System</p>
              <h1 className="pm-h1">Notifications</h1>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all min-h-[40px]"
                >
                  <Icon name="CheckCircleIcon" size={15} variant="outline" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-all min-h-[40px]"
                >
                  <Icon name="TrashIcon" size={15} variant="outline" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: notifications.length, icon: 'BellIcon', accent: true, highlight: false },
              { label: 'Unread', value: unreadCount, icon: 'BellAlertIcon', accent: false, highlight: unreadCount > 0 },
              { label: 'Activity', value: categoryCounts.activity, icon: 'BoltIcon', accent: false, highlight: false },
              { label: 'Status Changes', value: categoryCounts.status_change, icon: 'ArrowPathIcon', accent: false, highlight: false },
            ].map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white"
                style={{
                  borderColor: card.accent ? 'var(--pm-foreground)' : card.highlight ? '#fca5a5' : '#e5e7eb',
                  background: card.highlight ? '#fff5f5' : 'white',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: card.accent ? 'var(--color-foreground)' : card.highlight ? '#fee2e2' : '#f3f4f6',
                  }}
                >
                  <Icon
                    name={card.icon as Parameters<typeof Icon>[0]['name']}
                    size={18}
                    variant="outline"
                    className={card.accent ? 'text-white' : card.highlight ? 'text-red-500' : 'text-gray-500'}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{card.label}</p>
                  <p className="text-xl font-bold leading-tight" style={{ fontFamily: 'Inter, sans-serif', color: card.highlight ? '#dc2626' : 'var(--color-foreground)' }}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 border border-gray-200 rounded-xl bg-white p-1 overflow-x-auto">
            {categoryTabs.map((tab) => {
              const count = categoryCounts[tab.key];
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={13} variant="outline" />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loadingNotifs ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-gray-100 bg-white animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Icon name="BellSlashIcon" size={28} variant="outline" className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No notifications</h3>
              <p className="text-sm text-gray-400 max-w-xs">You are all caught up. New activity alerts will appear here.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Icon name="FunnelIcon" size={20} variant="outline" className="text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No notifications in this category</h3>
              <button onClick={() => setActiveCategory('all')} className="text-xs text-blue-500 hover:underline mt-1">View all notifications</button>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ date, items }) => {
                const isCollapsed = collapsedDates.has(date);
                return (
                  <div key={date}>
                    <button
                      onClick={() => toggleDateCollapse(date)}
                      className="flex items-center gap-2 w-full mb-3 group/date"
                    >
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {formatDateLabel(date)}
                      </span>
                      <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-100">{items.length}</span>
                      <span className="flex-1 h-px bg-gray-100" />
                      <Icon
                        name={isCollapsed ? 'ChevronDownIcon' : 'ChevronUpIcon'}
                        size={12}
                        variant="outline"
                        className="text-gray-400 group-hover/date:text-gray-600 transition-colors"
                      />
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-2">
                        {items.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={markRead}
                            onDismiss={dismiss}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
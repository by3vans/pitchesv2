'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type NotificationType = 'activity' | 'status_change' | 'reconnection';
type NotificationCategory = 'all' | NotificationType;

interface Notification {
  id: string; type: NotificationType; title: string; message: string;
  detail?: string; timestamp: string; isRead: boolean;
  actionLabel?: string; actionHref?: string; meta?: Record<string, string>;
}

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: string; accent: string; bg: string; border: string; dotColor: string }> = {
  activity: {
    label: 'Activity', icon: 'BoltIcon',
    accent: 'var(--blue)', bg: 'rgba(72,108,227,0.08)', border: 'rgba(72,108,227,0.2)', dotColor: 'var(--blue)',
  },
  status_change: {
    label: 'Status Change', icon: 'ArrowPathIcon',
    accent: 'var(--olive)', bg: 'rgba(78,94,46,0.08)', border: 'rgba(78,94,46,0.2)', dotColor: 'var(--olive)',
  },
  reconnection: {
    label: 'Connection', icon: 'WifiIcon',
    accent: 'var(--orange)', bg: 'rgba(184,98,42,0.08)', border: 'rgba(184,98,42,0.2)', dotColor: 'var(--orange)',
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
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function NotificationItem({
  notification, onMarkRead, onDismiss,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[notification.type];

  return (
    <div
      className="group relative flex gap-4 px-4 py-4 rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: 'var(--ice)',
        borderColor: notification.isRead ? 'var(--cream)' : cfg.border,
        borderLeftWidth: !notification.isRead ? 3 : 1,
        borderLeftColor: !notification.isRead ? cfg.accent : 'var(--cream)',
      }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <Icon name={cfg.icon as Parameters<typeof Icon>[0]['name']} size={16} variant="outline" style={{ color: cfg.accent }} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: cfg.bg, color: cfg.accent }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
                Novo
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
              style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
              {cfg.label}
            </span>
          </div>
          <span className="text-xs shrink-0" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
            {notification.timestamp}
          </span>
        </div>

        {/* Message */}
        <p className="text-sm mt-1 leading-relaxed" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
          {notification.message}
        </p>

        {/* Status change meta */}
        {notification.type === 'status_change' && notification.meta?.from && notification.meta?.to && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
              {notification.meta.from}
            </span>
            <Icon name="ArrowRightIcon" size={10} variant="outline" style={{ color: 'var(--stone)' }} />
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                fontFamily: 'Azeret Mono, monospace',
                backgroundColor: notification.meta.to === 'Placed' || notification.meta.to === 'Aprovado'
                  ? 'rgba(78,94,46,0.1)' : notification.meta.to === 'Rejeitado'
                  ? 'rgba(194,59,46,0.1)' : 'rgba(72,108,227,0.1)',
                color: notification.meta.to === 'Placed' || notification.meta.to === 'Aprovado'
                  ? 'var(--olive)' : notification.meta.to === 'Rejeitado'
                  ? 'var(--crimson)' : 'var(--blue)',
              }}>
              {notification.meta.to}
            </span>
          </div>
        )}

        {/* Detail expand */}
        {notification.detail && (
          <div className="mt-2">
            <button onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={12} variant="outline" />
              {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
            {expanded && (
              <div className="mt-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
                style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: 'var(--cream)', border: '1px solid var(--cream)', color: 'var(--stone)' }}>
                {notification.detail}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {notification.actionLabel && notification.actionHref && (
            <a href={notification.actionHref}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px]"
              style={{ fontFamily: 'Epilogue, sans-serif', backgroundColor: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
              <Icon name="ArrowTopRightOnSquareIcon" size={11} variant="outline" />
              {notification.actionLabel}
            </a>
          )}
          {!notification.isRead && (
            <button onClick={() => onMarkRead(notification.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px]"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', backgroundColor: 'transparent' }}>
              <Icon name="CheckIcon" size={11} variant="outline" />
              Marcar como lido
            </button>
          )}
          <button onClick={() => onDismiss(notification.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all min-h-[32px] opacity-0 group-hover:opacity-100"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}
            aria-label="Dismiss notification">
            <Icon name="XMarkIcon" size={11} variant="outline" />
            Dispensar
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
        .from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50);
      const mapped: Notification[] = (data ?? []).map((row) => ({
        id: row.id,
        type: row.type === 'pitch_status' ? 'status_change' : 'activity' as NotificationType,
        title: row.title, message: row.body ?? '',
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
    { key: 'all',           label: 'Todos',           icon: 'BellIcon'       },
    { key: 'activity',      label: 'Atividade',       icon: 'BoltIcon'       },
    { key: 'status_change', label: 'Mudanças',        icon: 'ArrowPathIcon'  },
    { key: 'reconnection',  label: 'Conexão',         icon: 'WifiIcon'       },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />
      <main className="flex-1 md:ml-56 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="pm-kicker">Sistema</p>
              <h1 className="pm-h1">Notificações</h1>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px]"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', border: '1px solid var(--cream)', backgroundColor: 'transparent' }}>
                  <Icon name="CheckCircleIcon" size={15} variant="outline" />
                  Marcar tudo como lido
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px]"
                  style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)', border: '1px solid rgba(194,59,46,0.2)', backgroundColor: 'rgba(194,59,46,0.04)' }}>
                  <Icon name="TrashIcon" size={15} variant="outline" />
                  Limpar tudo
                </button>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',    value: notifications.length,       icon: 'BellIcon',      accent: true,  highlight: false             },
              { label: 'Não lidas', value: unreadCount,               icon: 'BellAlertIcon', accent: false, highlight: unreadCount > 0   },
              { label: 'Atividade', value: categoryCounts.activity,   icon: 'BoltIcon',      accent: false, highlight: false             },
              { label: 'Mudanças', value: categoryCounts.status_change,icon: 'ArrowPathIcon', accent: false, highlight: false            },
            ].map((card) => (
              <div key={card.label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
                style={{
                  backgroundColor: card.highlight ? 'rgba(194,59,46,0.04)' : 'var(--ice)',
                  borderColor: card.accent ? 'var(--ink)' : card.highlight ? 'rgba(194,59,46,0.2)' : 'var(--cream)',
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: card.accent ? 'var(--ink)' : card.highlight ? 'rgba(194,59,46,0.1)' : 'var(--cream)',
                  }}>
                  <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={18} variant="outline"
                    style={{ color: card.accent ? 'var(--ice)' : card.highlight ? 'var(--crimson)' : 'var(--stone)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider"
                    style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                    {card.label}
                  </p>
                  <p className="text-xl font-bold leading-tight"
                    style={{ fontFamily: 'Azeret Mono, monospace', color: card.highlight ? 'var(--crimson)' : 'var(--ink)' }}>
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 rounded-xl p-1 overflow-x-auto"
            style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
            {categoryTabs.map((tab) => {
              const count = categoryCounts[tab.key];
              const isActive = activeCategory === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveCategory(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap"
                  style={{
                    fontFamily: 'Epilogue, sans-serif',
                    backgroundColor: isActive ? 'var(--ink)' : 'transparent',
                    color: isActive ? 'var(--ice)' : 'var(--stone)',
                  }}>
                  <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={13} variant="outline" />
                  {tab.label}
                  <span className="px-1.5 py-0.5 rounded-full text-xs leading-none"
                    style={{
                      fontFamily: 'Azeret Mono, monospace',
                      backgroundColor: isActive ? 'rgba(248,245,240,0.2)' : 'var(--cream)',
                      color: isActive ? 'var(--ice)' : 'var(--stone)',
                    }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loadingNotifs ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--cream)' }} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--cream)' }}>
                <Icon name="BellSlashIcon" size={28} variant="outline" style={{ color: 'var(--stone)' }} />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Nenhuma notificação
              </h3>
              <p className="text-sm max-w-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                Tudo em dia. Novos alertas aparecerão aqui.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: 'var(--cream)' }}>
                <Icon name="FunnelIcon" size={20} variant="outline" style={{ color: 'var(--stone)' }} />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                Nenhuma notificação nessa categoria
              </h3>
              <button onClick={() => setActiveCategory('all')}
                className="text-xs mt-1 hover:underline"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--blue)' }}>
                Ver todas
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ date, items }) => {
                const isCollapsed = collapsedDates.has(date);
                return (
                  <div key={date}>
                    <button onClick={() => toggleDateCollapse(date)}
                      className="flex items-center gap-2 w-full mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider"
                        style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                        {formatDateLabel(date)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', color: 'var(--stone)' }}>
                        {items.length}
                      </span>
                      <span className="flex-1 h-px" style={{ backgroundColor: 'var(--cream)' }} />
                      <Icon name={isCollapsed ? 'ChevronDownIcon' : 'ChevronUpIcon'} size={12} variant="outline"
                        style={{ color: 'var(--stone)' }} />
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-2">
                        {items.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification}
                            onMarkRead={markRead} onDismiss={dismiss} />
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
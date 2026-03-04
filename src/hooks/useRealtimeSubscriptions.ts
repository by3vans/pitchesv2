'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export interface RealtimeEvent {
  type: 'pitch_status_change' | 'new_artist' | 'new_pitch';
  message: string;
  toastType: 'success' | 'info';
}

interface UseRealtimeSubscriptionsOptions {
  onEvent: (event: RealtimeEvent) => void;
  onRefresh: () => void;
  enabled?: boolean;
}

export function useRealtimeSubscriptions({
  onEvent,
  onRefresh,
  enabled = true,
}: UseRealtimeSubscriptionsOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  const onRefreshRef = useRef(onRefresh);

  // Keep refs up to date without re-subscribing
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const channel = supabase
      .channel('realtime-pitches-artists')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pitches' },
        (payload) => {
          const oldStatus = (payload.old as Record<string, string>)?.status;
          const newStatus = (payload.new as Record<string, string>)?.status;
          const artistName = (payload.new as Record<string, string>)?.artist_name ||
            (payload.new as Record<string, string>)?.title ||
            'Unknown';

          if (oldStatus && newStatus && oldStatus !== newStatus) {
            const statusLabels: Record<string, string> = {
              draft: 'Draft',
              sent: 'Sent',
              hold: 'On Hold',
              placed: 'Placed',
              rejected: 'Rejected',
            };
            const from = statusLabels[oldStatus] ?? oldStatus;
            const to = statusLabels[newStatus] ?? newStatus;
            onEventRef.current({
              type: 'pitch_status_change',
              message: `${artistName} — ${from} → ${to}`,
              toastType: newStatus === 'placed' ? 'success' : 'info',
            });
            onRefreshRef.current();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pitches' },
        (payload) => {
          const title = (payload.new as Record<string, string>)?.title ?? 'New pitch';
          onEventRef.current({
            type: 'new_pitch',
            message: `New pitch added: "${title}"`,
            toastType: 'info',
          });
          onRefreshRef.current();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'artists' },
        (payload) => {
          const name = (payload.new as Record<string, string>)?.name ?? 'New artist';
          onEventRef.current({
            type: 'new_artist',
            message: `New artist added: ${name}`,
            toastType: 'success',
          });
          onRefreshRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        } else {
          setStatus('connecting');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setStatus('disconnected');
    };
  }, [enabled]);

  return { status };
}

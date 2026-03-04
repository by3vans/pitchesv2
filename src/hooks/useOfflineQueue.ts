'use client';

import { useEffect, useCallback, useRef } from 'react';

export type QueuedAction = {
  id: string;
  type: 'pitch_save' | 'artist_save' | 'contact_save';
  label: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
};

const QUEUE_KEY = 'pm_offline_queue';

export function getQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function enqueueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: Math.random().toString(36).slice(2, 9),
    timestamp: Date.now(),
    retries: 0,
  };
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, newAction]));
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((a) => a.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

interface UseOfflineQueueOptions {
  onRetry?: (action: QueuedAction) => Promise<boolean>;
  onConnectionRestored?: (pendingCount: number) => void;
}

export function useOfflineQueue({ onRetry, onConnectionRestored }: UseOfflineQueueOptions = {}) {
  const onRetryRef = useRef(onRetry);
  const onConnectionRestoredRef = useRef(onConnectionRestored);
  onRetryRef.current = onRetry;
  onConnectionRestoredRef.current = onConnectionRestored;

  const processQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    onConnectionRestoredRef.current?.(queue.length);

    for (const action of queue) {
      if (onRetryRef.current) {
        try {
          const success = await onRetryRef.current(action);
          if (success) {
            removeFromQueue(action.id);
          }
        } catch {
          // keep in queue for next retry
        }
      } else {
        // No retry handler — just clear the queue notification
        removeFromQueue(action.id);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  return { enqueueAction, getQueue, removeFromQueue, clearQueue };
}

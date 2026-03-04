'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { getQueue } from '@/hooks/useOfflineQueue';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setQueueCount(getQueue()?.length);

    const handleOnline = () => {
      setIsOnline(true);
      setJustRestored(true);
      setTimeout(() => setJustRestored(false), 3000);
      // Refresh queue count after a short delay (queue may be processing)
      setTimeout(() => setQueueCount(getQueue()?.length), 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustRestored(false);
    };

    // Poll queue count every 2s to keep badge updated
    const pollInterval = setInterval(() => {
      setQueueCount(getQueue()?.length);
    }, 2000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pollInterval);
    };
  }, []);

  // Don't show badge when online with no queued items
  if (isOnline && queueCount === 0 && !justRestored) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={isOnline ? (justRestored ? 'Connection restored' : `${queueCount} actions queued`) : 'You are offline'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{
          minHeight: '32px',
          background: isOnline
            ? justRestored
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(245,158,11,0.12)' :'rgba(239,68,68,0.12)',
          border: `1px solid ${
            isOnline
              ? justRestored
                ? 'rgba(16,185,129,0.35)'
                : 'rgba(245,158,11,0.35)' :'rgba(239,68,68,0.35)'
          }`,
          color: isOnline
            ? justRestored
              ? 'var(--color-success, #10b981)'
              : '#d97706' :'var(--color-destructive, #ef4444)',
        }}
      >
        {/* Status dot */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: isOnline
              ? justRestored
                ? 'var(--color-success, #10b981)'
                : '#d97706' :'var(--color-destructive, #ef4444)',
            animation: !isOnline ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
          aria-hidden="true"
        />

        {/* Label */}
        <span className="hidden sm:inline">
          {isOnline
            ? justRestored
              ? 'Back online'
              : `${queueCount} queued`
            : 'Offline'}
        </span>

        {/* Queue count badge */}
        {!isOnline && queueCount > 0 && (
          <span
            className="flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
            style={{ background: 'var(--color-destructive, #ef4444)', color: 'white', fontSize: '0.6rem' }}
          >
            {queueCount}
          </span>
        )}

        {isOnline && justRestored && (
          <Icon name="CheckCircleIcon" size={13} variant="solid" aria-hidden="true" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl px-3 py-2.5 text-xs shadow-lg"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-foreground)',
            fontFamily: 'Inter, sans-serif',
          }}
          role="tooltip"
        >
          {!isOnline ? (
            <>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-destructive)' }}>You are offline</p>
              <p style={{ color: 'var(--color-muted-foreground)' }}>
                {queueCount > 0
                  ? `${queueCount} action${queueCount !== 1 ? 's' : ''} will retry when connection restores.`
                  : 'Actions will be queued until you reconnect.'}
              </p>
            </>
          ) : justRestored ? (
            <>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-success, #10b981)' }}>Connection restored</p>
              <p style={{ color: 'var(--color-muted-foreground)' }}>Retrying queued actions…</p>
            </>
          ) : (
            <>
              <p className="font-semibold mb-1" style={{ color: '#d97706' }}>{queueCount} action{queueCount !== 1 ? 's' : ''} queued</p>
              <p style={{ color: 'var(--color-muted-foreground)' }}>Will retry when connection restores.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

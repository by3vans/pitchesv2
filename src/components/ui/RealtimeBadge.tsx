'use client';

import { RealtimeStatus } from '@/hooks/useRealtimeSubscriptions';

interface RealtimeBadgeProps {
  status: RealtimeStatus;
}

export default function RealtimeBadge({ status }: RealtimeBadgeProps) {
  if (status === 'disconnected') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.30)',
          color: '#ef4444',
          minHeight: '32px',
        }}
        title="Real-time disconnected"
        aria-label="Real-time disconnected"
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#ef4444' }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(245,158,11,0.10)',
          border: '1px solid rgba(245,158,11,0.30)',
          color: '#d97706',
          minHeight: '32px',
        }}
        title="Connecting to real-time"
        aria-label="Connecting to real-time"
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#d97706', animation: 'pulse 1.5s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Connecting</span>
      </div>
    );
  }

  // connected
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(16,185,129,0.10)',
        border: '1px solid rgba(16,185,129,0.30)',
        color: '#10b981',
        minHeight: '32px',
      }}
      title="Real-time connected"
      aria-label="Real-time connected"
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: '#10b981',
          animation: 'pulse 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">Live</span>
    </div>
  );
}

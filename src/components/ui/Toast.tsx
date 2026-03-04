'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const ICON_MAP: Record<ToastType, string> = {
  success: 'CheckCircleIcon',
  error: 'XCircleIcon',
  info: 'InformationCircleIcon',
};

const STYLE_MAP: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'var(--color-card)',
    border: 'rgba(16,185,129,0.35)',
    icon: 'var(--color-success)',
  },
  error: {
    bg: 'var(--color-card)',
    border: 'rgba(239,68,68,0.35)',
    icon: 'var(--color-destructive)',
  },
  info: {
    bg: 'var(--color-card)',
    border: 'rgba(59,130,246,0.35)',
    icon: 'var(--color-accent)',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3.5s
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const styles = STYLE_MAP[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }}
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '260px',
        maxWidth: '360px',
        cursor: 'pointer',
        transition: 'opacity 280ms ease, transform 280ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: 'auto',
      }}
    >
      <Icon
        name={ICON_MAP[toast.type]}
        size={18}
        variant="solid"
        style={{ color: styles.icon, flexShrink: 0 }}
      />
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--color-foreground)',
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {toast.message}
      </p>
      <Icon
        name="XMarkIcon"
        size={14}
        variant="outline"
        style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

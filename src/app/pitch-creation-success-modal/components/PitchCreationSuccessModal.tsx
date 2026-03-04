'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Sidebar from '@/components/common/Sidebar';

type PitchStatus = 'Draft' | 'Ready' | 'Sent';

interface SuccessData {
  pitchTitle: string;
  status: PitchStatus;
  recipientCount: number;
  recipients: string[];
  reminderDate: string | null;
  reminderDays: number | null;
  confirmedAt: string;
}

const STATUS_CONFIG: Record<PitchStatus, { label: string; bg: string; text: string; dot: string }> = {
  Draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  Ready: { label: 'Ready', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  Sent: { label: 'Sent', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const DEMO_DATA: SuccessData = {
  pitchTitle: 'Summer Single 2026 — Mariana Luz',
  status: 'Sent',
  recipientCount: 3,
  recipients: ['Carlos Mendes (Sony Music)', 'Ana Ferreira (Universal Music)', 'Roberto Lima (Warner Music)'],
  reminderDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  })(),
  reminderDays: 14,
  confirmedAt: new Date().toISOString(),
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatReminderDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PitchCreationSuccessModal() {
  const [data] = useState<SuccessData>(DEMO_DATA);
  const [showRecipients, setShowRecipients] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const statusCfg = STATUS_CONFIG[data.status];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 md:pl-56">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[150] flex items-center justify-center px-4 transition-all duration-300 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          {/* Modal */}
          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl transition-all duration-300 ${
              visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
            }`}
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Success header */}
            <div
              className="flex flex-col items-center pt-8 pb-6 px-8 text-center"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              {/* Animated checkmark */}
              <div className="relative mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-success)', opacity: 0.12, position: 'absolute', inset: 0 }}
                />
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.18)' }}
                  >
                    <Icon name="CheckCircleIcon" size={28} variant="solid" className="text-emerald-500" />
                  </div>
                </div>
              </div>
              <p className="pm-kicker mb-1">Pitch Created</p>
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Pitch Created Successfully
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Your pitch has been saved and recipients have been notified.
              </p>
            </div>

            {/* Details */}
            <div className="px-8 py-6 space-y-4">
              {/* Pitch title */}
              <div
                className="px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
              >
                <p className="pm-kicker mb-1">Pitch Title</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                  {data.pitchTitle}
                </p>
              </div>

              {/* Status + Recipients row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                >
                  <p className="pm-kicker mb-2">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                    style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Recipients */}
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                >
                  <p className="pm-kicker mb-1">Recipients</p>
                  <button
                    type="button"
                    onClick={() => setShowRecipients((v) => !v)}
                    className="flex items-center gap-1.5 text-sm font-semibold transition-colors focus:outline-none"
                    style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
                  >
                    <Icon name="UsersIcon" size={14} variant="outline" />
                    {data.recipientCount} contact{data.recipientCount !== 1 ? 's' : ''}
                    <Icon
                      name={showRecipients ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                      size={12}
                      variant="outline"
                      className="text-gray-400"
                    />
                  </button>
                  {showRecipients && (
                    <ul className="mt-2 space-y-0.5">
                      {data.recipients.map((r, i) => (
                        <li key={i} className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          · {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Reminder */}
              {data.reminderDate && (
                <div
                  className="px-4 py-3 rounded-xl flex items-start gap-3"
                  style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <Icon name="ClockIcon" size={16} variant="outline" className="text-blue-500" />
                  </div>
                  <div>
                    <p className="pm-kicker mb-0.5" style={{ color: 'rgba(59,130,246,0.8)' }}>Follow-up Reminder</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                      {formatReminderDate(data.reminderDate)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                      Scheduled {data.reminderDays} days after creation
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmation timestamp */}
              <div className="flex items-center gap-2 pt-1">
                <Icon name="CheckBadgeIcon" size={13} variant="outline" className="text-gray-400 shrink-0" />
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Confirmed at {formatTimestamp(data.confirmedAt)} UTC
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-8 pb-8"
            >
              <Link
                href="/pitches-listing-dashboard"
                className="pm-btn-primary flex-1 justify-center"
              >
                <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
                Continue
              </Link>
              <Link
                href="/pitch-detail-management"
                className="pm-btn flex-1 justify-center border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={15} variant="outline" />
                View Pitch
              </Link>
              <Link
                href="/reminders"
                className="pm-btn flex-1 justify-center border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Icon name="ClockIcon" size={15} variant="outline" />
                Set Reminders
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

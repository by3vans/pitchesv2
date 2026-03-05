'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Sidebar from '@/components/common/Sidebar';
import { pitchStore, pitchRecipientStore, contactStore } from '@/lib/store';
import type { Pitch, Contact } from '@/lib/types';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400'    },
  sent:      { label: 'Sent',      bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  hold:      { label: 'Hold',      bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  placed:    { label: 'Placed',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  new:       { label: 'New',       bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  in_review: { label: 'In Review', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved:  { label: 'Approved',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

// Inner component — uses useSearchParams, must be inside Suspense
function SuccessModalContent() {
  const searchParams = useSearchParams();
  const pitchId = searchParams.get('pitchId');

  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [showRecipients, setShowRecipients] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pitchId) {
      setError('No pitch ID provided.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [pitchData, pitchRecipients, allContacts] = await Promise.all([
          pitchStore.getById(pitchId!),
          pitchRecipientStore.getByPitch(pitchId!),
          contactStore.getAll(),
        ]);

        if (!pitchData) {
          setError('Pitch not found.');
          setLoading(false);
          return;
        }

        const recipientContacts = pitchRecipients
          .map((pr) => allContacts.find((c) => c.id === pr.contactId))
          .filter(Boolean) as Contact[];

        setPitch(pitchData);
        setRecipients(recipientContacts);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load pitch data.');
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    }

    load();
  }, [pitchId]);

  if (loading) {
    return (
      <div className="flex-1 md:pl-56 flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (error || !pitch) {
    return (
      <main className="flex-1 md:pl-56 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-sm text-red-500 mb-4">{error || 'Pitch not found.'}</p>
          <Link href="/pitches" className="pm-btn-primary">Ver Pitches</Link>
        </div>
      </main>
    );
  }

  const statusCfg = STATUS_CONFIG[pitch.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;

  return (
    <main className="flex-1 md:pl-56">
      <div
        className={`fixed inset-0 z-[150] flex items-center justify-center px-4 transition-all duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      >
        <div
          className={`relative w-full max-w-lg rounded-2xl shadow-2xl transition-all duration-300 ${
            visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
          style={{ background: 'var(--pm-card)', border: '1px solid var(--pm-border)' }}
        >
          {/* Success header */}
          <div className="flex flex-col items-center pt-8 pb-6 px-8 text-center" style={{ borderBottom: '1px solid var(--pm-border)' }}>
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.18)' }}>
                  <Icon name="CheckCircleIcon" size={28} variant="solid" className="text-emerald-500" />
                </div>
              </div>
            </div>
            <p className="pm-kicker mb-1">Pitch Created</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--pm-foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
              Pitch Created Successfully
            </h2>
            <p className="text-sm" style={{ color: 'var(--pm-muted-foreground)' }}>
              Your pitch has been saved and recipients have been notified.
            </p>
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-4">
            <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--pm-muted)', border: '1px solid var(--pm-border)' }}>
              <p className="pm-kicker mb-1">Pitch Title</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--pm-foreground)', fontFamily: 'Inter, sans-serif' }}>
                {pitch.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--pm-muted)', border: '1px solid var(--pm-border)' }}>
                <p className="pm-kicker mb-2">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>

              <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--pm-muted)', border: '1px solid var(--pm-border)' }}>
                <p className="pm-kicker mb-1">Recipients</p>
                <button
                  type="button"
                  onClick={() => setShowRecipients((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors focus:outline-none"
                  style={{ color: 'var(--pm-foreground)', fontFamily: 'Inter, sans-serif' }}
                >
                  <Icon name="UsersIcon" size={14} variant="outline" />
                  {recipients.length} contact{recipients.length !== 1 ? 's' : ''}
                  <Icon name={showRecipients ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={12} variant="outline" className="text-gray-400" />
                </button>
                {showRecipients && (
                  <ul className="mt-2 space-y-0.5">
                    {recipients.map((r) => (
                      <li key={r.id} className="text-xs" style={{ color: 'var(--pm-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        · {r.fullName}{r.company ? ` (${r.company})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Icon name="CheckBadgeIcon" size={13} variant="outline" className="text-gray-400 shrink-0" />
              <p className="text-xs" style={{ color: 'var(--pm-muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                Confirmed at {formatTimestamp(pitch.createdAt)} UTC
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-8 pb-8">
            <Link href="/pitches" className="pm-btn-primary flex-1 justify-center">
              <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
              Continue
            </Link>
            <Link href={`/pitch-detail-management?pitchId=${pitch.id}`} className="pm-btn flex-1 justify-center border" style={{ borderColor: 'var(--pm-border)' }}>
              <Icon name="ArrowTopRightOnSquareIcon" size={15} variant="outline" />
              View Pitch
            </Link>
            <Link href="/reminders" className="pm-btn flex-1 justify-center border" style={{ borderColor: 'var(--pm-border)' }}>
              <Icon name="ClockIcon" size={15} variant="outline" />
              Set Reminders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// Outer component — wraps inner in Suspense so useSearchParams works
export default function PitchCreationSuccessModal() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--pm-background)' }}>
      <Sidebar />
      <Suspense fallback={
        <div className="flex-1 md:pl-56 flex items-center justify-center">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      }>
        <SuccessModalContent />
      </Suspense>
    </div>
  );
}
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import FormSectionHeader from '@/app/pitch-creation-workflow/components/FormSectionHeader';
import ExternalLinksSection from '@/app/pitch-creation-workflow/components/ExternalLinksSection';
import AutoSaveIndicator from '@/app/pitch-creation-workflow/components/AutoSaveIndicator';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useSubmissionProgress } from '@/hooks/useSubmissionProgress';
import { templateStore, PitchTemplate } from '@/lib/templateStore';
import Image from 'next/image';

import {
  artistStore,
  contactStore,
  linkStore,
  pitchStore,
  pitchRecipientStore,
  initStore,
} from '@/lib/store';
import type { Artist, Contact, ArtistRecipientLink } from '@/lib/types';
import { PITCH_STATUSES } from '@/lib/types';

interface LinkEntry {
  id: string;
  label: string;
  url: string;
  error?: string;
}

interface ExternalRecipient {
  id: string;
  fullName: string;
  email: string;
  role: string;
  company: string;
}

interface FormData {
  artistId: string;
  pitchTitle: string;
  trackUrl: string;
  status: 'draft' | 'sent' | 'hold' | 'placed';
  notes: string;
  links: LinkEntry[];
}

interface FormErrors {
  [key: string]: string;
}

const initialForm: FormData = {
  artistId: '',
  pitchTitle: '',
  trackUrl: '',
  status: 'draft',
  notes: '',
  links: [],
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface NewPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArtistId?: string;
  initialContactId?: string;
  editPitch?: import('@/lib/types').Pitch;
}

// ─── Success View ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<'draft' | 'ready' | 'sent', { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  ready: { label: 'Ready', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  sent:  { label: 'Sent',  bg: 'bg-blue-50',  text: 'text-blue-600',  dot: 'bg-blue-500' },
};

function formatConfirmedAt(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hrs   = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hrs}:${mins}`;
}

function formatReminderDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface SuccessViewProps {
  pitchTitle: string;
  status: 'draft' | 'ready' | 'sent';
  recipientCount: number;
  reminderDate: string | null;
  confirmedAt: string;
  onClose: () => void;
  onNewPitch: () => void;
}

function SuccessView({ pitchTitle, status, recipientCount, reminderDate, confirmedAt, onClose, onNewPitch }: SuccessViewProps) {
  const cfg = STATUS_LABELS[status] || STATUS_LABELS.draft;
  return (
    <div className="flex flex-col items-center py-8 px-4 text-center">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(16,185,129,0.12)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.18)' }}
        >
          <Icon name="CheckCircleIcon" size={28} variant="solid" className="text-emerald-500" />
        </div>
      </div>

      <p className="pm-kicker mb-1">Pitch Created</p>
      <h3
        className="font-bold text-lg mb-1"
        style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
      >
        Pitch Created Successfully
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        Your pitch has been saved and recipients have been registered.
      </p>

      {/* Details card */}
      <div
        className="w-full text-left rounded-xl overflow-hidden mb-5"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Pitch title */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-muted)' }}>
          <p className="pm-kicker mb-0.5">Pitch Title</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
            {pitchTitle}
          </p>
        </div>

        {/* Status + Recipients */}
        <div className="grid grid-cols-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="px-4 py-3" style={{ borderRight: '1px solid var(--color-border)' }}>
            <p className="pm-kicker mb-1.5">Status</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="pm-kicker mb-1">Recipients</p>
            <div className="flex items-center gap-1.5">
              <Icon name="UsersIcon" size={13} variant="outline" className="text-gray-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                {recipientCount} contact{recipientCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Reminder */}
        {reminderDate ? (
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(59,130,246,0.04)', borderBottom: '1px solid var(--color-border)' }}
          >
            <Icon name="ClockIcon" size={14} variant="outline" className="text-blue-500 shrink-0" />
            <div>
              <p className="pm-kicker mb-0" style={{ color: 'rgba(59,130,246,0.8)' }}>Follow-up Reminder</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                {formatReminderDate(reminderDate)}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}
          >
            <Icon name="ClockIcon" size={13} variant="outline" className="text-gray-300 shrink-0" />
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>No reminder set</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ background: 'var(--color-muted)' }}>
          <Icon name="CheckBadgeIcon" size={12} variant="outline" className="text-gray-400 shrink-0" />
          <p
            className="text-xs"
            style={{ color: 'var(--color-muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Confirmed {formatConfirmedAt(confirmedAt)} UTC
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        <Link
          href="/pitches-listing-dashboard"
          className="pm-btn-primary flex-1 justify-center"
          onClick={onClose}
        >
          <Icon name="PaperAirplaneIcon" size={15} variant="outline" />
          View Pitches
        </Link>
        <Link
          href="/reminders"
          className="pm-btn flex-1 justify-center border"
          style={{ borderColor: 'var(--color-border)' }}
          onClick={onClose}
        >
          <Icon name="ClockIcon" size={15} variant="outline" />
          Reminders
        </Link>
        <button
          type="button"
          onClick={onNewPitch}
          className="pm-btn flex-1 justify-center border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Icon name="PlusIcon" size={15} variant="outline" />
          New Pitch
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NewPitchModal({ isOpen, onClose, initialArtistId, initialContactId, editPitch }: NewPitchModalProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoSave, setAutoSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitted, setSubmitted] = useState(false);
  const [savedPitchTitle, setSavedPitchTitle] = useState('');
  const [savedStatus, setSavedStatus] = useState<'draft' | 'ready' | 'sent'>('draft');
  const [savedRecipientCount, setSavedRecipientCount] = useState(0);
  const [savedReminderDate, setSavedReminderDate] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { runSteps } = useSubmissionProgress('pitch');

  // Artist autocomplete
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const artistInputRef = useRef<HTMLInputElement>(null);
  const [artistDropdownIndex, setArtistDropdownIndex] = useState(-1);

  // Recipients
  const [linkedContacts, setLinkedContacts] = useState<{ contact: Contact; link: ArtistRecipientLink }[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // External recipients
  const [externalRecipients, setExternalRecipients] = useState<ExternalRecipient[]>([]);
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [externalForm, setExternalForm] = useState({ fullName: '', email: '', role: '', company: '' });
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [confirmRemoveExternal, setConfirmRemoveExternal] = useState<string | null>(null);

  // Footer status (simplified: Draft, Ready, Sent)
  const [footerStatus, setFooterStatus] = useState<'draft' | 'ready' | 'sent'>('draft');

  // Reminder
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<7 | 14 | 30>(7);

  // Templates
  const [templates, setTemplates] = useState<PitchTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState('');

  useEffect(() => {
    initStore();
    setArtists(artistStore.getAll());
    setTemplates(templateStore.getAll());
    setIsHydrated(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting]);

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setSavedPitchTitle('');
    setSavedStatus('draft');
    setSavedRecipientCount(0);
    setSavedReminderDate(null);
    setConfirmedAt('');
    setIsSubmitting(false);
    setArtistQuery('');
    setSelectedArtist(null);
    setArtistDropdownOpen(false);
    setArtistDropdownIndex(-1);
    setLinkedContacts([]);
    setSelectedContactIds([]);
    setExternalRecipients([]);
    setShowAddExternal(false);
    setExternalForm({ fullName: '', email: '', role: '', company: '' });
    setExternalErrors({});
    setAutoSave('idle');
    setFooterStatus('draft');
    setReminderEnabled(false);
    setReminderDays(7);
    setSelectedTemplateId('');
    setShowSaveTemplate(false);
    setTemplateName('');
    setTemplateNameError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const triggerAutoSave = useCallback(() => {
    setAutoSave('saving');
    setTimeout(() => setAutoSave('saved'), 1200);
    setTimeout(() => setAutoSave('idle'), 4000);
  }, []);

  useEffect(() => {
    if (!isHydrated || !isOpen) return;
    const hasData = form.pitchTitle.length > 0 || form.artistId.length > 0 || form.notes.length > 0;
    if (!hasData) return;
    const timer = setTimeout(triggerAutoSave, 2000);
    return () => clearTimeout(timer);
  }, [form, isHydrated, isOpen, triggerAutoSave]);

  // Pre-fill artist when opened from a suggestion
  useEffect(() => {
    if (!isOpen || !isHydrated || !initialArtistId) return;
    const artist = artists.find((a) => a.id === initialArtistId);
    if (artist) {
      handleArtistSelect(artist);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isHydrated, initialArtistId, artists]);

  // Pre-select contact when opened from a suggestion
  useEffect(() => {
    if (!isOpen || !isHydrated || !initialContactId) return;
    setSelectedContactIds((prev) =>
      prev.includes(initialContactId) ? prev : [...prev, initialContactId]
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isHydrated, initialContactId, linkedContacts]);

  // Pre-fill form when editing an existing pitch
  useEffect(() => {
    if (!isOpen || !isHydrated || !editPitch) return;
    setForm({
      artistId: editPitch.artistId,
      pitchTitle: editPitch.title,
      trackUrl: editPitch.trackUrl || '',
      status: editPitch.status as FormData['status'],
      notes: editPitch.notes || '',
      links: [],
    });
    const artist = artists.find((a) => a.id === editPitch.artistId);
    if (artist) {
      setSelectedArtist(artist);
      setArtistQuery(artist.name);
      const links = linkStore.getByArtist(artist.id);
      const allContacts = contactStore.getAll();
      const linked = links
        .map((l) => {
          const contact = allContacts.find((c) => c.id === l.contactId);
          return contact ? { contact, link: l } : null;
        })
        .filter(Boolean) as { contact: Contact; link: ArtistRecipientLink }[];
      linked.sort((a, b) => (b.link.isPrimary ? 1 : 0) - (a.link.isPrimary ? 1 : 0));
      setLinkedContacts(linked);
      const existingRecipients = pitchRecipientStore.getByPitch(editPitch.id);
      setSelectedContactIds(existingRecipients.map((r) => r.contactId));
    }
    // Map stored status back to footerStatus
    const statusMap: Record<string, 'draft' | 'ready' | 'sent'> = {
      draft: 'draft',
      hold: 'ready',
      sent: 'sent',
      placed: 'sent',
    };
    setFooterStatus(statusMap[editPitch.status] || 'draft');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isHydrated, editPitch]);

  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(artistQuery.toLowerCase())
  );

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistQuery(artist.name);
    setArtistDropdownOpen(false);
    setForm((prev) => ({ ...prev, artistId: artist.id }));
    setErrors((prev) => { const e = { ...prev }; delete e.artistId; return e; });

    const links = linkStore.getByArtist(artist.id);
    const allContacts = contactStore.getAll();
    const linked = links
      .map((l) => {
        const contact = allContacts.find((c) => c.id === l.contactId);
        return contact ? { contact, link: l } : null;
      })
      .filter(Boolean) as { contact: Contact; link: ArtistRecipientLink }[];

    linked.sort((a, b) => (b.link.isPrimary ? 1 : 0) - (a.link.isPrimary ? 1 : 0));
    setLinkedContacts(linked);
    setSelectedContactIds(linked.map((l) => l.contact.id));
  };

  const handleArtistClear = () => {
    setSelectedArtist(null);
    setArtistQuery('');
    setForm((prev) => ({ ...prev, artistId: '' }));
    setLinkedContacts([]);
    setSelectedContactIds([]);
  };

  const toggleContact = (cid: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const addExternalRecipient = () => {
    const errs: Record<string, string> = {};
    if (!externalForm.fullName.trim()) errs.fullName = 'Name required';
    if (!externalForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalForm.email))
      errs.email = 'Valid email required';
    setExternalErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setExternalRecipients((prev) => [...prev, { id: uid(), ...externalForm }]);
    setExternalForm({ fullName: '', email: '', role: '', company: '' });
    setShowAddExternal(false);
    setExternalErrors({});
    showToast('Recipient added successfully', 'success');
  };

  const removeExternalRecipient = (id: string) => {
    setExternalRecipients((prev) => prev.filter((r) => r.id !== id));
    setConfirmRemoveExternal(null);
  };

  const selectedLinkedEmails = linkedContacts
    .filter((lc) => selectedContactIds.includes(lc.contact.id))
    .map((lc) => lc.contact.email);
  const externalEmails = externalRecipients.map((r) => r.email);
  const allSelectedEmails = [...selectedLinkedEmails, ...externalEmails];

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (field === 'pitchTitle') {
      if (!value.trim()) newErrors.pitchTitle = 'Pitch title is required';
      else delete newErrors.pitchTitle;
    }
    if (field === 'artistId') {
      if (!value) newErrors.artistId = 'Select an artist';
      else delete newErrors.artistId;
    }
    if (field === 'trackUrl') {
      if (value && !/^https?:\/\/.+/.test(value)) newErrors.trackUrl = 'Enter a valid URL (https://...)';
      else delete newErrors.trackUrl;
    }
    setErrors(newErrors);
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.artistId) newErrors.artistId = 'Select an artist';
    if (!form.pitchTitle.trim()) newErrors.pitchTitle = 'Pitch title is required';
    if (form.trackUrl && !/^https?:\/\/.+/.test(form.trackUrl)) newErrors.trackUrl = 'Enter a valid URL (https://...)';
    setErrors(newErrors);
    setTouched({ artistId: true, pitchTitle: true, trackUrl: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    triggerAutoSave();
    showToast('Draft saved', 'success');
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setForm((prev) => ({
      ...prev,
      pitchTitle: tpl.title,
      notes: tpl.notes,
      links: tpl.links.map((l) => ({ id: l.id, label: l.label, url: l.url, error: undefined })),
    }));
    templateStore.incrementUsage(templateId);
    setTemplates(templateStore.getAll());
    showToast(`Template "${tpl.name}" applied`, 'success');
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      setTemplateNameError('Template name is required');
      return;
    }
    templateStore.create({
      name: templateName.trim(),
      title: form.pitchTitle,
      notes: form.notes,
      links: form.links.map((l) => ({ id: l.id, label: l.label, url: l.url })),
    });
    setTemplates(templateStore.getAll());
    setShowSaveTemplate(false);
    setTemplateName('');
    setTemplateNameError('');
    showToast('Saved as template', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Map footerStatus to PitchStatus
    const pitchStatus: FormData['status'] =
      footerStatus === 'sent' ? 'sent' : footerStatus === 'ready' ? 'hold' : 'draft';

    try {
      runSteps(() => {
        let pitch: import('@/lib/types').Pitch;
        if (editPitch) {
          // Update existing pitch
          const updated = pitchStore.update(editPitch.id, {
            title: form.pitchTitle,
            artistId: form.artistId,
            trackUrl: form.trackUrl,
            status: pitchStatus,
            notes: reminderEnabled
              ? `${form.notes ? form.notes + '\n\n' : ''}⏰ Follow-up reminder set for ${reminderDays} days after creation.`
              : form.notes,
          });
          if (!updated) {
            showToast('Failed to update pitch. Please try again.', 'error');
            setIsSubmitting(false);
            return;
          }
          pitch = updated;
        } else {
          pitch = pitchStore.create({
            title: form.pitchTitle,
            artistId: form.artistId,
            trackUrl: form.trackUrl,
            status: pitchStatus,
            notes: reminderEnabled
              ? `${form.notes ? form.notes + '\n\n' : ''}⏰ Follow-up reminder set for ${reminderDays} days after creation.`
              : form.notes,
          });
        }

        const allRecipientIds = [...selectedContactIds];
        const createdExternalIds: string[] = [];
        externalRecipients.forEach((ext) => {
          const newContact = contactStore.create({
            fullName: ext.fullName,
            email: ext.email,
            role: ext.role || 'Other',
            company: ext.company || '',
            phone: '',
            notes: 'Added as external recipient',
          });
          createdExternalIds.push(newContact.id);
        });

        pitchRecipientStore.setForPitch(pitch.id, [...allRecipientIds, ...createdExternalIds]);

        const totalRecipients = allRecipientIds.length + createdExternalIds.length;
        const reminderDate = reminderEnabled
          ? (() => { const d = new Date(); d.setDate(d.getDate() + reminderDays); return d.toISOString(); })()
          : null;

        setSavedPitchTitle(form.pitchTitle);
        setSavedStatus(footerStatus);
        setSavedRecipientCount(totalRecipients);
        setSavedReminderDate(reminderDate);
        setConfirmedAt(new Date().toISOString());
        setSubmitted(true);
        setIsSubmitting(false);
      });
    } catch (error) {
      showToast('Failed to submit pitch. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? 'border-red-400 bg-red-50 focus:ring-red-300' : ''
    }`;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) handleClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="New Pitch"
    >
      <div
        className="relative w-full max-w-2xl mx-4 my-8 rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          maxHeight: 'calc(100vh - 4rem)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <Image src="/assets/images/pitchhood-logo-light-1772649730204.png" alt="Pitchhood" width={24} height={24} className="h-6 w-auto" />
            <div>
              <p className="pm-kicker mb-0">{editPitch ? 'Edit' : 'Create'}</p>
              <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                {editPitch ? 'Edit Pitch' : 'New Pitch'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={autoSave} />
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: 'var(--color-muted-foreground)' }}
              aria-label="Close modal"
            >
              <Icon name="XMarkIcon" size={18} variant="outline" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {submitted ? (
            <SuccessView
              pitchTitle={savedPitchTitle}
              status={savedStatus}
              recipientCount={savedRecipientCount}
              reminderDate={savedReminderDate}
              confirmedAt={confirmedAt}
              onClose={handleClose}
              onNewPitch={() => {
                setForm(initialForm);
                setSubmitted(false);
                setErrors({});
                setSelectedArtist(null);
                setArtistQuery('');
                setLinkedContacts([]);
                setSelectedContactIds([]);
                setExternalRecipients([]);
              }}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (showAddExternal) {
                    setShowAddExternal(false);
                    setExternalErrors({});
                    setExternalForm({ fullName: '', email: '', role: '', company: '' });
                  } else if (artistDropdownOpen) {
                    setArtistDropdownOpen(false);
                  }
                }
              }}
            >
              {/* Submission overlay */}
              {isSubmitting && (
                <div
                  className="absolute inset-0 z-[300] flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                  aria-busy="true"
                  aria-label="Submitting pitch, please wait"
                >
                  <div
                    className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-2xl"
                    style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                  >
                    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10V0C5.373 0 0 5.373 0 12h4z" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Submitting pitch…</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* TEMPLATE SELECTOR */}
                {templates.length > 0 && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                  >
                    <Icon name="DocumentDuplicateIcon" size={15} variant="outline" style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 } as React.CSSProperties} />
                    <div className="flex-1 min-w-0">
                      <label className="pm-label mb-0.5" style={{ fontSize: '0.7rem' }}>Load from template</label>
                      <select
                        className="pm-input text-sm py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={selectedTemplateId}
                        onChange={(e) => handleApplyTemplate(e.target.value)}
                        aria-label="Select a template"
                      >
                        <option value="">Select a template…</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <Link
                      href="/templates-management"
                      className="text-xs shrink-0 flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      style={{ color: 'var(--color-accent)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                      onClick={handleClose}
                      title="Manage templates"
                    >
                      <Icon name="Cog6ToothIcon" size={13} variant="outline" />
                      Manage
                    </Link>
                  </div>
                )}

                {/* ARTIST SELECTOR */}
                <div className="pm-panel">
                  <FormSectionHeader
                    icon="UserIcon"
                    title="Artista"
                    subtitle="Selecione o artista para carregar automaticamente os destinatários vinculados"
                  />
                  <div className="relative">
                    <label className="pm-label">
                      Artista <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={artistInputRef}
                        type="text"
                        className={inputClass('artistId')}
                        value={artistQuery}
                        onChange={(e) => {
                          setArtistQuery(e.target.value);
                          setArtistDropdownOpen(true);
                          setArtistDropdownIndex(-1);
                          if (selectedArtist && e.target.value !== selectedArtist.name) {
                            setSelectedArtist(null);
                            setForm((prev) => ({ ...prev, artistId: '' }));
                            setLinkedContacts([]);
                            setSelectedContactIds([]);
                          }
                        }}
                        onFocus={() => setArtistDropdownOpen(true)}
                        onBlur={() => { setTimeout(() => setArtistDropdownOpen(false), 150); handleBlur('artistId', form.artistId); }}
                        onKeyDown={(e) => {
                          if (!artistDropdownOpen || filteredArtists.length === 0) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setArtistDropdownIndex((i) => Math.min(i + 1, filteredArtists.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setArtistDropdownIndex((i) => Math.max(i - 1, 0));
                          } else if (e.key === 'Enter' && artistDropdownIndex >= 0) {
                            e.preventDefault();
                            handleArtistSelect(filteredArtists[artistDropdownIndex]);
                            setArtistDropdownIndex(-1);
                          } else if (e.key === 'Escape') {
                            setArtistDropdownOpen(false);
                            setArtistDropdownIndex(-1);
                          }
                        }}
                        placeholder="Buscar artista..."
                        autoComplete="off"
                        aria-label="Search artist"
                        aria-autoComplete="list"
                        aria-expanded={artistDropdownOpen}
                      />
                      {selectedArtist && (
                        <button
                          type="button"
                          onClick={handleArtistClear}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                          style={{ color: 'var(--color-muted-foreground)' }}
                          aria-label="Clear artist"
                        >
                          <Icon name="XMarkIcon" size={14} variant="outline" />
                        </button>
                      )}
                    </div>

                    {artistDropdownOpen && filteredArtists.length > 0 && (
                      <ul
                        className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-lg"
                        role="listbox"
                        style={{
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}
                      >
                        {filteredArtists.map((a, idx) => (
                          <li key={a.id} role="option" aria-selected={artistDropdownIndex === idx}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                color: 'var(--color-foreground)',
                                background: artistDropdownIndex === idx ? 'var(--color-muted)' : 'transparent',
                              }}
                              onMouseDown={() => handleArtistSelect(a)}
                              onMouseEnter={() => setArtistDropdownIndex(idx)}
                              onMouseLeave={() => setArtistDropdownIndex(-1)}
                            >
                              {a.name}
                              {a.notes && (
                                <span className="ml-2 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                  {a.notes}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {artistDropdownOpen && artistQuery.length > 0 && filteredArtists.length === 0 && (
                      <div
                        className="absolute z-50 w-full mt-1 rounded-lg px-3 py-2.5 text-sm"
                        style={{
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-muted-foreground)',
                        }}
                      >
                        Nenhum artista encontrado
                      </div>
                    )}
                  </div>

                  {errors.artistId && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                      {errors.artistId}
                    </p>
                  )}
                </div>

                {/* RECIPIENTS */}
                {form.artistId && (
                  <div className="pm-panel">
                    <FormSectionHeader
                      icon="UsersIcon"
                      title="Destinatários"
                      subtitle="Contatos vinculados ao artista. Desmarque para excluir da lista de envio."
                    />

                    {allSelectedEmails.length > 0 && (
                      <div
                        className="mb-4 px-3 py-2.5 rounded-lg text-sm"
                        style={{
                          background: 'var(--color-muted)',
                          border: '1px solid var(--color-border)',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        <span className="font-semibold mr-2" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Para:</span>
                        <span style={{ color: 'var(--color-foreground)', fontSize: '0.8125rem' }}>
                          {allSelectedEmails.join(', ')}
                        </span>
                      </div>
                    )}

                    {linkedContacts.length === 0 ? (
                      <div
                        className="py-4 text-center text-sm rounded-lg"
                        style={{
                          background: 'var(--color-muted)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-muted-foreground)',
                        }}
                      >
                        Nenhum contato vinculado a este artista.{' '}
                        <Link href="/artists" className="underline" style={{ color: 'var(--color-accent)' }} onClick={handleClose}>
                          Adicionar na página de Artistas
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedContacts.map(({ contact, link }) => {
                          const checked = selectedContactIds.includes(contact.id);
                          return (
                            <label
                              key={contact.id}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                              style={{
                                background: checked ? 'var(--color-muted)' : 'transparent',
                                border: `1px solid ${checked ? 'var(--color-border)' : 'transparent'}`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleContact(contact.id)}
                                className="mt-0.5 rounded shrink-0"
                                style={{ accentColor: 'var(--color-accent)' }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                                    {contact.fullName}
                                  </span>
                                  {link.isPrimary && (
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        background: 'var(--color-accent)',
                                        color: 'var(--color-accent-foreground)',
                                        fontFamily: 'IBM Plex Sans, sans-serif',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                    {link.relationshipType}
                                  </span>
                                  {contact.company && (
                                    <>
                                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
                                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{contact.company}</span>
                                    </>
                                  )}
                                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
                                  <span className="text-xs" style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    {contact.email}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {externalRecipients.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="pm-kicker" style={{ marginBottom: '6px' }}>Destinatários externos</p>
                        {externalRecipients.map((ext) => (
                          <div
                            key={ext.id}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                            style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                                  {ext.fullName}
                                </span>
                                {ext.role && (
                                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                    {ext.role}{ext.company ? ` @ ${ext.company}` : ''}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs" style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                                {ext.email}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveExternal(ext.id)}
                              className="pm-btn p-1 shrink-0"
                              style={{ color: 'var(--color-destructive)' }}
                              aria-label="Remove external recipient"
                            >
                              <Icon name="XMarkIcon" size={13} variant="outline" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showAddExternal ? (
                      <button
                        type="button"
                        onClick={() => setShowAddExternal(true)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none rounded"
                        style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-foreground)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted-foreground)'; }}
                      >
                        <Icon name="PlusIcon" size={13} variant="outline" />
                        Adicionar destinatário externo
                      </button>
                    ) : (
                      <div
                        className="mt-3 p-3 rounded-lg space-y-3"
                        style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowAddExternal(false);
                            setExternalErrors({});
                            setExternalForm({ fullName: '', email: '', role: '', company: '' });
                          }
                          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                            e.preventDefault();
                            addExternalRecipient();
                          }
                        }}
                      >
                        <p className="pm-kicker">Novo destinatário externo</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="pm-label">Nome <span className="text-red-500">*</span></label>
                            <input
                              className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${externalErrors.fullName ? ' border-red-400' : ''}`}
                              value={externalForm.fullName}
                              onChange={(e) => setExternalForm((p) => ({ ...p, fullName: e.target.value }))}
                              onBlur={(e) => {
                                if (!e.target.value.trim()) setExternalErrors((p) => ({ ...p, fullName: 'Name required' }));
                                else setExternalErrors((p) => { const x = { ...p }; delete x.fullName; return x; });
                              }}
                              placeholder="Nome completo"
                              autoFocus
                              aria-required="true"
                            />
                            {externalErrors.fullName && <p className="text-xs text-red-500 mt-1">{externalErrors.fullName}</p>}
                          </div>
                          <div>
                            <label className="pm-label">E-mail <span className="text-red-500">*</span></label>
                            <input
                              className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none${externalErrors.email ? ' border-red-400' : ''}`}
                              type="email"
                              value={externalForm.email}
                              onChange={(e) => setExternalForm((p) => ({ ...p, email: e.target.value }))}
                              onBlur={(e) => {
                                if (!e.target.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) setExternalErrors((p) => ({ ...p, email: 'Valid email required' }));
                                else setExternalErrors((p) => { const x = { ...p }; delete x.email; return x; });
                              }}
                              placeholder="email@exemplo.com"
                              aria-required="true"
                            />
                            {externalErrors.email && <p className="text-xs text-red-500 mt-1">{externalErrors.email}</p>}
                          </div>
                          <div>
                            <label className="pm-label">Cargo / Função</label>
                            <input
                              className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              value={externalForm.role}
                              onChange={(e) => setExternalForm((p) => ({ ...p, role: e.target.value }))}
                              placeholder="Ex: A&R, Manager"
                            />
                          </div>
                          <div>
                            <label className="pm-label">Empresa</label>
                            <input
                              className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              value={externalForm.company}
                              onChange={(e) => setExternalForm((p) => ({ ...p, company: e.target.value }))}
                              placeholder="Ex: Sony Music"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setShowAddExternal(false); setExternalErrors({}); setExternalForm({ fullName: '', email: '', role: '', company: '' }); }}
                            className="pm-btn text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={addExternalRecipient}
                            className="pm-btn-primary text-xs px-4 min-h-[36px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                          >
                            <Icon name="PlusIcon" size={13} variant="outline" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PITCH DETAILS */}
                <div className="pm-panel">
                  <FormSectionHeader
                    icon="DocumentMagnifyingGlassIcon"
                    title="Detalhes do Pitch"
                    subtitle="Título, link da faixa, status e informações da proposta"
                  />
                  <div className="space-y-4">
                    <div>
                      <label className="pm-label">
                        Título do Pitch <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={inputClass('pitchTitle')}
                        value={form.pitchTitle}
                        onChange={(e) => update('pitchTitle', e.target.value)}
                        onBlur={(e) => handleBlur('pitchTitle', e.target.value)}
                        placeholder="Ex: Summer Single 2026 — Mariana Luz"
                        aria-required="true"
                        aria-describedby={errors.pitchTitle ? 'pitchTitle-error' : undefined}
                      />
                      {errors.pitchTitle && (
                        <p id="pitchTitle-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                          {errors.pitchTitle}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="pm-label">Track URL</label>
                        <input
                          type="url"
                          className={inputClass('trackUrl')}
                          value={form.trackUrl}
                          onChange={(e) => update('trackUrl', e.target.value)}
                          onBlur={(e) => handleBlur('trackUrl', e.target.value)}
                          placeholder="https://soundcloud.com/..."
                          aria-describedby={errors.trackUrl ? 'trackUrl-error' : undefined}
                        />
                        {errors.trackUrl && (
                          <p id="trackUrl-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                            {errors.trackUrl}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="pm-label">Status</label>
                        <select
                          className="pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={form.status}
                          onChange={(e) => update('status', e.target.value as FormData['status'])}
                        >
                          {PITCH_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <ExternalLinksSection
                  links={form.links}
                  onChange={(links) => setForm((prev) => ({ ...prev, links }))}
                />

                {/* Notes */}
                <div className="pm-panel">
                  <FormSectionHeader
                    icon="PencilSquareIcon"
                    title="Notas Internas"
                    subtitle="Impressões, critérios de avaliação e observações"
                  />
                  <textarea
                    className="pm-input resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Impressões iniciais, potencial de mercado, próximos passos..."
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-muted-foreground)' }}>
                    {form.notes.length} caracteres
                  </p>
                </div>

                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  <span className="text-red-500">*</span> Campos obrigatórios
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {!submitted && (
          <div
            className="shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {/* Reminder row */}
            <div
              className="flex items-center gap-4 px-6 py-3 flex-wrap"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              {/* Set Reminder toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminderEnabled}
                  onClick={() => setReminderEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    reminderEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={reminderEnabled ? {} : { background: 'var(--color-border)' }}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      reminderEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
                  Set reminder
                </span>
              </div>

              {/* Day presets — only visible when toggle is on */}
              {reminderEnabled && (
                <div className="flex items-center gap-1.5">
                  {([7, 14, 30] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setReminderDays(d)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        reminderDays === d
                          ? 'bg-blue-600 text-white' :'border text-xs'
                      }`}
                      style={
                        reminderDays === d
                          ? {}
                          : { borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', background: 'transparent' }
                      }
                    >
                      {d}d
                    </button>
                  ))}
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    follow-up
                  </span>
                </div>
              )}
            </div>

            {/* Save as template inline form */}
            {showSaveTemplate && (
              <div
                className="flex items-center gap-2 px-6 py-3 flex-wrap"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-muted)' }}
              >
                <Icon name="DocumentDuplicateIcon" size={14} variant="outline" style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 } as React.CSSProperties} />
                <div className="flex-1 min-w-[160px]">
                  <input
                    type="text"
                    className={`pm-input text-sm py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none ${templateNameError ? 'border-red-400' : ''}`}
                    placeholder="Template name…"
                    value={templateName}
                    onChange={(e) => { setTemplateName(e.target.value); if (templateNameError) setTemplateNameError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAsTemplate(); } if (e.key === 'Escape') { setShowSaveTemplate(false); setTemplateName(''); setTemplateNameError(''); } }}
                    autoFocus
                    aria-label="Template name"
                  />
                  {templateNameError && <p className="text-xs text-red-500 mt-0.5">{templateNameError}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="pm-btn-primary text-xs px-3 min-h-[34px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <Icon name="CheckIcon" size={13} variant="outline" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSaveTemplate(false); setTemplateName(''); setTemplateNameError(''); }}
                  className="pm-btn-ghost text-xs px-2 min-h-[34px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Icon name="XMarkIcon" size={13} variant="outline" />
                </button>
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center justify-between px-6 py-4 gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Icon name="XMarkIcon" size={16} variant="outline" />
                Cancelar
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Save as Template button */}
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate((v) => !v)}
                  disabled={isSubmitting}
                  className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  title="Save current pitch details as a reusable template"
                >
                  <Icon name="DocumentDuplicateIcon" size={15} variant="outline" />
                  Save as Template
                </button>

                {/* Status dropdown */}
                <div className="relative">
                  <select
                    value={footerStatus}
                    onChange={(e) => setFooterStatus(e.target.value as typeof footerStatus)}
                    disabled={isSubmitting}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    aria-label="Set pitch status"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="sent">Sent</option>
                  </select>
                  <span
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                      <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Icon name="DocumentTextIcon" size={16} variant="outline" />
                  Salvar Rascunho
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  disabled={isSubmitting}
                  className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin" style={{ width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {editPitch ? 'Saving…' : 'Sending…'}
                    </>
                  ) : (
                    <>
                      <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
                      {editPitch ? 'Save Changes' : 'Enviar Pitch'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmRemoveExternal && (
        <ConfirmModal
          title="Remove Recipient"
          message={`Remove <strong>${externalRecipients.find((r) => r.id === confirmRemoveExternal)?.fullName ?? 'this recipient'}</strong> from the pitch? This won't delete the contact.`}
          confirmLabel="Remove"
          onConfirm={() => removeExternalRecipient(confirmRemoveExternal)}
          onCancel={() => setConfirmRemoveExternal(null)}
        />
      )}
    </div>
  );
}

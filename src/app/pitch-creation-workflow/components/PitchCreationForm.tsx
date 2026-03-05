'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import FormSectionHeader from './FormSectionHeader';
import ExternalLinksSection from './ExternalLinksSection';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useSubmissionProgress } from '@/hooks/useSubmissionProgress';
import Sidebar from '@/components/common/Sidebar';


import {
  artistStore,
  contactStore,
  linkStore,
  pitchStore,
  pitchRecipientStore,
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
  status: 'draft' | 'new' | 'in_review' | 'approved' | 'rejected';
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

export default function PitchCreationForm() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoSave, setAutoSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitted, setSubmitted] = useState(false);
  const [savedPitchTitle, setSavedPitchTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { progress: submissionProgress, runSteps } = useSubmissionProgress('pitch');

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

  useEffect(() => {
    artistStore.getAll().then((data) => {
      setArtists(data);
      setIsHydrated(true);
    });
  }, []);

  const triggerAutoSave = useCallback(() => {
    setAutoSave('saving');
    setTimeout(() => setAutoSave('saved'), 1200);
    setTimeout(() => setAutoSave('idle'), 4000);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const hasData = form.pitchTitle.length > 0 || form.artistId.length > 0 || form.notes.length > 0;
    if (!hasData) return;
    const timer = setTimeout(triggerAutoSave, 2000);
    return () => clearTimeout(timer);
  }, [form, isHydrated, triggerAutoSave]);

  // Artist autocomplete helpers
  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(artistQuery.toLowerCase())
  );

  const handleArtistSelect = async (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistQuery(artist.name);
    setArtistDropdownOpen(false);
    setForm((prev) => ({ ...prev, artistId: artist.id }));
    setErrors((prev) => { const e = { ...prev }; delete e.artistId; return e; });

    const [links, allContacts] = await Promise.all([
      linkStore.getByArtist(artist.id),
      contactStore.getAll(),
    ]);
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

  // External recipient helpers
  const addExternalRecipient = () => {
    const errs: Record<string, string> = {};
    if (!externalForm.fullName.trim()) errs.fullName = 'Name required';
    if (!externalForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalForm.email))
      errs.email = 'Valid email required';
    setExternalErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setExternalRecipients((prev) => [
      ...prev,
      { id: uid(), ...externalForm },
    ]);
    setExternalForm({ fullName: '', email: '', role: '', company: '' });
    setShowAddExternal(false);
    setExternalErrors({});
    showToast('Recipient added successfully', 'success');
  };

  const removeExternalRecipient = (id: string) => {
    setExternalRecipients((prev) => prev.filter((r) => r.id !== id));
    setConfirmRemoveExternal(null);
  };

  // To: summary emails
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    runSteps(async () => {
      const pitch = await pitchStore.create({
        title: form.pitchTitle,
        artistId: form.artistId,
        trackUrl: form.trackUrl,
        status: form.status,
        notes: form.notes,
      });

      if (!pitch) {
        showToast('Failed to create pitch. Please try again.', 'error');
        setIsSubmitting(false);
        return;
      }

      const allRecipientIds = [...selectedContactIds];

      const createdExternalIds: string[] = [];
      for (const ext of externalRecipients) {
        const newContact = await contactStore.create({
          fullName: ext.fullName,
          email: ext.email,
          role: ext.role || 'Other',
          company: ext.company || '',
          phone: '',
          notes: 'Added as external recipient',
        });
        if (newContact) createdExternalIds.push(newContact.id);
      }

      await pitchRecipientStore.setForPitch(pitch.id, [...allRecipientIds, ...createdExternalIds]);

      showToast(`Pitch "${form.pitchTitle}" submitted successfully!`, 'success');
      setSavedPitchTitle(form.pitchTitle);
      setSubmitted(true);
      setIsSubmitting(false);
    });
  };

  const inputClass = (field: string) =>
    `pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? 'border-red-400 bg-red-50 focus:ring-red-300' : ''
    }`;

  if (!isHydrated) return null;

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
        <Sidebar />
        <main className="pt-16 md:pt-0 md:pl-56">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Icon name="CheckCircleIcon" size={32} variant="outline" className="text-emerald-600" />
              </div>
              <h2 className="pm-h1 text-xl mb-2">Pitch criado com sucesso!</h2>
              <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                O pitch <strong>{savedPitchTitle}</strong> foi salvo e os destinatários foram registrados.
              </p>
              <div className="flex gap-3">
                <Link href="/pitches" className="pm-btn-primary">
                  <Icon name="Squares2X2Icon" size={16} variant="outline" />
                  Ver Pitches
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setSubmitted(false);
                    setErrors({});
                    setSelectedArtist(null);
                    setArtistQuery('');
                    setLinkedContacts([]);
                    setSelectedContactIds([]);
                    setExternalRecipients([]);
                  }}
                  className="pm-btn border"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Icon name="PlusIcon" size={16} variant="outline" />
                  Novo Pitch
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (showAddExternal) {
                  setShowAddExternal(false);
                  setExternalErrors({});
                  setExternalForm({ fullName: '', email: '', role: '', company: '' });
                }
                if (artistDropdownOpen) {
                  setArtistDropdownOpen(false);
                }
              }
            }}
          >
            {/* Submission overlay */}
            {isSubmitting && (
              <div
                className="fixed inset-0 z-[300] flex items-center justify-center"
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
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Submitting pitch…</p>
                </div>
              </div>
            )}
            {/* Topbar actions row */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <AutoSaveIndicator status={autoSave} />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Icon name="DocumentTextIcon" size={16} variant="outline" />
                  Salvar Rascunho
                </button>
                <button type="submit" className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
                  <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
                  Enviar Pitch
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* ── ARTIST SELECTOR ── */}
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
                      tabIndex={1}
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

                  {/* Dropdown */}
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

              {/* ── RECIPIENTS ── */}
              {form.artistId && (
                <div className="pm-panel">
                  <FormSectionHeader
                    icon="UsersIcon"
                    title="Destinatários"
                    subtitle="Contatos vinculados ao artista. Desmarque para excluir da lista de envio."
                  />

                  {/* To: summary */}
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

                  {/* Linked contacts checklist */}
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
                      <Link href="/artists" className="underline" style={{ color: 'var(--color-accent)' }}>
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
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
                                >
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
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                                >
                                  {link.relationshipType}
                                </span>
                                {contact.company && (
                                  <>
                                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
                                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {contact.company}
                                    </span>
                                  </>
                                )}
                                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>·</span>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}
                                >
                                  {contact.email}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* External recipients */}
                  {externalRecipients.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p
                        className="pm-kicker"
                        style={{ marginBottom: '6px' }}
                      >
                        Destinatários externos
                      </p>
                      {externalRecipients.map((ext) => (
                        <div
                          key={ext.id}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                          style={{
                            background: 'var(--color-muted)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-semibold"
                                style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
                              >
                                {ext.fullName}
                              </span>
                              {ext.role && (
                                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                  {ext.role}{ext.company ? ` @ ${ext.company}` : ''}
                                </span>
                              )}
                            </div>
                            <span
                              className="text-xs"
                              style={{ color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}
                            >
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

                  {/* Add external recipient */}
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
                      style={{
                        background: 'var(--color-muted)',
                        border: '1px solid var(--color-border)',
                      }}
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
                          {externalErrors.fullName && (
                            <p className="text-xs text-red-500 mt-1">{externalErrors.fullName}</p>
                          )}
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
                          {externalErrors.email && (
                            <p className="text-xs text-red-500 mt-1">{externalErrors.email}</p>
                          )}
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

              {/* ── PITCH DETAILS ── */}
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
                      tabIndex={2}
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
                        tabIndex={3}
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
                        tabIndex={4}
                      >
                        {PITCH_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* External Links */}
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
                  rows={5}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Impressões iniciais, potencial de mercado, próximos passos..."
                  tabIndex={5}
                />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-muted-foreground)' }}>
                  {form.notes.length} caracteres
                </p>
              </div>

              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                <span className="text-red-500">*</span> Campos obrigatórios
              </p>

              {/* Bottom actions */}
              <div className="flex items-center justify-between pt-2 pb-8 flex-wrap gap-3">
                <Link
                  href="/pitches"
                  className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  tabIndex={6}
                >
                  <Icon name="ArrowLeftIcon" size={16} variant="outline" />
                  Cancelar
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="pm-btn-ghost border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ borderColor: 'var(--color-border)' }}
                    tabIndex={7}
                  >
                    <Icon name="DocumentTextIcon" size={16} variant="outline" />
                    Salvar Rascunho
                  </button>
                  <button
                    type="submit"
                    className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                    tabIndex={8}
                  >
                    <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
                    Enviar Pitch
                  </button>
                </div>
              </div>
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
          </form>
        </div>
      </main>
    </div>
  );
}
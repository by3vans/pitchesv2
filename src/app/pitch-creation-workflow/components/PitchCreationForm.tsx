'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import FormSectionHeader from './FormSectionHeader';
import ExternalLinksSection from './ExternalLinksSection';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Sidebar from '@/components/common/Sidebar';
import {
  artistStore, contactStore, linkStore,
  pitchStore, pitchRecipientStore,
} from '@/lib/store';
import type { Artist, Contact, ArtistRecipientLink } from '@/lib/types';
import { PITCH_STATUSES } from '@/lib/types';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import UpgradeModal from '@/components/billing/UpgradeModal';

interface LinkEntry { id: string; label: string; url: string; error?: string; }
interface ExternalRecipient { id: string; fullName: string; email: string; role: string; company: string; }
interface FormData {
  artistId: string; pitchTitle: string; trackUrl: string;
  status: 'draft' | 'new' | 'in_review' | 'approved' | 'rejected';
  notes: string; links: LinkEntry[];
}
interface FormErrors { [key: string]: string; }

const initialForm: FormData = { artistId: '', pitchTitle: '', trackUrl: '', status: 'draft', notes: '', links: [] };

function uid(): string { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

// ─── shared style helpers ────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  fontFamily: 'Epilogue, sans-serif',
  backgroundColor: 'var(--ice)',
  borderColor: 'var(--cream)',
  color: 'var(--ink)',
};

const inputError: React.CSSProperties = {
  ...inputBase,
  borderColor: 'var(--crimson)',
  backgroundColor: 'rgba(194,59,46,0.04)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Azeret Mono, monospace',
  color: 'var(--stone)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const kickerStyle: React.CSSProperties = {
  fontFamily: 'Azeret Mono, monospace',
  color: 'var(--stone)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};
// ─────────────────────────────────────────────────────────────────────────────

export default function PitchCreationForm() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoSave, setAutoSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canCreatePitch } = useFeatureGate();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const artistInputRef = useRef<HTMLInputElement>(null);
  const [artistDropdownIndex, setArtistDropdownIndex] = useState(-1);

  const [linkedContacts, setLinkedContacts] = useState<{ contact: Contact; link: ArtistRecipientLink }[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [externalRecipients, setExternalRecipients] = useState<ExternalRecipient[]>([]);
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [externalForm, setExternalForm] = useState({ fullName: '', email: '', role: '', company: '' });
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [confirmRemoveExternal, setConfirmRemoveExternal] = useState<string | null>(null);

  useEffect(() => {
    artistStore.getAll().then((data) => { setArtists(data); setIsHydrated(true); });
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

  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(artistQuery.toLowerCase())
  );

  const handleArtistSelect = async (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistQuery(artist.name);
    setArtistDropdownOpen(false);
    setForm((prev) => ({ ...prev, artistId: artist.id }));
    setErrors((prev) => { const e = { ...prev }; delete e.artistId; return e; });
    const [links, allContacts] = await Promise.all([linkStore.getByArtist(artist.id), contactStore.getAll()]);
    const linked = links.map((l) => {
      const contact = allContacts.find((c) => c.id === l.contactId);
      return contact ? { contact, link: l } : null;
    }).filter(Boolean) as { contact: Contact; link: ArtistRecipientLink }[];
    linked.sort((a, b) => (b.link.isPrimary ? 1 : 0) - (a.link.isPrimary ? 1 : 0));
    setLinkedContacts(linked);
    setSelectedContactIds(linked.map((l) => l.contact.id));
  };

  const handleArtistClear = () => {
    setSelectedArtist(null); setArtistQuery('');
    setForm((prev) => ({ ...prev, artistId: '' }));
    setLinkedContacts([]); setSelectedContactIds([]);
  };

  const toggleContact = (cid: string) => {
    setSelectedContactIds((prev) => prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]);
  };

  const addExternalRecipient = () => {
    const errs: Record<string, string> = {};
    if (!externalForm.fullName.trim()) errs.fullName = 'Nome obrigatório';
    if (!externalForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalForm.email))
      errs.email = 'E-mail válido obrigatório';
    setExternalErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setExternalRecipients((prev) => [...prev, { id: uid(), ...externalForm }]);
    setExternalForm({ fullName: '', email: '', role: '', company: '' });
    setShowAddExternal(false); setExternalErrors({});
    showToast('Destinatário adicionado', 'success');
  };

  const removeExternalRecipient = (id: string) => {
    setExternalRecipients((prev) => prev.filter((r) => r.id !== id));
    setConfirmRemoveExternal(null);
  };

  const selectedLinkedEmails = linkedContacts
    .filter((lc) => selectedContactIds.includes(lc.contact.id))
    .map((lc) => lc.contact.email);
  const allSelectedEmails = [...selectedLinkedEmails, ...externalRecipients.map((r) => r.email)];

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (field === 'pitchTitle') { if (!value.trim()) newErrors.pitchTitle = 'Título obrigatório'; else delete newErrors.pitchTitle; }
    if (field === 'artistId') { if (!value) newErrors.artistId = 'Selecione um artista'; else delete newErrors.artistId; }
    if (field === 'trackUrl') { if (value && !/^https?:\/\/.+/.test(value)) newErrors.trackUrl = 'URL válida (https://...)'; else delete newErrors.trackUrl; }
    setErrors(newErrors);
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.artistId) newErrors.artistId = 'Selecione um artista';
    if (!form.pitchTitle.trim()) newErrors.pitchTitle = 'Título obrigatório';
    if (form.trackUrl && !/^https?:\/\/.+/.test(form.trackUrl)) newErrors.trackUrl = 'URL válida (https://...)';
    setErrors(newErrors);
    setTouched({ artistId: true, pitchTitle: true, trackUrl: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => { triggerAutoSave(); showToast('Rascunho salvo', 'success'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    if (!canCreatePitch) { setShowUpgrade(true); setIsSubmitting(false); return; }
    setIsSubmitting(true);
    try {
      const pitch = await pitchStore.create({
        title: form.pitchTitle, artistId: form.artistId,
        trackUrl: form.trackUrl, status: form.status, notes: form.notes,
      });
      if (!pitch) { showToast('Falha ao criar pitch. Tente novamente.', 'error'); setIsSubmitting(false); return; }
      const createdExternalIds: string[] = [];
      for (const ext of externalRecipients) {
        const newContact = await contactStore.create({ fullName: ext.fullName, email: ext.email, role: ext.role || 'Other', company: ext.company || '', phone: '', notes: 'Added as external recipient' });
        if (newContact) createdExternalIds.push(newContact.id);
      }
      await pitchRecipientStore.setForPitch(pitch.id, [...selectedContactIds, ...createdExternalIds]);
      showToast(`Pitch "${form.pitchTitle}" enviado com sucesso!`, 'success');
      router.push(`/pitch-creation-success-modal?pitchId=${pitch.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (process.env.NODE_ENV === 'development') console.error('[handleSubmit]', msg);
      showToast('Falha ao criar pitch. Tente novamente.', 'error');
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (showAddExternal) { setShowAddExternal(false); setExternalErrors({}); setExternalForm({ fullName: '', email: '', role: '', company: '' }); }
                if (artistDropdownOpen) setArtistDropdownOpen(false);
              }
            }}
          >
            {/* Submission overlay */}
            {isSubmitting && (
              <div
                className="fixed inset-0 z-[300] flex items-center justify-center"
                style={{ background: 'rgba(26,26,24,0.5)' }}
                aria-busy="true"
                aria-label="Enviando pitch, aguarde"
              >
                <div
                  className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-2xl"
                  style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}
                >
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="var(--cream)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm font-medium" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                    Enviando pitch…
                  </p>
                </div>
              </div>
            )}

            {/* Topbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <AutoSaveIndicator status={autoSave} />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="pm-btn-ghost border rounded-lg text-sm"
                  style={{ borderColor: 'var(--cream)' }}
                >
                  <Icon name="DocumentTextIcon" size={16} variant="outline" />
                  Salvar Rascunho
                </button>
                <button type="submit" className="pm-btn-primary">
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
                  <label className="pm-label" style={labelStyle}>
                    Artista <span style={{ color: 'var(--crimson)' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={artistInputRef}
                      type="text"
                      className="pm-input"
                      style={errors.artistId ? inputError : inputBase}
                      value={artistQuery}
                      onChange={(e) => {
                        setArtistQuery(e.target.value);
                        setArtistDropdownOpen(true);
                        setArtistDropdownIndex(-1);
                        if (selectedArtist && e.target.value !== selectedArtist.name) {
                          setSelectedArtist(null);
                          setForm((prev) => ({ ...prev, artistId: '' }));
                          setLinkedContacts([]); setSelectedContactIds([]);
                        }
                      }}
                      onFocus={() => setArtistDropdownOpen(true)}
                      onBlur={() => { setTimeout(() => setArtistDropdownOpen(false), 150); handleBlur('artistId', form.artistId); }}
                      onKeyDown={(e) => {
                        if (!artistDropdownOpen || filteredArtists.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setArtistDropdownIndex((i) => Math.min(i + 1, filteredArtists.length - 1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setArtistDropdownIndex((i) => Math.max(i - 1, 0)); }
                        else if (e.key === 'Enter' && artistDropdownIndex >= 0) { e.preventDefault(); handleArtistSelect(filteredArtists[artistDropdownIndex]); setArtistDropdownIndex(-1); }
                        else if (e.key === 'Escape') { setArtistDropdownOpen(false); setArtistDropdownIndex(-1); }
                      }}
                      placeholder="Buscar artista..."
                      autoComplete="off"
                      tabIndex={1}
                      aria-label="Search artist"
                      aria-expanded={artistDropdownOpen}
                    />
                    {selectedArtist && (
                      <button
                        type="button"
                        onClick={handleArtistClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                        style={{ color: 'var(--stone)' }}
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
                      style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)', maxHeight: '200px', overflowY: 'auto' }}
                    >
                      {filteredArtists.map((a, idx) => (
                        <li key={a.id} role="option" aria-selected={artistDropdownIndex === idx}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm transition-colors focus:outline-none"
                            style={{
                              fontFamily: 'Epilogue, sans-serif',
                              color: 'var(--ink)',
                              backgroundColor: artistDropdownIndex === idx ? 'var(--cream)' : 'transparent',
                            }}
                            onMouseDown={() => handleArtistSelect(a)}
                            onMouseEnter={() => setArtistDropdownIndex(idx)}
                            onMouseLeave={() => setArtistDropdownIndex(-1)}
                          >
                            {a.name}
                            {a.notes && (
                              <span className="ml-2 text-xs" style={{ color: 'var(--stone)' }}>{a.notes}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {artistDropdownOpen && artistQuery.length > 0 && filteredArtists.length === 0 && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-lg px-3 py-2.5 text-sm"
                      style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)', fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}
                    >
                      Nenhum artista encontrado
                    </div>
                  )}
                </div>
                {errors.artistId && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--crimson)', fontFamily: 'Epilogue, sans-serif' }}>
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

                  {allSelectedEmails.length > 0 && (
                    <div
                      className="mb-4 px-3 py-2.5 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}
                    >
                      <span style={{ ...kickerStyle, marginRight: '8px' }}>Para:</span>
                      <span style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--ink)', fontSize: '0.8125rem' }}>
                        {allSelectedEmails.join(', ')}
                      </span>
                    </div>
                  )}

                  {linkedContacts.length === 0 ? (
                    <div
                      className="py-4 text-center text-sm rounded-lg"
                      style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)', fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}
                    >
                      Nenhum contato vinculado a este artista.{' '}
                      <Link href="/artists" className="underline" style={{ color: 'var(--blue)' }}>
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
                              backgroundColor: checked ? 'var(--cream)' : 'transparent',
                              border: `1px solid ${checked ? 'var(--cream)' : 'transparent'}`,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleContact(contact.id)}
                              className="mt-0.5 rounded shrink-0"
                              style={{ accentColor: 'var(--blue)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
                                  {contact.fullName}
                                </span>
                                {link.isPrimary && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ fontFamily: 'Azeret Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: 'var(--blue)', color: 'var(--ice)' }}
                                  >
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>{link.relationshipType}</span>
                                {contact.company && (
                                  <>
                                    <span className="text-xs" style={{ color: 'var(--stone)' }}>·</span>
                                    <span className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>{contact.company}</span>
                                  </>
                                )}
                                <span className="text-xs" style={{ color: 'var(--stone)' }}>·</span>
                                <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--blue)' }}>{contact.email}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {externalRecipients.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p style={kickerStyle}>Destinatários externos</p>
                      {externalRecipients.map((ext) => (
                        <div key={ext.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>{ext.fullName}</span>
                              {ext.role && <span className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>{ext.role}{ext.company ? ` @ ${ext.company}` : ''}</span>}
                            </div>
                            <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--blue)' }}>{ext.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveExternal(ext.id)}
                            className="pm-btn p-1 shrink-0"
                            style={{ color: 'var(--crimson)' }}
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
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors rounded"
                      style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                    >
                      <Icon name="PlusIcon" size={13} variant="outline" />
                      Adicionar destinatário externo
                    </button>
                  ) : (
                    <div
                      className="mt-3 p-3 rounded-lg space-y-3"
                      style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setShowAddExternal(false); setExternalErrors({}); setExternalForm({ fullName: '', email: '', role: '', company: '' }); }
                        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); addExternalRecipient(); }
                      }}
                    >
                      <p style={kickerStyle}>Novo destinatário externo</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="pm-label" style={labelStyle}>Nome <span style={{ color: 'var(--crimson)' }}>*</span></label>
                          <input
                            className="pm-input text-sm"
                            style={externalErrors.fullName ? inputError : inputBase}
                            value={externalForm.fullName}
                            onChange={(e) => setExternalForm((p) => ({ ...p, fullName: e.target.value }))}
                            placeholder="Nome completo"
                            autoFocus
                          />
                          {externalErrors.fullName && <p className="text-xs mt-1" style={{ color: 'var(--crimson)', fontFamily: 'Epilogue, sans-serif' }}>{externalErrors.fullName}</p>}
                        </div>
                        <div>
                          <label className="pm-label" style={labelStyle}>E-mail <span style={{ color: 'var(--crimson)' }}>*</span></label>
                          <input
                            className="pm-input text-sm"
                            style={externalErrors.email ? inputError : inputBase}
                            type="email"
                            value={externalForm.email}
                            onChange={(e) => setExternalForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="email@exemplo.com"
                          />
                          {externalErrors.email && <p className="text-xs mt-1" style={{ color: 'var(--crimson)', fontFamily: 'Epilogue, sans-serif' }}>{externalErrors.email}</p>}
                        </div>
                        <div>
                          <label className="pm-label" style={labelStyle}>Cargo / Função</label>
                          <input className="pm-input text-sm" style={inputBase} value={externalForm.role} onChange={(e) => setExternalForm((p) => ({ ...p, role: e.target.value }))} placeholder="Ex: A&R, Manager" />
                        </div>
                        <div>
                          <label className="pm-label" style={labelStyle}>Empresa</label>
                          <input className="pm-input text-sm" style={inputBase} value={externalForm.company} onChange={(e) => setExternalForm((p) => ({ ...p, company: e.target.value }))} placeholder="Ex: Sony Music" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setShowAddExternal(false); setExternalErrors({}); setExternalForm({ fullName: '', email: '', role: '', company: '' }); }} className="pm-btn text-xs">Cancelar</button>
                        <button type="button" onClick={addExternalRecipient} className="pm-btn-primary text-xs px-4 min-h-[36px]">
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
                    <label className="pm-label" style={labelStyle}>Título do Pitch <span style={{ color: 'var(--crimson)' }}>*</span></label>
                    <input
                      type="text"
                      className="pm-input"
                      style={errors.pitchTitle ? inputError : inputBase}
                      value={form.pitchTitle}
                      onChange={(e) => update('pitchTitle', e.target.value)}
                      onBlur={(e) => handleBlur('pitchTitle', e.target.value)}
                      placeholder="Ex: Summer Single 2026 — Mariana Luz"
                      tabIndex={2}
                    />
                    {errors.pitchTitle && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--crimson)', fontFamily: 'Epilogue, sans-serif' }}>
                        <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                        {errors.pitchTitle}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="pm-label" style={labelStyle}>Track URL</label>
                      <input
                        type="url"
                        className="pm-input"
                        style={errors.trackUrl ? inputError : inputBase}
                        value={form.trackUrl}
                        onChange={(e) => update('trackUrl', e.target.value)}
                        onBlur={(e) => handleBlur('trackUrl', e.target.value)}
                        placeholder="https://soundcloud.com/..."
                        tabIndex={3}
                      />
                      {errors.trackUrl && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--crimson)', fontFamily: 'Epilogue, sans-serif' }}>
                          <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                          {errors.trackUrl}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="pm-label" style={labelStyle}>Status</label>
                      <select
                        className="pm-input"
                        style={inputBase}
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
                  className="pm-input resize-none"
                  style={inputBase}
                  rows={5}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Impressões iniciais, potencial de mercado, próximos passos..."
                  tabIndex={5}
                />
                <p className="text-xs mt-1 text-right" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                  {form.notes.length} caracteres
                </p>
              </div>

              <p className="text-xs flex items-center gap-1" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                <span style={{ color: 'var(--crimson)' }}>*</span> Campos obrigatórios
              </p>

              {/* Bottom actions */}
              <div className="flex items-center justify-between pt-2 pb-8 flex-wrap gap-3">
                <Link
                  href="/pitches"
                  className="pm-btn-ghost border rounded-lg text-sm"
                  style={{ borderColor: 'var(--cream)' }}
                  tabIndex={6}
                >
                  <Icon name="ArrowLeftIcon" size={16} variant="outline" />
                  Cancelar
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="pm-btn-ghost border rounded-lg text-sm"
                    style={{ borderColor: 'var(--cream)' }}
                    tabIndex={7}
                  >
                    <Icon name="DocumentTextIcon" size={16} variant="outline" />
                    Salvar Rascunho
                  </button>
                  <button type="submit" className="pm-btn-primary" tabIndex={8}>
                    <Icon name="PaperAirplaneIcon" size={16} variant="outline" />
                    Enviar Pitch
                  </button>
                </div>
              </div>
            </div>

            {showUpgrade && (
              <UpgradeModal trigger="pitch_limit" onClose={() => setShowUpgrade(false)} />
            )}

            {confirmRemoveExternal && (
              <ConfirmModal
                title="Remover Destinatário"
                message={`Remover <strong>${externalRecipients.find((r) => r.id === confirmRemoveExternal)?.fullName ?? 'este destinatário'}</strong> do pitch? O contato não será excluído.`}
                confirmLabel="Remover"
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
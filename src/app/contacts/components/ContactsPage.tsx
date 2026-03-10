'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import type { Contact } from '@/lib/types';
import { CONTACT_ROLES } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import UpgradeModal from '@/components/billing/UpgradeModal';

interface ContactModalProps {
  contact: Contact | null;
  onClose: () => void;
  onSave: () => void;
}

function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const [form, setForm] = useState({
    fullName: contact?.fullName ?? '',
    email:    contact?.email    ?? '',
    role:     contact?.role     ?? CONTACT_ROLES[0],
    company:  contact?.company  ?? '',
    phone:    contact?.phone    ?? '',
    notes:    contact?.notes    ?? '',
  });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const validateField = (k: string, v: string) => {
    const newErrors = { ...errors };
    if (k === 'fullName') {
      if (!v.trim()) newErrors.fullName = 'Full name is required';
      else delete newErrors.fullName;
    }
    if (k === 'email') {
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) newErrors.email = 'Invalid email format';
      else delete newErrors.email;
    }
    setErrors(newErrors);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        full_name: form.fullName.trim(),
        email:     form.email.trim()   || null,
        role:      form.role,
        company:   form.company.trim() || null,
        phone:     form.phone.trim()   || null,
        notes:     form.notes.trim()   || null,
      };

      if (contact) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="pm-panel w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="pm-h1 text-lg">{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="pm-btn" aria-label="Close">
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {saveError && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{ color: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.2)', fontFamily: 'Epilogue, sans-serif' }}
          >
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="pm-label">Full Name <span style={{ color: 'var(--crimson)' }}>*</span></label>
              <input
                className="pm-input"
                style={errors.fullName ? { borderColor: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.04)' } : {}}
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                onBlur={(e) => validateField('fullName', e.target.value)}
                placeholder="Full name"
                autoFocus
                tabIndex={1}
                aria-required="true"
              />
              {errors.fullName && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--crimson)', fontFamily: 'Azeret Mono, monospace' }}>
                  <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="pm-label">Email</label>
              <input
                className="pm-input"
                style={errors.email ? { borderColor: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.04)' } : {}}
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                onBlur={(e) => validateField('email', e.target.value)}
                placeholder="email@company.com"
                tabIndex={2}
              />
              {errors.email && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--crimson)', fontFamily: 'Azeret Mono, monospace' }}>
                  <Icon name="ExclamationCircleIcon" size={12} variant="outline" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="pm-label">Phone</label>
              <input className="pm-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 555 000 0000" tabIndex={3} />
            </div>

            <div>
              <label className="pm-label">Role</label>
              <select className="pm-input" value={form.role} onChange={(e) => update('role', e.target.value)} tabIndex={4}>
                {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="pm-label">Company</label>
              <input className="pm-input" value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Company name" tabIndex={5} />
            </div>

            <div className="sm:col-span-2">
              <label className="pm-label">Notes</label>
              <textarea className="pm-input resize-none" rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional notes..." tabIndex={6} />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="pm-btn" tabIndex={7} disabled={saving}>Cancel</button>
            <button type="submit" className="pm-btn-primary" tabIndex={8} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactTableSkeleton() {
  return (
    <div className="pm-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cream)' }}>
            {['Name', 'Role', 'Company', 'Email', 'Phone', ''].map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--cream)' }} className="animate-pulse">
              <td className="py-3 px-3"><div className="h-3.5 rounded w-28" style={{ backgroundColor: 'var(--cream)' }} /></td>
              <td className="py-3 px-3"><div className="h-5 rounded-full w-20" style={{ backgroundColor: 'var(--cream)' }} /></td>
              <td className="py-3 px-3"><div className="h-3 rounded w-24" style={{ backgroundColor: 'var(--cream)' }} /></td>
              <td className="py-3 px-3"><div className="h-3 rounded w-32" style={{ backgroundColor: 'var(--cream)' }} /></td>
              <td className="py-3 px-3"><div className="h-3 rounded w-20" style={{ backgroundColor: 'var(--cream)' }} /></td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-1 justify-end">
                  <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: 'var(--cream)' }} />
                  <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: 'var(--cream)' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canCreateContact }      = useFeatureGate();
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast }             = useToast();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, company, role, phone, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) { console.error('[ContactsPage] Failed to fetch contacts:', error.message); return; }

    setContacts(
      (data ?? []).map((row) => ({
        id:        row.id,
        fullName:  row.full_name,
        email:     row.email    ?? '',
        company:   row.company  ?? '',
        role:      row.role     ?? '',
        phone:     row.phone    ?? '',
        notes:     row.notes    ?? '',
        createdAt: row.created_at,
      }))
    );
  }, []);

  useEffect(() => { refresh().finally(() => setIsLoading(false)); }, [refresh]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.fullName.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchRole   = !roleFilter || c.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleEdit = (c: Contact) => { setEditTarget(c); setShowModal(true); };
  const handleNew  = () => {
    if (!canCreateContact) { setShowUpgrade(true); return; }
    setEditTarget(null);
    setShowModal(true);
  };
  const handleDelete = (c: Contact) => setDeleteTarget(c);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('contacts').delete().eq('id', deleteTarget.id).eq('user_id', user.id);
    if (error) { showToast('Failed to delete contact', 'error'); return; }
    await refresh();
    showToast(`Contact "${deleteTarget.fullName}" deleted`, 'info');
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ice)' }}>
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header panel */}
          <div className="pm-panel mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="pm-kicker">Industry</p>
                <h1 className="pm-h1">Contacts</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Icon
                    name="MagnifyingGlassIcon"
                    size={16}
                    variant="outline"
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--stone)' }}
                  />
                  <input
                    className="pm-input pl-9 w-48"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select className="pm-input w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={handleNew} className="pm-btn-primary flex items-center gap-1">
                  <Icon name="PlusIcon" size={16} variant="outline" />
                  New Contact
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <ContactTableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="pm-panel flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--cream)' }}
              >
                <Icon name="UsersIcon" size={36} variant="outline" style={{ color: 'var(--stone)' }} />
              </div>
              {search || roleFilter ? (
                <>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>No contacts found</h3>
                  <p className="text-sm max-w-xs" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>No contacts match your filters. Try adjusting your search or role filter.</p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>No contacts yet</h3>
                  <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>Grow your industry network by adding your first contact — labels, managers, and A&Rs.</p>
                  <button onClick={handleNew} className="pm-btn-primary flex items-center gap-2">
                    <Icon name="PlusIcon" size={16} variant="outline" />
                    Add Your First Contact
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="pm-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--cream)' }}>
                    {['Name', 'Role', 'Company', 'Email', 'Phone', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-xs font-semibold"
                        style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                      <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}>
                        {c.fullName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--cream)', color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}
                        >
                          {c.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}>{c.company}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>{c.email}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}>{c.phone}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleEdit(c)} className="pm-btn p-1.5" aria-label="Edit">
                            <Icon name="PencilSquareIcon" size={14} variant="outline" />
                          </button>
                          <button onClick={() => handleDelete(c)} className="pm-btn p-1.5" style={{ color: 'var(--crimson)' }} aria-label="Delete">
                            <Icon name="TrashIcon" size={14} variant="outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showUpgrade && <UpgradeModal trigger="contact_limit" onClose={() => setShowUpgrade(false)} />}

      {showModal && (
        <ContactModal
          contact={editTarget}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await refresh();
            showToast(editTarget ? `Contact "${editTarget.fullName}" updated` : 'Contact added successfully', 'success');
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Contact"
          message={`Permanently delete <strong>${deleteTarget.fullName}</strong>? This action cannot be undone and will remove all linked associations.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
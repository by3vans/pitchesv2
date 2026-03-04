'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { templateStore, PitchTemplate, TemplateLink } from '@/lib/templateStore';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface EditModalProps {
  template: PitchTemplate | null;
  isNew: boolean;
  onSave: (data: Omit<PitchTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  onClose: () => void;
}

function EditModal({ template, isNew, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [title, setTitle] = useState(template?.title ?? '');
  const [notes, setNotes] = useState(template?.notes ?? '');
  const [links, setLinks] = useState<TemplateLink[]>(template?.links ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const addLink = () => {
    setLinks((prev) => [...prev, { id: uid(), label: '', url: '' }]);
  };

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    setLinkErrors((prev) => { const e = { ...prev }; delete e[`${id}_${field}`]; return e; });
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Template name is required';
    if (!title.trim()) errs.title = 'Pitch title is required';
    const lErrs: Record<string, string> = {};
    links.forEach((l) => {
      if (l.url && !/^https?:\/\/.+/.test(l.url)) lErrs[`${l.id}_url`] = 'Enter a valid URL';
    });
    setErrors(errs);
    setLinkErrors(lErrs);
    return Object.keys(errs).length === 0 && Object.keys(lErrs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), title: title.trim(), notes: notes.trim(), links });
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={isNew ? 'Create Template' : 'Edit Template'}
    >
      <div
        className="relative w-full max-w-xl mx-4 my-8 rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          maxHeight: 'calc(100vh - 4rem)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <p className="pm-kicker mb-0">{isNew ? 'Create' : 'Edit'}</p>
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
              {isNew ? 'New Template' : 'Edit Template'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: 'var(--color-muted-foreground)' }}
            aria-label="Close"
          >
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Template Name */}
          <div>
            <label className="pm-label">Template Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => { const x = { ...p }; delete x.name; return x; }); }}
              placeholder="e.g. Summer Sync Pitch"
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} variant="outline" />{errors.name}</p>}
          </div>

          {/* Pitch Title */}
          <div>
            <label className="pm-label">Pitch Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.title ? 'border-red-400 bg-red-50' : ''}`}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => { const x = { ...p }; delete x.title; return x; }); }}
              placeholder="e.g. Summer Single 2026"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} variant="outline" />{errors.title}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="pm-label">Notes</label>
            <textarea
              className="pm-input resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Template notes, pitch context, talking points..."
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-muted-foreground)' }}>{notes.length} chars</p>
          </div>

          {/* External Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="pm-label mb-0">External Links</label>
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                style={{ color: 'var(--color-accent)', fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                <Icon name="PlusIcon" size={13} variant="outline" />
                Add link
              </button>
            </div>
            {links.length === 0 ? (
              <p className="text-xs py-3 text-center rounded-lg" style={{ color: 'var(--color-muted-foreground)', background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                No links added yet
              </p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          className="pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={link.label}
                          onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                          placeholder="Label (e.g. SoundCloud)"
                        />
                      </div>
                      <div>
                        <input
                          type="url"
                          className={`pm-input text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${linkErrors[`${link.id}_url`] ? 'border-red-400' : ''}`}
                          value={link.url}
                          onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                        {linkErrors[`${link.id}_url`] && <p className="text-xs text-red-500 mt-0.5">{linkErrors[`${link.id}_url`]}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="mt-1.5 p-1 rounded transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                      style={{ color: 'var(--color-destructive)' }}
                      aria-label="Remove link"
                    >
                      <Icon name="XMarkIcon" size={14} variant="outline" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button type="button" onClick={onClose} className="pm-btn-ghost border rounded-lg text-sm" style={{ borderColor: 'var(--color-border)' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="pm-btn-primary">
            <Icon name="CheckIcon" size={15} variant="outline" />
            {isNew ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesManagement() {
  const [templates, setTemplates] = useState<PitchTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'usage'>('newest');
  const [editTarget, setEditTarget] = useState<PitchTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { showToast } = useToast();

  const reload = useCallback(() => setTemplates(templateStore.getAll()), []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = templates
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      return 0;
    });

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.includes(t.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(filtered.map((t) => t.id));
  };
  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = (data: Omit<PitchTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    templateStore.create(data);
    reload();
    setIsCreating(false);
    showToast('Template created', 'success');
  };

  const handleEdit = (data: Omit<PitchTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    if (!editTarget) return;
    templateStore.update(editTarget.id, data);
    reload();
    setEditTarget(null);
    showToast('Template updated', 'success');
  };

  const handleDelete = (id: string) => {
    templateStore.delete(id);
    reload();
    setDeleteTarget(null);
    setSelected((prev) => prev.filter((x) => x !== id));
    showToast('Template deleted', 'success');
  };

  const handleDuplicate = (id: string) => {
    templateStore.duplicate(id);
    reload();
    showToast('Template duplicated', 'success');
  };

  const handleBulkDelete = () => {
    templateStore.deleteMany(selected);
    reload();
    setSelected([]);
    setBulkDeleteTarget(false);
    showToast(`${selected.length} template${selected.length !== 1 ? 's' : ''} deleted`, 'success');
  };

  return (
    <div className="pm-page-root">
      <div className="pm-page-content">
        {/* Topbar */}
        <div
          className="flex items-center justify-between mb-6 gap-4 flex-wrap"
          style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}
        >
          <div>
            <p className="pm-kicker mb-0.5">Pitch Workflow</p>
            <h1 className="pm-h1">Templates</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="pm-btn-primary"
          >
            <Icon name="PlusIcon" size={16} variant="outline" />
            Create Template
          </button>
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="MagnifyingGlassIcon"
              size={15}
              variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted-foreground)' } as React.CSSProperties}
            />
            <input
              type="text"
              className="pm-input pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search templates by name, title, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                style={{ color: 'var(--color-muted-foreground)' }}
                aria-label="Clear search"
              >
                <Icon name="XMarkIcon" size={13} variant="outline" />
              </button>
            )}
          </div>
          <select
            className="pm-input text-sm w-auto min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort templates"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="usage">Most used</option>
          </select>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
            style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => setBulkDeleteTarget(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
              style={{ color: 'var(--color-destructive)', fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              <Icon name="TrashIcon" size={13} variant="outline" />
              Delete selected
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="ml-auto text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Stats summary */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {filtered.length} of {templates.length} template{templates.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </span>
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs underline ml-2"
                style={{ color: 'var(--color-accent)', fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {templates.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: 'var(--color-muted)', border: '1px dashed var(--color-border)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <Icon name="DocumentDuplicateIcon" size={24} variant="outline" style={{ color: 'var(--color-muted-foreground)' } as React.CSSProperties} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No templates yet</p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Save pitch details as reusable templates for faster creation
            </p>
            <button type="button" onClick={() => setIsCreating(true)} className="pm-btn-primary">
              <Icon name="PlusIcon" size={15} variant="outline" />
              Create your first template
            </button>
          </div>
        )}

        {/* No results */}
        {templates.length > 0 && filtered.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-2xl"
            style={{ background: 'var(--color-muted)', border: '1px dashed var(--color-border)' }}
          >
            <Icon name="MagnifyingGlassIcon" size={22} variant="outline" style={{ color: 'var(--color-muted-foreground)', marginBottom: '12px' } as React.CSSProperties} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>No results found</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Try a different search term</p>
          </div>
        )}

        {/* Template cards grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => {
              const isSelected = selected.includes(template.id);
              return (
                <div
                  key={template.id}
                  className="group relative rounded-xl flex flex-col transition-all duration-200"
                  style={{
                    background: 'var(--color-card)',
                    border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    boxShadow: isSelected ? '0 0 0 2px var(--color-accent)' : undefined,
                  }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-start gap-3 px-4 pt-4 pb-3"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(template.id)}
                      className="mt-0.5 rounded shrink-0 cursor-pointer"
                      style={{ accentColor: 'var(--color-accent)' }}
                      aria-label={`Select ${template.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
                        title={template.name}
                      >
                        {template.name}
                      </h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {template.title}
                      </p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 flex-1">
                    {template.notes ? (
                      <p
                        className="text-xs leading-relaxed line-clamp-3"
                        style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                      >
                        {template.notes}
                      </p>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--color-muted-foreground)' }}>No notes</p>
                    )}

                    {template.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.links.slice(0, 3).map((link) => (
                          <span
                            key={link.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{
                              background: 'var(--color-muted)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-muted-foreground)',
                              fontFamily: 'IBM Plex Sans, sans-serif',
                            }}
                          >
                            <Icon name="LinkIcon" size={10} variant="outline" />
                            {link.label || 'Link'}
                          </span>
                        ))}
                        {template.links.length > 3 && (
                          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>+{template.links.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDate(template.createdAt)}
                      </span>
                      {(template.usageCount || 0) > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-xs"
                          style={{ color: 'var(--color-muted-foreground)', fontFamily: 'IBM Plex Sans, sans-serif' }}
                        >
                          <Icon name="ArrowPathIcon" size={10} variant="outline" />
                          {template.usageCount}×
                        </span>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setEditTarget(template)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ color: 'var(--color-muted-foreground)' }}
                        aria-label="Edit template"
                        title="Edit"
                      >
                        <Icon name="PencilSquareIcon" size={14} variant="outline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(template.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ color: 'var(--color-muted-foreground)' }}
                        aria-label="Duplicate template"
                        title="Duplicate"
                      >
                        <Icon name="DocumentDuplicateIcon" size={14} variant="outline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(template.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        style={{ color: 'var(--color-destructive)' }}
                        aria-label="Delete template"
                        title="Delete"
                      >
                        <Icon name="TrashIcon" size={14} variant="outline" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {isCreating && (
        <EditModal
          template={null}
          isNew
          onSave={handleCreate}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          template={editTarget}
          isNew={false}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Template"
          message={`Delete <strong>${templates.find((t) => t.id === deleteTarget)?.name ?? 'this template'}</strong>? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Bulk delete confirm */}
      {bulkDeleteTarget && (
        <ConfirmModal
          title="Delete Templates"
          message={`Delete <strong>${selected.length} template${selected.length !== 1 ? 's' : ''}</strong>? This cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteTarget(false)}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import UpgradeModal from '@/components/billing/UpgradeModal';

// ── Types ────────────────────────────────────────────────────────────────────

interface TemplateLink { id: string; label: string; url: string; }

interface PitchTemplate {
  id: string; userId: string; name: string; title: string;
  notes: string; links: TemplateLink[]; usageCount: number; createdAt: string;
}

type SortBy = 'newest' | 'oldest' | 'name' | 'usage';

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function rowToTemplate(row: Record<string, unknown>): PitchTemplate {
  const rawLinks = Array.isArray(row.links) ? row.links : [];
  const links: TemplateLink[] = rawLinks.map((l: unknown) => {
    if (typeof l === 'object' && l !== null) {
      const obj = l as Record<string, unknown>;
      return { id: String(obj.id ?? uid()), label: String(obj.label ?? ''), url: String(obj.url ?? '') };
    }
    return { id: uid(), label: '', url: String(l) };
  });
  return {
    id: String(row.id), userId: String(row.user_id),
    name: String(row.name ?? ''), title: String(row.title ?? ''),
    notes: String(row.notes ?? ''), links,
    usageCount: Number(row.usage_count ?? 0), createdAt: String(row.created_at),
  };
}

// ── EditModal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  template: PitchTemplate | null; isNew: boolean;
  onSave: (data: Pick<PitchTemplate, 'name' | 'title' | 'notes' | 'links'>) => void;
  onClose: () => void;
}

function EditModal({ template, isNew, onSave, onClose }: EditModalProps) {
  const [name, setName]   = useState(template?.name ?? '');
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

  const addLink = () => setLinks((prev) => [...prev, { id: uid(), label: '', url: '' }]);

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    setLinkErrors((prev) => { const e = { ...prev }; delete e[`${id}_${field}`]; return e; });
  };

  const removeLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim())  errs.name  = 'Nome do template obrigatório';
    if (!title.trim()) errs.title = 'Título do pitch obrigatório';
    const lErrs: Record<string, string> = {};
    links.forEach((l) => {
      if (l.url && !/^https?:\/\/.+/.test(l.url)) lErrs[`${l.id}_url`] = 'URL inválida';
    });
    setErrors(errs); setLinkErrors(lErrs);
    return Object.keys(errs).length === 0 && Object.keys(lErrs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), title: title.trim(), notes: notes.trim(), links });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center"
      style={{ backgroundColor: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true" role="dialog" aria-label={isNew ? 'Criar Template' : 'Editar Template'}>
      <div className="relative w-full max-w-xl mx-4 my-8 rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)', maxHeight: 'calc(100vh - 4rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--cream)' }}>
          <div>
            <p className="pm-kicker mb-0">{isNew ? 'Criar' : 'Editar'}</p>
            <h2 className="font-semibold text-base"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              {isNew ? 'Novo Template' : 'Editar Template'}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg transition-colors focus:outline-none"
            style={{ color: 'var(--stone)' }} aria-label="Fechar"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="pm-label">
              Nome do Template <span style={{ color: 'var(--crimson)' }}>*</span>
            </label>
            <input type="text" className="pm-input focus:outline-none"
              style={errors.name ? { borderColor: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.04)' } : {}}
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => { const x={...p}; delete x.name; return x; }); }}
              placeholder="ex: Summer Sync Pitch" autoFocus />
            {errors.name && (
              <p className="text-xs mt-1 flex items-center gap-1"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}>
                <Icon name="ExclamationCircleIcon" size={12} variant="outline" />{errors.name}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="pm-label">
              Título do Pitch <span style={{ color: 'var(--crimson)' }}>*</span>
            </label>
            <input type="text" className="pm-input focus:outline-none"
              style={errors.title ? { borderColor: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.04)' } : {}}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => { const x={...p}; delete x.title; return x; }); }}
              placeholder="ex: Summer Single 2026" />
            {errors.title && (
              <p className="text-xs mt-1 flex items-center gap-1"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}>
                <Icon name="ExclamationCircleIcon" size={12} variant="outline" />{errors.title}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="pm-label">Notas</label>
            <textarea className="pm-input resize-none focus:outline-none" rows={4}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto do pitch, pontos de conversa..." />
            <p className="text-xs mt-1 text-right"
              style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              {notes.length} chars
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="pm-label mb-0">Links Externos</label>
              <button type="button" onClick={addLink}
                className="flex items-center gap-1 text-xs font-medium transition-colors focus:outline-none rounded"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--blue)' }}>
                <Icon name="PlusIcon" size={13} variant="outline" />Adicionar link
              </button>
            </div>
            {links.length === 0 ? (
              <p className="text-xs py-3 text-center rounded-lg"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)', backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}>
                Nenhum link adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input type="text" className="pm-input text-sm focus:outline-none"
                        value={link.label} onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        placeholder="Label (ex: SoundCloud)" />
                      <div>
                        <input type="url" className="pm-input text-sm focus:outline-none"
                          style={linkErrors[`${link.id}_url`] ? { borderColor: 'var(--crimson)' } : {}}
                          value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                          placeholder="https://..." />
                        {linkErrors[`${link.id}_url`] && (
                          <p className="text-xs mt-0.5" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)' }}>
                            {linkErrors[`${link.id}_url`]}
                          </p>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeLink(link.id)}
                      className="mt-1.5 p-1 rounded transition-colors focus:outline-none"
                      style={{ color: 'var(--crimson)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(194,59,46,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      aria-label="Remover link">
                      <Icon name="XMarkIcon" size={14} variant="outline" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--cream)' }}>
          <button type="button" onClick={onClose}
            className="pm-btn-ghost border rounded-lg text-sm"
            style={{ borderColor: 'var(--cream)', fontFamily: 'Epilogue, sans-serif' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="pm-btn-primary">
            <Icon name="CheckIcon" size={15} variant="outline" />
            {isNew ? 'Criar Template' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TemplatesManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<PitchTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [editTarget, setEditTarget] = useState<PitchTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canCreateTemplate } = useFeatureGate();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { showToast } = useToast();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTemplates([]); return; }
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, title, notes, links, usage_count, user_id, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates((data ?? []).map((row) => rowToTemplate(row as Record<string, unknown>)));
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('[Templates]', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (data: Pick<PitchTemplate, 'name' | 'title' | 'notes' | 'links'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('templates').insert({ user_id: user.id, ...data, usage_count: 0 });
      if (error) throw error;
      await fetchTemplates(); setIsCreating(false);
      showToast('Template criado', 'success');
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro ao criar', 'error'); }
  };

  const handleEdit = async (data: Pick<PitchTemplate, 'name' | 'title' | 'notes' | 'links'>) => {
    if (!editTarget) return;
    try {
      const { error } = await supabase.from('templates').update(data).eq('id', editTarget.id);
      if (error) throw error;
      await fetchTemplates(); setEditTarget(null);
      showToast('Template atualizado', 'success');
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro ao atualizar', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      await fetchTemplates(); setDeleteTarget(null);
      setSelected((prev) => prev.filter((x) => x !== id));
      showToast('Template excluído', 'success');
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro ao excluir', 'error'); }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const source = templates.find((t) => t.id === id);
      if (!source) return;
      const { error } = await supabase.from('templates').insert({
        user_id: user.id, name: `${source.name} (cópia)`,
        title: source.title, notes: source.notes, links: source.links, usage_count: 0,
      });
      if (error) throw error;
      await fetchTemplates();
      showToast('Template duplicado', 'success');
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro ao duplicar', 'error'); }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase.from('templates').delete().in('id', selected);
      if (error) throw error;
      const count = selected.length;
      await fetchTemplates(); setSelected([]); setBulkDeleteTarget(false);
      showToast(`${count} template${count !== 1 ? 's' : ''} excluído${count !== 1 ? 's' : ''}`, 'success');
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro ao excluir', 'error'); }
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = templates
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name')   return a.name.localeCompare(b.name);
      if (sortBy === 'usage')  return b.usageCount - a.usageCount;
      return 0;
    });

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.includes(t.id));
  const toggleSelectAll = () => allSelected ? setSelected([]) : setSelected(filtered.map((t) => t.id));
  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="pm-page-root">
      <div className="pm-page-content">

        {/* Topbar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap"
          style={{ borderBottom: '1px solid var(--cream)', paddingBottom: '1.25rem' }}>
          <div>
            <p className="pm-kicker mb-0.5">Pitch Workflow</p>
            <h1 className="pm-h1">Templates</h1>
          </div>
          <button type="button"
            onClick={() => { if (!canCreateTemplate) { setShowUpgrade(true); return; } setIsCreating(true); }}
            className="pm-btn-primary">
            <Icon name="PlusIcon" size={15} variant="outline" />
            Criar template
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="MagnifyingGlassIcon" size={15} variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--stone)' }} />
            <input type="text" className="pm-input pl-9 text-sm focus:outline-none"
              style={{ fontFamily: 'Epilogue, sans-serif' }}
              placeholder="Buscar por nome, título ou notas..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                style={{ color: 'var(--stone)' }} aria-label="Limpar busca">
                <Icon name="XMarkIcon" size={13} variant="outline" />
              </button>
            )}
          </div>
          <select className="pm-input text-sm w-auto min-w-[160px] focus:outline-none"
            style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
            value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
            aria-label="Ordenar templates">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name">Nome A–Z</option>
            <option value="usage">Mais usados</option>
          </select>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--cream)' }}>
            <span className="text-sm font-medium"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              {selected.length} selecionado{selected.length !== 1 ? 's' : ''}
            </span>
            <button type="button" onClick={() => setBulkDeleteTarget(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--crimson)', backgroundColor: 'rgba(194,59,46,0.08)' }}>
              <Icon name="TrashIcon" size={13} variant="outline" />
              Excluir selecionados
            </button>
            <button type="button" onClick={() => setSelected([])} className="ml-auto text-xs"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              Limpar seleção
            </button>
          </div>
        )}

        {/* Stats line */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs"
              style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
              {filtered.length} de {templates.length} template{templates.length !== 1 ? 's' : ''}{search && ` com "${search}"`}
            </span>
            {filtered.length > 0 && (
              <button type="button" onClick={toggleSelectAll} className="text-xs underline ml-2"
                style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--blue)' }}>
                {allSelected ? 'Desselecionar tudo' : 'Selecionar tudo'}
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--cream)' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ backgroundColor: 'var(--cream)', border: '1px dashed var(--stone)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}>
              <Icon name="DocumentDuplicateIcon" size={24} variant="outline" style={{ color: 'var(--stone)' }} />
            </div>
            <p className="text-sm font-semibold mb-1"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              Nenhum template ainda
            </p>
            <p className="text-xs mb-5"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              Salve detalhes do pitch como templates reutilizáveis
            </p>
            <button type="button"
              onClick={() => { if (!canCreateTemplate) { setShowUpgrade(true); return; } setIsCreating(true); }}
              className="pm-btn-primary">
              <Icon name="PlusIcon" size={15} variant="outline" />
              Criar primeiro template
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && templates.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
            style={{ backgroundColor: 'var(--cream)', border: '1px dashed var(--stone)' }}>
            <Icon name="MagnifyingGlassIcon" size={22} variant="outline"
              style={{ color: 'var(--stone)', marginBottom: '12px' }} />
            <p className="text-sm font-semibold mb-1"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}>
              Nenhum resultado
            </p>
            <p className="text-xs" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
              Tente outro termo de busca
            </p>
          </div>
        )}

        {/* Template cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => {
              const isSelected = selected.includes(template.id);
              return (
                <div key={template.id}
                  className="group relative rounded-xl flex flex-col transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--ice)',
                    border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--cream)'}`,
                    boxShadow: isSelected ? '0 0 0 2px rgba(72,108,227,0.25)' : undefined,
                  }}>

                  {/* Card header */}
                  <div className="flex items-start gap-3 px-4 pt-4 pb-3"
                    style={{ borderBottom: '1px solid var(--cream)' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(template.id)}
                      className="mt-0.5 rounded shrink-0 cursor-pointer"
                      style={{ accentColor: 'var(--blue)' }}
                      aria-label={`Selecionar ${template.name}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate"
                        style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)', letterSpacing: '-0.01em' }}
                        title={template.name}>
                        {template.name}
                      </h3>
                      <p className="text-xs mt-0.5 truncate"
                        style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                        {template.title}
                      </p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 flex-1">
                    {template.notes ? (
                      <p className="text-xs leading-relaxed line-clamp-3"
                        style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                        {template.notes}
                      </p>
                    ) : (
                      <p className="text-xs italic" style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--stone)' }}>
                        Sem notas
                      </p>
                    )}
                    {template.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.links.slice(0, 3).map((link) => (
                          <span key={link.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{ fontFamily: 'Azeret Mono, monospace', backgroundColor: 'var(--cream)', border: '1px solid var(--cream)', color: 'var(--stone)' }}>
                            <Icon name="LinkIcon" size={10} variant="outline" />
                            {link.label || 'Link'}
                          </span>
                        ))}
                        {template.links.length > 3 && (
                          <span className="text-xs" style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                            +{template.links.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: '1px solid var(--cream)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs"
                        style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                        {formatDate(template.createdAt)}
                      </span>
                      {template.usageCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs"
                          style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}>
                          <Icon name="ArrowPathIcon" size={10} variant="outline" />
                          {template.usageCount}×
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setEditTarget(template)}
                        className="p-1.5 rounded-lg transition-colors focus:outline-none"
                        style={{ color: 'var(--stone)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        aria-label="Editar" title="Editar">
                        <Icon name="PencilSquareIcon" size={14} variant="outline" />
                      </button>
                      <button type="button" onClick={() => handleDuplicate(template.id)}
                        className="p-1.5 rounded-lg transition-colors focus:outline-none"
                        style={{ color: 'var(--stone)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        aria-label="Duplicar" title="Duplicar">
                        <Icon name="DocumentDuplicateIcon" size={14} variant="outline" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(template.id)}
                        className="p-1.5 rounded-lg transition-colors focus:outline-none"
                        style={{ color: 'var(--crimson)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(194,59,46,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        aria-label="Excluir" title="Excluir">
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

      {showUpgrade && <UpgradeModal trigger="template_limit" onClose={() => setShowUpgrade(false)} />}
      {isCreating && <EditModal template={null} isNew onSave={handleCreate} onClose={() => setIsCreating(false)} />}
      {editTarget && <EditModal template={editTarget} isNew={false} onSave={handleEdit} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir Template"
          message={`Excluir <strong>${templates.find((t) => t.id === deleteTarget)?.name ?? 'este template'}</strong>? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)} />
      )}
      {bulkDeleteTarget && (
        <ConfirmModal
          title="Excluir Templates"
          message={`Excluir <strong>${selected.length} template${selected.length !== 1 ? 's' : ''}</strong>? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir Tudo"
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteTarget(false)} />
      )}
    </div>
  );
}
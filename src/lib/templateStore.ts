'use client';

export interface PitchTemplate {
  id: string;
  name: string;
  title: string;
  notes: string;
  links: TemplateLink[];
  createdAt: string;
  usageCount: number;
}

export interface TemplateLink {
  id: string;
  label: string;
  url: string;
}

const TEMPLATE_KEY = 'pm_pitch_templates';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function load(): PitchTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    return raw ? (JSON.parse(raw) as PitchTemplate[]) : [];
  } catch {
    return [];
  }
}

function save(data: PitchTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(data));
}

export const templateStore = {
  getAll: (): PitchTemplate[] => load(),

  getById: (id: string): PitchTemplate | undefined => load().find((t) => t.id === id),

  create: (data: Omit<PitchTemplate, 'id' | 'createdAt' | 'usageCount'>): PitchTemplate => {
    const item: PitchTemplate = { ...data, id: uid(), createdAt: now(), usageCount: 0 };
    save([...load(), item]);
    return item;
  },

  update: (id: string, data: Partial<Omit<PitchTemplate, 'id' | 'createdAt'>>): PitchTemplate | null => {
    const all = load();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save(all);
    return all[idx];
  },

  incrementUsage: (id: string): void => {
    const all = load();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return;
    all[idx].usageCount = (all[idx].usageCount || 0) + 1;
    save(all);
  },

  duplicate: (id: string): PitchTemplate | null => {
    const original = load().find((t) => t.id === id);
    if (!original) return null;
    const copy: PitchTemplate = {
      ...original,
      id: uid(),
      name: `${original.name} (Copy)`,
      createdAt: now(),
      usageCount: 0,
      links: original.links.map((l) => ({ ...l, id: uid() })),
    };
    save([...load(), copy]);
    return copy;
  },

  delete: (id: string): void => {
    save(load().filter((t) => t.id !== id));
  },

  deleteMany: (ids: string[]): void => {
    save(load().filter((t) => !ids.includes(t.id)));
  },
};

import type { Company, Contacts, Doc } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface DocsService {
  list(): Promise<Pick<Doc, 'slug' | 'title'>[]>;
  get(slug: string): Promise<Doc | null>;
  company(): Promise<{ company: Company; contacts: Contacts }>;
}

const row = (r: { key: string; data: Record<string, unknown>; updated_at: string | null }): Doc => ({
  slug: r.key.slice(4), title: String(r.data.title ?? ''), body: String(r.data.body ?? ''),
  published: r.data.published !== false, sort: Number(r.data.sort ?? 1000), updatedAt: r.updated_at,
});

export const docsService = (db: Db): DocsService => ({
  async list() {
    const { rows } = await db.query(`select key, data, updated_at from content_blocks where key like 'doc.%' and coalesce((data->>'published')::boolean, true)
      order by coalesce((data->>'sort')::int, 1000), key`);
    return rows.map(row).map(({ slug, title }) => ({ slug, title }));
  },
  async get(slug) {
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
    const { rows } = await db.query(`select key, data, updated_at from content_blocks where key = $1 and coalesce((data->>'published')::boolean, true)`, ['doc.' + slug]);
    return rows[0] ? row(rows[0]) : null;
  },
  async company() {
    const { rows } = await db.query(`select key, value from settings where key in ('company','contacts')`);
    const v = (k: string) => (rows.find((r) => r.key === k)?.value ?? {}) as Record<string, string>;
    return { company: v('company') as unknown as Company, contacts: v('contacts') as unknown as Contacts };
  },
});

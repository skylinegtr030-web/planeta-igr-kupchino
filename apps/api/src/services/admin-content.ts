import type { AdminBlock, BlockPatch, SettingsKey } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminContentService {
  settings(): Promise<Record<string, unknown>>;
  putSetting(key: SettingsKey, value: Record<string, unknown>, adminId: string): Promise<void>;
  blocks(): Promise<AdminBlock[]>;
  patchBlock(key: string, p: BlockPatch, adminId: string): Promise<AdminBlock | null>;
  createDoc(slug: string, title: string, adminId: string): Promise<AdminBlock | null>;
}

export const adminContentService = (db: Db): AdminContentService => ({
  async settings() {
    const { rows } = await db.query<{ key: string; value: unknown }>('select key, value from settings order by key');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
  async putSetting(key, value, adminId) {
    await db.query(`insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value`, [key, JSON.stringify(value)]);
    await db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1, 'settings', $2, 'update', $3)`, [adminId, key, JSON.stringify(value)]);
  },
  async blocks() {
    const { rows } = await db.query(`select key, data, updated_at as "updatedAt" from content_blocks where key not like 'legacy.%'
      order by case when key like 'doc.%' then 1 else 0 end, coalesce((data->>'sort')::int, 1000), key`);
    return rows as AdminBlock[];
  },
  async patchBlock(key, p, adminId) {
    const { rows } = await db.query(`update content_blocks set data = data || $2::jsonb where key = $1 returning key, data, updated_at as "updatedAt"`, [key, JSON.stringify(p)]);
    if (!rows[0]) return null;
    await db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1, 'content_block', $2, 'update', $3)`, [adminId, key, JSON.stringify(p)]);
    return rows[0] as AdminBlock;
  },
  async createDoc(slug, title, adminId) {
    const key = 'doc.' + slug;
    const { rows } = await db.query(`insert into content_blocks (key, data) values ($1, $2) on conflict (key) do nothing returning key, data, updated_at as "updatedAt"`,
      [key, JSON.stringify({ kind: 'doc', title, body: '', published: false, sort: 900 })]);
    if (!rows[0]) return null;
    await db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1, 'content_block', $2, 'create', '{}')`, [adminId, key]);
    return rows[0] as AdminBlock;
  },
});

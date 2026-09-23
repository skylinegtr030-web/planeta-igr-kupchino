import type { AdminGallery, MediaPatch } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminMediaService {
  galleries(): Promise<AdminGallery[]>;
  patch(id: string, p: MediaPatch, adminId: string): Promise<boolean>;
}
export const adminMediaService = (db: Db): AdminMediaService => ({
  async galleries() {
    const { rows } = await db.query(`
      select g.slug, g.title,
        coalesce(json_agg(json_build_object('id', m.id, 'src', '/media/' || ltrim(m.storage_path, '/'), 'alt', m.alt,
          'isActive', m.is_active, 'w', m.width, 'h', m.height) order by gm.sort) filter (where m.id is not null), '[]') as images
      from galleries g
      left join gallery_media gm on gm.gallery_id = g.id
      left join media m on m.id = gm.media_id
      left join content_blocks b on b.data->>'gallery' = g.slug
      group by g.id, b.data
      order by coalesce((b.data->>'sort')::int, 1000), g.slug`);
    return rows as AdminGallery[];
  },
  async patch(id, p, adminId) {
    const r = await db.query('update media set is_active = coalesce($2, is_active), alt = coalesce($3, alt) where id = $1',
      [id, p.isActive ?? null, p.alt ?? null]);
    if (!r.rowCount) return false;
    await db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1, 'media', $2, 'update', $3)`,
      [adminId, id, JSON.stringify(p)]);
    return true;
  },
});

import type { Block } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface ContentService { list(): Promise<Block[]> }
export const contentService = (db: Db): ContentService => ({
  async list() {
    const { rows } = await db.query(`
      select b.key, b.data,
        coalesce(json_agg(json_build_object('src', '/media/' || ltrim(m.storage_path, '/'), 'alt', m.alt, 'w', m.width, 'h', m.height)
          order by gm.sort) filter (where m.id is not null), '[]') as images
      from content_blocks b
      left join galleries g on g.slug = b.data->>'gallery'
      left join gallery_media gm on gm.gallery_id = g.id
      left join media m on m.id = gm.media_id and m.is_active
      where coalesce((b.data->>'published')::boolean, true)
      group by b.key, b.data
      order by coalesce((b.data->>'sort')::int, 1000), b.key`);
    return rows as Block[];
  },
});

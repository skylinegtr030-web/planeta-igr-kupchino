import type { Category } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface CatalogService { list(): Promise<Category[]> }
export const catalogService = (db: Db): CatalogService => ({
  async list() {
    const { rows } = await db.query(`
      select c.slug, c.title, c.kind,
        coalesce(json_agg(json_build_object(
          'slug', p.slug, 'title', p.title, 'description', p.description, 'short', p.short_desc,
          'capacity', p.attrs->>'capacity', 'guests', p.guests, 'minAge', p.min_age, 'extendPerHour', (p.attrs->>'extendPerHour')::float8, 'options', coalesce(p.attrs->'options', '[]'::jsonb),
          'features', coalesce(p.attrs->'features', p.attrs->'items', '[]'::jsonb), 'mark', p.attrs->>'mark',
          'priceWeekday', p.price_weekday::float8, 'priceWeekend', p.price_weekend::float8,
          'priceFrom', p.price_from, 'durationMin', nullif(p.duration_min, 0),
          'cover', case when m.id is null then null else '/media/' || ltrim(m.storage_path, '/') end
        ) order by p.sort, p.title) filter (where p.id is not null), '[]') as items
      from categories c
      left join products p on p.category_id = c.id and p.is_published and p.parent_id is null
      left join media m on m.id = p.cover_media_id
      where c.is_published
      group by c.id order by c.sort, c.title`);
    return rows as Category[];
  },
});

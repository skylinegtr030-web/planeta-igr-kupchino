import type { AdminProduct, ProductPatch } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminCatalogService {
  list(): Promise<AdminProduct[]>;
  patch(id: string, p: ProductPatch, adminId: string): Promise<AdminProduct | null>;
}
const SELECT = `select p.id, c.title as category, p.title, p.price_weekday::float8 as "priceWeekday",
  p.price_weekend::float8 as "priceWeekend", p.is_published as "isPublished"
  from products p join categories c on c.id = p.category_id`;

export const adminCatalogService = (db: Db): AdminCatalogService => ({
  async list() {
    const { rows } = await db.query(`${SELECT} order by c.sort, c.title, p.sort, p.title`);
    return rows as AdminProduct[];
  },
  async patch(id, p, adminId) {
    const r = await db.query(
      `update products set title = coalesce($2, title), price_weekday = coalesce($3, price_weekday),
         price_weekend = coalesce($4, price_weekend), is_published = coalesce($5, is_published) where id = $1`,
      [id, p.title ?? null, p.priceWeekday ?? null, p.priceWeekend ?? null, p.isPublished ?? null]);
    if (!r.rowCount) return null;
    await db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1, 'product', $2, 'update', $3)`,
      [adminId, id, JSON.stringify(p)]);
    const { rows } = await db.query(`${SELECT} where p.id = $1`, [id]);
    return (rows[0] as AdminProduct | undefined) ?? null;
  },
});

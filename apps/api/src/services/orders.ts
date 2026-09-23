import type { OrderCreate } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface OrderService { create(o: OrderCreate): Promise<{ id: number }> }
export const orderService = (db: Db): OrderService => ({
  async create(o) {
    const c = await db.connect();
    try {
      await c.query('begin');
      const { rows } = await c.query<{ id: string; number: number }>(
        `insert into orders (customer_name, phone, event_date, guests, comment, consent_at) values ($1,$2,$3,$4,$5, now()) returning id, number`,
        [o.name, o.phone, o.eventDate, o.kids ?? null, o.comment ?? null]);
      const order = rows[0]!;
      const slugs = [o.packageSlug, ...o.extras].filter((s): s is string => Boolean(s));
      if (slugs.length) {
        await c.query(
          `insert into order_items (order_id, product_id, title, qty, unit_price)
           select $1, p.id, p.title, 1,
             case when extract(isodow from $3::date) in (6,7)
                    or exists (select 1 from special_days d where d.day = $3::date and d.kind = 'holiday')
                  then p.price_weekend else p.price_weekday end
           from products p where p.slug = any($2::text[]) and p.is_published`,
          [order.id, slugs, o.eventDate]);
      }
      await c.query(`update orders set subtotal = s.v, total = s.v
        from (select coalesce(sum(sum), 0) v from order_items where order_id = $1) s where id = $1`, [order.id]);
      await c.query(`insert into order_events (order_id, type) values ($1, 'created')`, [order.id]);
      await c.query('commit');
      return { id: order.number };
    } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
  },
});

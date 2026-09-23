import type { AdminOrder, OrderPatch, OrderStatus } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminOrderService {
  list(status?: OrderStatus): Promise<AdminOrder[]>;
  patch(id: string, p: OrderPatch, adminId: string): Promise<AdminOrder | null>;
}
const SELECT = `select o.id, o.number, o.status, o.customer_name as "customerName", o.phone, o.child_name as "childName",
  to_char(o.event_date, 'YYYY-MM-DD') as "eventDate", to_char(o.event_time, 'HH24:MI') as "eventTime", o.comment,
  o.total::float8 as total, o.admin_note as "adminNote", to_char(o.created_at at time zone 'Europe/Moscow', 'YYYY-MM-DD"T"HH24:MI') as "createdAt",
  coalesce((select json_agg(json_build_object('title', i.title, 'qty', i.qty, 'unitPrice', i.unit_price::float8) order by i.id)
            from order_items i where i.order_id = o.id), '[]') as items
  from orders o`;

export const adminOrderService = (db: Db): AdminOrderService => ({
  async list(status) {
    const { rows } = await db.query(`${SELECT} where ($1::text is null or o.status = $1) order by o.created_at desc limit 300`, [status ?? null]);
    return rows as AdminOrder[];
  },
  async patch(id, p, adminId) {
    const c = await db.connect();
    try {
      await c.query('begin');
      const cur = (await c.query<{ status: string; admin_note: string }>('select status, admin_note from orders where id = $1 for update', [id])).rows[0];
      if (!cur) { await c.query('rollback'); return null; }
      await c.query('update orders set status = coalesce($2, status), admin_note = coalesce($3, admin_note) where id = $1',
        [id, p.status ?? null, p.adminNote ?? null]);
      if (p.status && p.status !== cur.status)
        await c.query(`insert into order_events (order_id, admin_id, type, data) values ($1, $2, 'status', $3)`,
          [id, adminId, JSON.stringify({ from: cur.status, to: p.status })]);
      if (p.adminNote !== undefined && p.adminNote !== cur.admin_note)
        await c.query(`insert into order_events (order_id, admin_id, type) values ($1, $2, 'note')`, [id, adminId]);
      await c.query('commit');
    } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
    const { rows } = await db.query(`${SELECT} where o.id = $1`, [id]);
    return (rows[0] as AdminOrder | undefined) ?? null;
  },
});

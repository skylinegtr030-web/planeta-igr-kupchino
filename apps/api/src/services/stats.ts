import { createHash } from 'node:crypto';
import type { Db } from '../db/pool.js';

/** Обезличенная статистика: посетитель = sha256(день + ip + user-agent + соль). Без cookie и без хранения IP. */
export type TrackInput = {
  type: 'pageview' | 'event';
  path: string; referrer?: string; utm?: { source?: string; medium?: string; campaign?: string };
  screenW?: number; name?: string; label?: string;
};
export type StatsRange = 7 | 30 | 90;
export type StatsSummary = {
  range: StatsRange;
  totals: { pageviews: number; visitors: number; orders: number; conversion: number; prevPageviews: number; prevVisitors: number; prevOrders: number };
  days: { day: string; pageviews: number; visitors: number; orders: number }[];
  devices: { device: string; visitors: number }[];
  sources: { source: string; visitors: number }[];
  events: { name: string; label: string | null; count: number }[];
  hours: { hour: number; pageviews: number }[];
  orders: { status: string; count: number; total: number }[];
  popular: { title: string; count: number }[];
};

export interface StatsService {
  track(input: TrackInput, ctx: { ip: string; userAgent: string }): Promise<void>;
  summary(range: StatsRange): Promise<StatsSummary>;
}

const SALT = process.env.STATS_SALT ?? 'planeta-igr';
const visitorId = (ip: string, ua: string) => {
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${day}|${ip}|${ua}|${SALT}`).digest('hex').slice(0, 24);
};
const deviceOf = (ua: string, w?: number) => {
  if (/ipad|tablet/i.test(ua) || (w && w >= 768 && w < 1100 && /mobile|android/i.test(ua))) return 'tablet';
  if (/mobile|iphone|android/i.test(ua) || (w && w < 768)) return 'mobile';
  return 'desktop';
};
const hostOf = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, '') : null; } catch { return null; } };
const clip = (s: string | undefined, n: number) => (s ? s.slice(0, n) : null);

export const statsService = (db: Db): StatsService => ({
  async track(i, ctx) {
    const v = visitorId(ctx.ip, ctx.userAgent);
    if (i.type === 'pageview') {
      await db.query(
        `insert into visits (visitor, path, referrer_host, utm_source, utm_medium, utm_campaign, device, screen_w) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [v, clip(i.path, 200) ?? '/', hostOf(i.referrer), clip(i.utm?.source, 80), clip(i.utm?.medium, 80), clip(i.utm?.campaign, 120), deviceOf(ctx.userAgent, i.screenW), i.screenW ?? null]);
    } else if (i.name) {
      await db.query(`insert into site_events (visitor, name, label, path) values ($1,$2,$3,$4)`, [v, clip(i.name, 60), clip(i.label, 120), clip(i.path, 200)]);
    }
  },
  async summary(range) {
    const since = `now() - interval '${range} days'`;
    const prev = `now() - interval '${range * 2} days'`;
    const [tot, prevTot, days, devices, sources, events, hours, orders, popular] = await Promise.all([
      db.query(`select count(*)::int as pv, count(distinct visitor)::int as uv,
        (select count(*)::int from orders where created_at >= ${since}) as orders from visits where at >= ${since}`),
      db.query(`select count(*)::int as pv, count(distinct visitor)::int as uv,
        (select count(*)::int from orders where created_at >= ${prev} and created_at < ${since}) as orders from visits where at >= ${prev} and at < ${since}`),
      db.query(`with d as (select generate_series(date_trunc('day', ${since}), date_trunc('day', now()), '1 day') as day)
        select to_char(d.day, 'YYYY-MM-DD') as day,
          coalesce((select count(*) from visits v where date_trunc('day', v.at at time zone 'Europe/Moscow') = d.day), 0)::int as pageviews,
          coalesce((select count(distinct visitor) from visits v where date_trunc('day', v.at at time zone 'Europe/Moscow') = d.day), 0)::int as visitors,
          coalesce((select count(*) from orders o where date_trunc('day', o.created_at at time zone 'Europe/Moscow') = d.day), 0)::int as orders
        from d order by d.day`),
      db.query(`select device, count(distinct visitor)::int as visitors from visits where at >= ${since} group by device order by visitors desc`),
      db.query(`select coalesce(utm_source, referrer_host, 'прямые заходы') as source, count(distinct visitor)::int as visitors
        from visits where at >= ${since} group by 1 order by visitors desc limit 10`),
      db.query(`select name, label, count(*)::int as count from site_events where at >= ${since} group by name, label order by count desc limit 20`),
      db.query(`select extract(hour from at at time zone 'Europe/Moscow')::int as hour, count(*)::int as pageviews from visits where at >= ${since} group by 1 order by 1`),
      db.query(`select status, count(*)::int as count, coalesce(sum(total),0)::float8 as total from orders where created_at >= ${since} group by status`),
      db.query(`select i.title, count(*)::int as count from order_items i join orders o on o.id = i.order_id where o.created_at >= ${since} group by i.title order by count desc limit 8`),
    ]);
    const t = tot.rows[0] as { pv: number; uv: number; orders: number };
    const p = prevTot.rows[0] as { pv: number; uv: number; orders: number };
    return {
      range,
      totals: { pageviews: t.pv, visitors: t.uv, orders: t.orders, conversion: t.uv ? Math.round((t.orders / t.uv) * 1000) / 10 : 0, prevPageviews: p.pv, prevVisitors: p.uv, prevOrders: p.orders },
      days: days.rows as StatsSummary['days'], devices: devices.rows as StatsSummary['devices'], sources: sources.rows as StatsSummary['sources'],
      events: events.rows as StatsSummary['events'], hours: hours.rows as StatsSummary['hours'], orders: orders.rows as StatsSummary['orders'], popular: popular.rows as StatsSummary['popular'],
    };
  },
});

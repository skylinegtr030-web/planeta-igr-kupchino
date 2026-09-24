import type { Contacts, Review, SiteSettings } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface SiteService {
  settings(): Promise<Omit<SiteSettings, 'ok'>>;
  reviews(): Promise<Review[]>;
}
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const nums = (o: unknown): Record<string, number> =>
  Object.fromEntries(Object.entries((o ?? {}) as Record<string, unknown>).filter(([, v]) => typeof v === 'number') as [string, number][]);

export const siteService = (db: Db): SiteService => ({
  async settings() {
    const { rows } = await db.query<{ key: string; value: Record<string, unknown> }>(
      `select key, value from settings where key in ('contacts','ages','tiers','booking_rules')`);
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value ?? {}]));
    const c = (s.contacts ?? {}) as Record<string, unknown>;
    const contacts: Contacts = {
      phone: String(c.phone ?? ''), hours: String(c.hours || '10:00–22:00'),
      addressFull: String(c.addressFull || 'Балканская ул., 17, ТРК «Балкания Nova», 3 этаж'), addressShort: String(c.addressShort || 'Купчино · Балкания Nova'),
      mapQuery: String(c.mapQuery || 'Санкт-Петербург, Балканская улица, 17, ТРК Балкания Nova'),
      mapLat: typeof c.mapLat === 'number' ? c.mapLat : null, mapLon: typeof c.mapLon === 'number' ? c.mapLon : null,
    };
    const rules = (s.booking_rules ?? {}) as Record<string, unknown>;
    const weekendDays = Array.isArray(rules.weekendDays) ? rules.weekendDays.map((d) => num(d, 0)) : [0, 6];
    let holidays: string[] = [];
    try {
      const { rows: days } = await db.query<{ d: string }>(
        `select to_char(day, 'YYYY-MM-DD') as d from special_days where kind = 'holiday' and day >= current_date - 1 order by day`);
      holidays = days.map((x) => x.d);
    } catch (e) { console.error('settings: special_days', e); }
    return { contacts, ages: nums(s.ages), tiers: nums(s.tiers), weekendDays, holidays };
  },
  async reviews() {
    const { rows } = await db.query<Review>(
      `select author, text, rating, source from reviews where is_published order by sort, created_at desc limit 12`);
    return rows;
  },
});

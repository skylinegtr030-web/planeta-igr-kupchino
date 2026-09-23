'use strict';
const SQL = `
select p.slug, p.title, (p.bookable is not false) as bookable,
       coalesce(p.price_weekday, pp.price_weekday)::float8 as wd,
       coalesce(p.price_weekend, pp.price_weekend)::float8 as we,
       sw.price as sib
  from products p
  left join products pp on pp.id = p.parent_id
  left join lateral (
    select coalesce(s.price_weekday, s.price_weekend)::float8 as price from products s
     where p.day_type = 'weekday' and s.parent_id = p.parent_id
       and s.day_type = 'weekend' and s.id <> p.id limit 1) sw on true
 where p.slug = any($1::text[])`;

async function quote(pool, sel) {
  sel = sel || {};
  const str = x => (typeof x === 'string' ? x.trim().slice(0, 64) : '');
  const qtys = new Map();
  const pack = str(sel.pack), room = str(sel.room);
  if (pack) qtys.set(pack, 1); else if (room) qtys.set(room, 1);
  for (const e of Array.isArray(sel.extras) ? sel.extras.slice(0, 60) : []) {
    const slug = str(e && e.slug);
    const q = Math.max(0, Math.min(30, parseInt(e && e.qty, 10) || 0));
    if (slug && q) qtys.set(slug, (qtys.get(slug) || 0) + q);
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sel.date || '') ? sel.date : null;
  let weekend = false, dayKind = null;
  if (date) {
    const dow = new Date(date + 'T12:00:00Z').getUTCDay();
    weekend = dow === 0 || dow === 6;
    const r = await pool.query('select kind from special_days where day = $1', [date]);
    dayKind = r.rows[0] ? r.rows[0].kind : null;
    if (dayKind === 'holiday') weekend = true;
  }
  const items = [], unknown = [];
  let subtotal = 0;
  const slugs = [...qtys.keys()];
  if (slugs.length) {
    const { rows } = await pool.query(SQL, [slugs]);
    const by = new Map(rows.map(r => [r.slug, r]));
    for (const slug of slugs) {
      const r = by.get(slug);
      if (!r || !r.bookable || r.wd == null) { unknown.push(slug); continue; }
      const price = weekend ? (r.sib ?? r.we ?? r.wd) : r.wd;
      const qty = qtys.get(slug);
      items.push({ slug, title: r.title, qty, price, sum: price * qty });
      subtotal += price * qty;
    }
  }
  let discount = 0, promo = null, promoError = null;
  const code = str(sel.promo).toUpperCase();
  if (code) {
    const { rows } = await pool.query(
      `select code, kind, value::float8 as v, min_total::float8 as mt from promo_codes
        where upper(code) = $1 and active
          and (valid_from is null or valid_from <= current_date)
          and (valid_to is null or valid_to >= current_date)
          and (max_uses is null or used_count < max_uses)`, [code]);
    const p = rows[0];
    if (!p) promoError = 'invalid';
    else if (subtotal < p.mt) promoError = 'min_total';
    else {
      discount = Math.min(subtotal, p.kind === 'percent' ? Math.round(subtotal * p.v / 100) : p.v);
      promo = p.code;
    }
  }
  return { date, weekend, dayKind, items, unknown, subtotal, discount, total: subtotal - discount, promo, promoError };
}
module.exports = { quote };

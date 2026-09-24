import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type {
  AdminCategory, AdminProductFull, AdminPromo, AdminReview, AdminUser, AuditEntry, BlockCreate, CategoryInput, ProductInput, ProductInputPatch,
  PromoInput, ReviewInput, SpecialDayInput, AdminUserInput, AdminUserPatch, AdminImage,
} from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminV2Service {
  // каталог
  categories(): Promise<AdminCategory[]>;
  createCategory(i: CategoryInput, adminId: string): Promise<AdminCategory>;
  patchCategory(id: string, i: Partial<CategoryInput>, adminId: string): Promise<AdminCategory | null>;
  deleteCategory(id: string, adminId: string): Promise<'ok' | 'not_found' | 'has_products'>;
  products(): Promise<AdminProductFull[]>;
  createProduct(i: ProductInput, adminId: string): Promise<AdminProductFull>;
  patchProduct(id: string, i: ProductInputPatch, adminId: string): Promise<AdminProductFull | null>;
  deleteProduct(id: string, adminId: string): Promise<boolean>;
  // фото
  upload(gallerySlug: string, file: { buffer: Buffer; filename: string; mime: string }, adminId: string): Promise<AdminImage | null>;
  reorder(gallerySlug: string, mediaIds: string[], adminId: string): Promise<boolean>;
  detach(gallerySlug: string, mediaId: string, adminId: string): Promise<boolean>;
  deleteMedia(mediaId: string, adminId: string): Promise<boolean>;
  createGallery(slug: string, title: string, adminId: string): Promise<boolean>;
  setBlockGallery(key: string, gallery: string, adminId: string): Promise<boolean>;
  createBlock(i: BlockCreate, adminId: string): Promise<boolean>;
  deleteBlock(key: string, adminId: string): Promise<boolean>;
  // контент
  reviews(): Promise<AdminReview[]>;
  createReview(i: ReviewInput, adminId: string): Promise<AdminReview>;
  patchReview(id: string, i: Partial<ReviewInput>, adminId: string): Promise<AdminReview | null>;
  deleteReview(id: string, adminId: string): Promise<boolean>;
  promos(): Promise<AdminPromo[]>;
  upsertPromo(i: PromoInput, adminId: string): Promise<AdminPromo>;
  deletePromo(code: string, adminId: string): Promise<boolean>;
  specialDays(): Promise<SpecialDayInput[]>;
  upsertSpecialDay(i: SpecialDayInput, adminId: string): Promise<void>;
  deleteSpecialDay(day: string, adminId: string): Promise<boolean>;
  // заявки
  orderEvents(orderId: string): Promise<{ type: string; data: unknown; at: string; admin: string | null }[]>;
  deleteOrder(id: string, adminId: string): Promise<boolean>;
  // пользователи и журнал
  users(): Promise<AdminUser[]>;
  createUser(i: AdminUserInput, adminId: string): Promise<AdminUser | null>;
  patchUser(id: string, i: AdminUserPatch, adminId: string): Promise<AdminUser | null>;
  audit(limit: number): Promise<AuditEntry[]>;
}

const CAT = `select c.id, c.slug, c.title, c.kind, c.description, c.is_published as "isPublished", c.sort,
  (select count(*)::int from products p where p.category_id = c.id) as "productCount" from categories c`;
const PROD = `select p.id, p.category_id as "categoryId", c.title as category, c.kind as "categoryKind", p.slug, p.title, p.short_desc as "shortDesc", p.description, p.badge,
  p.price_weekday::float8 as "priceWeekday", p.price_weekend::float8 as "priceWeekend", p.price_from as "priceFrom", p.duration_min as "durationMin",
  p.guests, p.min_age as "minAge", p.attrs->>'capacity' as capacity, (p.attrs->>'extendPerHour')::float8 as "extendPerHour",
  coalesce(p.attrs->'features', p.attrs->'items', '[]'::jsonb) as features, coalesce(p.attrs->'options', '[]'::jsonb) as options,
  p.cover_media_id as "coverMediaId", case when m.id is null then null else '/media/' || ltrim(m.storage_path, '/') end as cover,
  p.is_published as "isPublished", p.sort, to_char(p.updated_at at time zone 'Europe/Moscow', 'YYYY-MM-DD"T"HH24:MI') as "updatedAt"
  from products p join categories c on c.id = p.category_id left join media m on m.id = p.cover_media_id`;
const REV = `select id, author, text, rating, source, is_published as "isPublished", sort, to_char(created_at at time zone 'Europe/Moscow', 'YYYY-MM-DD') as "createdAt" from reviews`;
const PROMO = `select code::text as code, kind, value::float8 as value, min_total::float8 as "minTotal", to_char(valid_from, 'YYYY-MM-DD') as "validFrom", to_char(valid_to, 'YYYY-MM-DD') as "validTo",
  max_uses as "maxUses", used_count as "usedCount", active from promo_codes`;
const USER = `select id, email::text as email, role, is_active as "isActive", to_char(last_login_at at time zone 'Europe/Moscow', 'YYYY-MM-DD HH24:MI') as "lastLoginAt",
  to_char(created_at at time zone 'Europe/Moscow', 'YYYY-MM-DD') as "createdAt" from admins`;

const translit = (s: string) => {
  const map: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  return s.toLowerCase().split('').map((c) => map[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'item';
};

export const adminV2Service = (db: Db, uploadsDir: string): AdminV2Service => {
  const log = (adminId: string, entity: string, entityId: string | null, action: string, diff: unknown = {}) =>
    db.query(`insert into audit_log (admin_id, entity, entity_id, action, diff) values ($1,$2,$3,$4,$5)`, [adminId, entity, entityId, action, JSON.stringify(diff)]);
  const uniqueSlug = async (table: 'products' | 'categories' | 'galleries', base: string) => {
    let s = base, n = 2;
    while ((await db.query(`select 1 from ${table} where slug = $1`, [s])).rowCount) s = `${base}-${n++}`;
    return s;
  };
  const attrs = (i: Partial<ProductInput>) => {
    const a: Record<string, unknown> = {};
    if (i.features !== undefined) a.features = i.features;
    if (i.options !== undefined) a.options = i.options;
    if (i.capacity !== undefined) a.capacity = i.capacity;
    if (i.extendPerHour !== undefined) a.extendPerHour = i.extendPerHour;
    return a;
  };

  return {
    async categories() { return (await db.query(`${CAT} order by c.sort, c.title`)).rows as AdminCategory[]; },
    async createCategory(i, adminId) {
      const slug = await uniqueSlug('categories', i.slug ?? translit(i.title));
      const { rows } = await db.query(`insert into categories (slug, title, kind, description, is_published, sort) values ($1,$2,$3,$4,$5,$6) returning id`, [slug, i.title, i.kind, i.description, i.isPublished, i.sort]);
      await log(adminId, 'category', rows[0].id, 'create', i);
      return (await db.query(`${CAT} where c.id = $1`, [rows[0].id])).rows[0] as AdminCategory;
    },
    async patchCategory(id, i, adminId) {
      const r = await db.query(`update categories set title = coalesce($2, title), kind = coalesce($3, kind), description = coalesce($4, description),
        is_published = coalesce($5, is_published), sort = coalesce($6, sort), slug = coalesce($7, slug) where id = $1`,
        [id, i.title ?? null, i.kind ?? null, i.description ?? null, i.isPublished ?? null, i.sort ?? null, i.slug ?? null]);
      if (!r.rowCount) return null;
      await log(adminId, 'category', id, 'update', i);
      return (await db.query(`${CAT} where c.id = $1`, [id])).rows[0] as AdminCategory;
    },
    async deleteCategory(id, adminId) {
      if ((await db.query('select 1 from products where category_id = $1 limit 1', [id])).rowCount) return 'has_products';
      const r = await db.query('delete from categories where id = $1', [id]);
      if (!r.rowCount) return 'not_found';
      await log(adminId, 'category', id, 'delete');
      return 'ok';
    },
    async products() { return (await db.query(`${PROD} where p.parent_id is null order by c.sort, c.title, p.sort, p.title`)).rows as AdminProductFull[]; },
    async createProduct(i, adminId) {
      const slug = await uniqueSlug('products', i.slug ?? translit(i.title));
      const { rows } = await db.query(`insert into products (category_id, slug, title, short_desc, description, badge, price_weekday, price_weekend, price_from, duration_min, guests, min_age, cover_media_id, attrs, is_published, sort, updated_by)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning id`,
        [i.categoryId, slug, i.title, i.shortDesc, i.description, i.badge, i.priceWeekday, i.priceWeekend, i.priceFrom, i.durationMin, i.guests, i.minAge, i.coverMediaId,
          JSON.stringify({ ...attrs(i), mark: i.badge ?? undefined }), i.isPublished, i.sort, adminId]);
      await log(adminId, 'product', rows[0].id, 'create', i);
      return (await db.query(`${PROD} where p.id = $1`, [rows[0].id])).rows[0] as AdminProductFull;
    },
    async patchProduct(id, i, adminId) {
      const a = attrs(i); if (i.badge !== undefined) a.mark = i.badge;
      const r = await db.query(`update products set category_id = coalesce($2, category_id), title = coalesce($3, title), short_desc = coalesce($4, short_desc), description = coalesce($5, description),
        badge = case when $6::boolean then $7 else badge end, price_weekday = coalesce($8, price_weekday), price_weekend = coalesce($9, price_weekend), price_from = coalesce($10, price_from),
        duration_min = coalesce($11, duration_min), guests = case when $12::boolean then $13 else guests end, min_age = case when $14::boolean then $15 else min_age end,
        cover_media_id = case when $16::boolean then $17::uuid else cover_media_id end, attrs = attrs || $18::jsonb, is_published = coalesce($19, is_published), sort = coalesce($20, sort),
        slug = coalesce($21, slug), updated_by = $22 where id = $1`,
        [id, i.categoryId ?? null, i.title ?? null, i.shortDesc ?? null, i.description ?? null, i.badge !== undefined, i.badge ?? null, i.priceWeekday ?? null, i.priceWeekend ?? null, i.priceFrom ?? null,
          i.durationMin ?? null, i.guests !== undefined, i.guests ?? null, i.minAge !== undefined, i.minAge ?? null, i.coverMediaId !== undefined, i.coverMediaId ?? null, JSON.stringify(a),
          i.isPublished ?? null, i.sort ?? null, i.slug ?? null, adminId]);
      if (!r.rowCount) return null;
      await log(adminId, 'product', id, 'update', i);
      return (await db.query(`${PROD} where p.id = $1`, [id])).rows[0] as AdminProductFull;
    },
    async deleteProduct(id, adminId) {
      const r = await db.query('delete from products where id = $1', [id]);
      if (r.rowCount) await log(adminId, 'product', id, 'delete');
      return Boolean(r.rowCount);
    },

    async upload(gallerySlug, file, adminId) {
      const g = (await db.query<{ id: string }>('select id from galleries where slug = $1', [gallerySlug])).rows[0];
      if (!g) return null;
      const ext = file.mime === 'image/png' ? 'png' : file.mime === 'image/webp' ? 'webp' : 'jpeg';
      let width: number | null = null, height: number | null = null, buf = file.buffer;
      try {
        const sharp = (await import('sharp')).default;
        const img = sharp(file.buffer).rotate();
        const meta = await img.metadata();
        if ((meta.width ?? 0) > 2400) buf = Buffer.from(await img.resize({ width: 2400, withoutEnlargement: true }).toFormat(ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg', { quality: 88 }).toBuffer());
        const m2 = await sharp(buf).metadata(); width = m2.width ?? null; height = m2.height ?? null;
      } catch { /* sharp недоступен — сохраняем как есть */ }
      const folder = gallerySlug;
      const rel = `${folder}/${randomUUID()}.${ext}`;
      await mkdir(resolve(uploadsDir, folder), { recursive: true });
      await writeFile(join(uploadsDir, rel), buf);
      const alt = file.filename.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 200);
      const { rows } = await db.query<{ id: string }>(`insert into media (storage_path, alt, folder, mime, width, height, bytes, is_active) values ($1,$2,$3,$4,$5,$6,$7,true) returning id`,
        [rel, alt, folder, `image/${ext}`, width, height, buf.length]);
      const id = rows[0]!.id;
      await db.query(`insert into gallery_media (gallery_id, media_id, sort) values ($1, $2, coalesce((select max(sort) + 10 from gallery_media where gallery_id = $1), 0))`, [g.id, id]);
      await log(adminId, 'media', id, 'upload', { gallery: gallerySlug, rel });
      return { id, src: '/media/' + rel, alt, isActive: true, w: width, h: height };
    },
    async reorder(gallerySlug, mediaIds, adminId) {
      const g = (await db.query<{ id: string }>('select id from galleries where slug = $1', [gallerySlug])).rows[0];
      if (!g) return false;
      const c = await db.connect();
      try {
        await c.query('begin');
        for (let k = 0; k < mediaIds.length; k++) await c.query('update gallery_media set sort = $3 where gallery_id = $1 and media_id = $2', [g.id, mediaIds[k], k * 10]);
        await c.query('commit');
      } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
      await log(adminId, 'gallery', gallerySlug, 'reorder', { count: mediaIds.length });
      return true;
    },
    async detach(gallerySlug, mediaId, adminId) {
      const r = await db.query('delete from gallery_media gm using galleries g where g.id = gm.gallery_id and g.slug = $1 and gm.media_id = $2', [gallerySlug, mediaId]);
      if (r.rowCount) await log(adminId, 'gallery', gallerySlug, 'detach', { mediaId });
      return Boolean(r.rowCount);
    },
    async deleteMedia(mediaId, adminId) {
      const m = (await db.query<{ storage_path: string }>('delete from media where id = $1 returning storage_path', [mediaId])).rows[0];
      if (!m) return false;
      await unlink(join(uploadsDir, m.storage_path)).catch(() => undefined);
      await log(adminId, 'media', mediaId, 'delete', { path: m.storage_path });
      return true;
    },
    async createGallery(slug, title, adminId) {
      const r = await db.query('insert into galleries (slug, title) values ($1, $2) on conflict (slug) do nothing', [slug, title]);
      if (r.rowCount) await log(adminId, 'gallery', slug, 'create', { title });
      return Boolean(r.rowCount);
    },
    async setBlockGallery(key, gallery, adminId) {
      const r = await db.query(`update content_blocks set data = data || jsonb_build_object('gallery', $2::text) where key = $1`, [key, gallery]);
      if (r.rowCount) await log(adminId, 'content_block', key, 'gallery', { gallery });
      return Boolean(r.rowCount);
    },
    async createBlock(i, adminId) {
      const gallery = i.gallery ?? (i.kind === 'zone' ? i.key.replace(/^park\./, 'park-') : '');
      if (gallery) await db.query('insert into galleries (slug, title) values ($1, $2) on conflict (slug) do nothing', [gallery, i.title]);
      const r = await db.query('insert into content_blocks (key, data) values ($1, $2) on conflict (key) do nothing',
        [i.key, JSON.stringify({ title: i.title, kind: i.kind, gallery, sort: 500, text: '', body: '', published: false })]);
      if (r.rowCount) await log(adminId, 'content_block', i.key, 'create', i);
      return Boolean(r.rowCount);
    },
    async deleteBlock(key, adminId) {
      const r = await db.query('delete from content_blocks where key = $1 and key not in (\'park.hero\')', [key]);
      if (r.rowCount) await log(adminId, 'content_block', key, 'delete');
      return Boolean(r.rowCount);
    },

    async reviews() { return (await db.query(`${REV} order by sort, created_at desc`)).rows as AdminReview[]; },
    async createReview(i, adminId) {
      const { rows } = await db.query('insert into reviews (author, text, rating, source, is_published, sort) values ($1,$2,$3,$4,$5,$6) returning id', [i.author, i.text, i.rating, i.source, i.isPublished, i.sort]);
      await log(adminId, 'review', rows[0].id, 'create', i);
      return (await db.query(`${REV} where id = $1`, [rows[0].id])).rows[0] as AdminReview;
    },
    async patchReview(id, i, adminId) {
      const r = await db.query(`update reviews set author = coalesce($2, author), text = coalesce($3, text), rating = coalesce($4, rating), source = case when $5::boolean then $6 else source end,
        is_published = coalesce($7, is_published), sort = coalesce($8, sort) where id = $1`, [id, i.author ?? null, i.text ?? null, i.rating ?? null, i.source !== undefined, i.source ?? null, i.isPublished ?? null, i.sort ?? null]);
      if (!r.rowCount) return null;
      await log(adminId, 'review', id, 'update', i);
      return (await db.query(`${REV} where id = $1`, [id])).rows[0] as AdminReview;
    },
    async deleteReview(id, adminId) { const r = await db.query('delete from reviews where id = $1', [id]); if (r.rowCount) await log(adminId, 'review', id, 'delete'); return Boolean(r.rowCount); },

    async promos() { return (await db.query(`${PROMO} order by active desc, code`)).rows as AdminPromo[]; },
    async upsertPromo(i, adminId) {
      await db.query(`insert into promo_codes (code, kind, value, min_total, valid_from, valid_to, max_uses, active) values ($1,$2,$3,$4,$5,$6,$7,$8)
        on conflict (code) do update set kind = excluded.kind, value = excluded.value, min_total = excluded.min_total, valid_from = excluded.valid_from, valid_to = excluded.valid_to, max_uses = excluded.max_uses, active = excluded.active`,
        [i.code, i.kind, i.value, i.minTotal, i.validFrom, i.validTo, i.maxUses, i.active]);
      await log(adminId, 'promo', i.code, 'upsert', i);
      return (await db.query(`${PROMO} where code = $1`, [i.code])).rows[0] as AdminPromo;
    },
    async deletePromo(code, adminId) { const r = await db.query('delete from promo_codes where code = $1', [code]); if (r.rowCount) await log(adminId, 'promo', code, 'delete'); return Boolean(r.rowCount); },

    async specialDays() {
      return (await db.query(`select to_char(day, 'YYYY-MM-DD') as day, kind, to_char(open_time, 'HH24:MI') as "openTime", to_char(close_time, 'HH24:MI') as "closeTime", note from special_days where day >= current_date - 30 order by day`)).rows as SpecialDayInput[];
    },
    async upsertSpecialDay(i, adminId) {
      await db.query(`insert into special_days (day, kind, open_time, close_time, note) values ($1,$2,$3,$4,$5) on conflict (day) do update set kind = excluded.kind, open_time = excluded.open_time, close_time = excluded.close_time, note = excluded.note`,
        [i.day, i.kind, i.openTime, i.closeTime, i.note]);
      await log(adminId, 'special_day', i.day, 'upsert', i);
    },
    async deleteSpecialDay(day, adminId) { const r = await db.query('delete from special_days where day = $1', [day]); if (r.rowCount) await log(adminId, 'special_day', day, 'delete'); return Boolean(r.rowCount); },

    async orderEvents(orderId) {
      return (await db.query(`select e.type, e.data, to_char(e.at at time zone 'Europe/Moscow', 'YYYY-MM-DD HH24:MI') as at, a.email::text as admin
        from order_events e left join admins a on a.id = e.admin_id where e.order_id = $1 order by e.at`, [orderId])).rows as { type: string; data: unknown; at: string; admin: string | null }[];
    },
    async deleteOrder(id, adminId) { const r = await db.query('delete from orders where id = $1', [id]); if (r.rowCount) await log(adminId, 'order', id, 'delete'); return Boolean(r.rowCount); },

    async users() { return (await db.query(`${USER} order by created_at`)).rows as AdminUser[]; },
    async createUser(i, adminId) {
      const hash = await bcrypt.hash(i.password, 10);
      const { rows } = await db.query('insert into admins (email, pass_hash, role) values ($1,$2,$3) on conflict (email) do nothing returning id', [i.email, hash, i.role]);
      if (!rows[0]) return null;
      await log(adminId, 'admin', rows[0].id, 'create', { email: i.email, role: i.role });
      return (await db.query(`${USER} where id = $1`, [rows[0].id])).rows[0] as AdminUser;
    },
    async patchUser(id, i, adminId) {
      const hash = i.password ? await bcrypt.hash(i.password, 10) : null;
      const r = await db.query('update admins set role = coalesce($2, role), is_active = coalesce($3, is_active), pass_hash = coalesce($4, pass_hash) where id = $1', [id, i.role ?? null, i.isActive ?? null, hash]);
      if (!r.rowCount) return null;
      if (hash) await db.query('delete from admin_sessions where admin_id = $1', [id]);
      await log(adminId, 'admin', id, 'update', { role: i.role, isActive: i.isActive, password: Boolean(i.password) });
      return (await db.query(`${USER} where id = $1`, [id])).rows[0] as AdminUser;
    },
    async audit(limit) {
      return (await db.query(`select l.id, a.email::text as admin, l.entity, l.entity_id as "entityId", l.action, l.diff, to_char(l.at at time zone 'Europe/Moscow', 'YYYY-MM-DD HH24:MI') as at
        from audit_log l left join admins a on a.id = l.admin_id order by l.id desc limit $1`, [limit])).rows as AuditEntry[];
    },
  };
};

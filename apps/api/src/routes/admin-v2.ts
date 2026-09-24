import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { z } from 'zod';
import {
  AdminUserInput, AdminUserPatch, BlockCreate, BlockGallery, CategoryInput, GalleryInput, GalleryOrder, ProductInput, ProductInputPatch, PromoInput, ReviewInput, SpecialDayInput,
} from '@pi/shared';
import type { AuthService } from '../services/auth.js';
import type { AdminV2Service } from '../services/admin-v2.js';
import type { StatsService } from '../services/stats.js';
import { fieldErrors } from './public.js';

const COOKIE = 'pi_session';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type IdReq = { Params: { id: string } };
type SlugReq = { Params: { slug: string } };

export default function adminV2Routes(d: { auth: AuthService; v2: AdminV2Service; stats?: StatsService }) {
  return async (app: FastifyInstance) => {
    await app.register(fastifyMultipart, { limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
    app.addHook('preHandler', async (req, reply) => {
      const token = req.cookies[COOKIE];
      const admin = token ? await d.auth.session(token) : null;
      if (!admin) return reply.code(401).send({ ok: false, error: 'unauthorized' });
      req.admin = admin;
    });
    const bad = (issues: { path: (string | number)[]; message: string }[]) => ({ ok: false, error: 'validation', fields: fieldErrors(issues) });
    const nf = { ok: false, error: 'not_found' };
    const owner = (req: { admin?: { role: string } | null }) => req.admin?.role === 'owner';
    const parse = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }): T | undefined => {
      const p = schema.safeParse(body);
      if (!p.success) { reply.code(422).send(bad(p.error.issues)); return undefined; }
      return p.data;
    };

    // ── статистика ──
    app.get('/api/admin/stats', async (req, reply) => {
      if (!d.stats) return reply.code(503).send({ ok: false, error: 'stats_disabled' });
      const q = z.object({ range: z.coerce.number().refine((n) => [7, 30, 90].includes(n)).default(30) }).safeParse(req.query);
      if (!q.success) return reply.code(422).send(bad(q.error.issues));
      return { ok: true, ...(await d.stats.summary(q.data.range as 7 | 30 | 90)) };
    });

    // ── категории ──
    app.get('/api/admin/categories', async () => ({ ok: true, categories: await d.v2.categories() }));
    app.post('/api/admin/categories', async (req, reply) => { const i = parse(CategoryInput, req.body, reply); if (!i) return; return reply.code(201).send({ ok: true, category: await d.v2.createCategory(i, req.admin!.id) }); });
    app.patch<IdReq>('/api/admin/categories/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      const i = parse(CategoryInput.partial(), req.body, reply); if (!i) return;
      const c = await d.v2.patchCategory(req.params.id, i, req.admin!.id); return c ? { ok: true, category: c } : reply.code(404).send(nf);
    });
    app.delete<IdReq>('/api/admin/categories/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      const r = await d.v2.deleteCategory(req.params.id, req.admin!.id);
      return r === 'ok' ? { ok: true } : r === 'has_products' ? reply.code(409).send({ ok: false, error: 'has_products' }) : reply.code(404).send(nf);
    });

    // ── товары ──
    app.get('/api/admin/products/full', async () => ({ ok: true, products: await d.v2.products() }));
    app.post('/api/admin/products', async (req, reply) => { const i = parse(ProductInput, req.body, reply); if (!i) return; return reply.code(201).send({ ok: true, product: await d.v2.createProduct(i, req.admin!.id) }); });
    app.patch<IdReq>('/api/admin/products/:id/full', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      const i = parse(ProductInputPatch, req.body, reply); if (!i) return;
      const p = await d.v2.patchProduct(req.params.id, i, req.admin!.id); return p ? { ok: true, product: p } : reply.code(404).send(nf);
    });
    app.delete<IdReq>('/api/admin/products/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      return (await d.v2.deleteProduct(req.params.id, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf);
    });

    // ── фото ──
    app.post<SlugReq>('/api/admin/galleries/:slug/upload', async (req, reply) => {
      const file = await req.file();
      if (!file) return reply.code(422).send({ ok: false, error: 'no_file' });
      if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return reply.code(422).send({ ok: false, error: 'bad_type' });
      const buffer = await file.toBuffer();
      const img = await d.v2.upload(req.params.slug, { buffer, filename: file.filename, mime: file.mimetype }, req.admin!.id);
      return img ? reply.code(201).send({ ok: true, image: img }) : reply.code(404).send(nf);
    });
    app.put<SlugReq>('/api/admin/galleries/:slug/order', async (req, reply) => {
      const i = parse(GalleryOrder, req.body, reply); if (!i) return;
      return (await d.v2.reorder(req.params.slug, i.mediaIds, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf);
    });
    app.delete<{ Params: { slug: string; id: string } }>('/api/admin/galleries/:slug/media/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      return (await d.v2.detach(req.params.slug, req.params.id, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf);
    });
    app.delete<IdReq>('/api/admin/media/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      return (await d.v2.deleteMedia(req.params.id, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf);
    });
    app.post('/api/admin/galleries', async (req, reply) => {
      const i = parse(GalleryInput, req.body, reply); if (!i) return;
      return (await d.v2.createGallery(i.slug, i.title, req.admin!.id)) ? reply.code(201).send({ ok: true }) : reply.code(409).send({ ok: false, error: 'exists' });
    });
    app.put<{ Params: { key: string } }>('/api/admin/blocks/:key/gallery', async (req, reply) => {
      const i = parse(BlockGallery, req.body, reply); if (!i) return;
      return (await d.v2.setBlockGallery(req.params.key, i.gallery, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf);
    });
    app.post('/api/admin/blocks', async (req, reply) => {
      const i = parse(BlockCreate, req.body, reply); if (!i) return;
      return (await d.v2.createBlock(i, req.admin!.id)) ? reply.code(201).send({ ok: true }) : reply.code(409).send({ ok: false, error: 'exists' });
    });
    app.delete<{ Params: { key: string } }>('/api/admin/blocks/:key', async (req, reply) => (await d.v2.deleteBlock(req.params.key, req.admin!.id)) ? { ok: true } : reply.code(404).send(nf));

    // ── отзывы, промокоды, особые дни ──
    app.get('/api/admin/reviews', async () => ({ ok: true, reviews: await d.v2.reviews() }));
    app.post('/api/admin/reviews', async (req, reply) => { const i = parse(ReviewInput, req.body, reply); if (!i) return; return reply.code(201).send({ ok: true, review: await d.v2.createReview(i, req.admin!.id) }); });
    app.patch<IdReq>('/api/admin/reviews/:id', async (req, reply) => {
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      const i = parse(ReviewInput.partial(), req.body, reply); if (!i) return;
      const r = await d.v2.patchReview(req.params.id, i, req.admin!.id); return r ? { ok: true, review: r } : reply.code(404).send(nf);
    });
    app.delete<IdReq>('/api/admin/reviews/:id', async (req, reply) => (UUID.test(req.params.id) && (await d.v2.deleteReview(req.params.id, req.admin!.id))) ? { ok: true } : reply.code(404).send(nf));

    app.get('/api/admin/promos', async () => ({ ok: true, promos: await d.v2.promos() }));
    app.put('/api/admin/promos', async (req, reply) => { const i = parse(PromoInput, req.body, reply); if (!i) return; return { ok: true, promo: await d.v2.upsertPromo(i, req.admin!.id) }; });
    app.delete<{ Params: { code: string } }>('/api/admin/promos/:code', async (req, reply) => (await d.v2.deletePromo(req.params.code.toUpperCase(), req.admin!.id)) ? { ok: true } : reply.code(404).send(nf));

    app.get('/api/admin/special-days', async () => ({ ok: true, days: await d.v2.specialDays() }));
    app.put('/api/admin/special-days', async (req, reply) => { const i = parse(SpecialDayInput, req.body, reply); if (!i) return; await d.v2.upsertSpecialDay(i, req.admin!.id); return { ok: true }; });
    app.delete<{ Params: { day: string } }>('/api/admin/special-days/:day', async (req, reply) => (/^\d{4}-\d{2}-\d{2}$/.test(req.params.day) && (await d.v2.deleteSpecialDay(req.params.day, req.admin!.id))) ? { ok: true } : reply.code(404).send(nf));

    // ── заявки: история и удаление ──
    app.get<IdReq>('/api/admin/orders/:id/events', async (req, reply) => UUID.test(req.params.id) ? { ok: true, events: await d.v2.orderEvents(req.params.id) } : reply.code(404).send(nf));
    app.delete<IdReq>('/api/admin/orders/:id', async (req, reply) => {
      if (!owner(req)) return reply.code(403).send({ ok: false, error: 'forbidden' });
      return (UUID.test(req.params.id) && (await d.v2.deleteOrder(req.params.id, req.admin!.id))) ? { ok: true } : reply.code(404).send(nf);
    });

    // ── пользователи и журнал (только владелец) ──
    app.get('/api/admin/users', async (req, reply) => owner(req) ? { ok: true, users: await d.v2.users() } : reply.code(403).send({ ok: false, error: 'forbidden' }));
    app.post('/api/admin/users', async (req, reply) => {
      if (!owner(req)) return reply.code(403).send({ ok: false, error: 'forbidden' });
      const i = parse(AdminUserInput, req.body, reply); if (!i) return;
      const u = await d.v2.createUser(i, req.admin!.id); return u ? reply.code(201).send({ ok: true, user: u }) : reply.code(409).send({ ok: false, error: 'exists' });
    });
    app.patch<IdReq>('/api/admin/users/:id', async (req, reply) => {
      if (!owner(req)) return reply.code(403).send({ ok: false, error: 'forbidden' });
      if (!UUID.test(req.params.id)) return reply.code(404).send(nf);
      const i = parse(AdminUserPatch, req.body, reply); if (!i) return;
      const u = await d.v2.patchUser(req.params.id, i, req.admin!.id); return u ? { ok: true, user: u } : reply.code(404).send(nf);
    });
    app.get('/api/admin/audit', async (req, reply) => owner(req) ? { ok: true, entries: await d.v2.audit(200) } : reply.code(403).send({ ok: false, error: 'forbidden' }));
  };
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LoginInput, MediaPatch, OrderPatch, OrderStatus, ProductPatch } from '@pi/shared';
import type { AuthService } from '../services/auth.js';
import type { AdminOrderService } from '../services/admin-orders.js';
import type { AdminCatalogService } from '../services/admin-catalog.js';
import type { AdminMediaService } from '../services/admin-media.js';
import { fieldErrors } from './public.js';

const COOKIE = 'pi_session';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type IdReq = { Params: { id: string } };

export interface AdminDeps {
  auth: AuthService; orders: AdminOrderService; catalog: AdminCatalogService; media: AdminMediaService; secureCookies: boolean;
}

export default function adminRoutes(d: AdminDeps) {
  return async (app: FastifyInstance) => {
    const attempts = new Map<string, { n: number; until: number }>();

    app.post('/api/admin/login', async (req, reply) => {
      const now = Date.now();
      const a = attempts.get(req.ip);
      if (a && a.until > now && a.n >= 10) return reply.code(429).send({ ok: false, error: 'too_many_attempts' });
      const p = LoginInput.safeParse(req.body);
      if (!p.success) return reply.code(422).send({ ok: false, error: 'validation', fields: fieldErrors(p.error.issues) });
      const r = await d.auth.login(p.data.email, p.data.password, { ip: req.ip, userAgent: req.headers['user-agent'] ?? '' });
      if (!r) {
        const cur = a && a.until > now ? a : { n: 0, until: now + 15 * 60_000 };
        cur.n += 1;
        attempts.set(req.ip, cur);
        return reply.code(401).send({ ok: false, error: 'invalid_credentials' });
      }
      attempts.delete(req.ip);
      reply.setCookie(COOKIE, r.token, { httpOnly: true, sameSite: 'strict', secure: d.secureCookies, path: '/', maxAge: 30 * 24 * 3600 });
      return { ok: true, admin: r.admin };
    });

    app.register(async (priv) => {
      priv.addHook('preHandler', async (req, reply) => {
        const token = req.cookies[COOKIE];
        const admin = token ? await d.auth.session(token) : null;
        if (!admin) return reply.code(401).send({ ok: false, error: 'unauthorized' });
        req.admin = admin;
      });
      const bad = (issues: { path: (string | number)[]; message: string }[]) => ({ ok: false, error: 'validation', fields: fieldErrors(issues) });

      priv.get('/api/admin/me', async (req) => ({ ok: true, admin: req.admin }));
      priv.post('/api/admin/logout', async (req, reply) => {
        const token = req.cookies[COOKIE];
        if (token) await d.auth.logout(token);
        reply.clearCookie(COOKIE, { path: '/' });
        return { ok: true };
      });

      priv.get('/api/admin/orders', async (req, reply) => {
        const q = z.object({ status: OrderStatus.optional() }).safeParse(req.query);
        if (!q.success) return reply.code(422).send(bad(q.error.issues));
        return { ok: true, orders: await d.orders.list(q.data.status) };
      });
      priv.patch<IdReq>('/api/admin/orders/:id', async (req, reply) => {
        if (!UUID.test(req.params.id)) return reply.code(404).send({ ok: false, error: 'not_found' });
        const p = OrderPatch.safeParse(req.body);
        if (!p.success) return reply.code(422).send(bad(p.error.issues));
        const order = await d.orders.patch(req.params.id, p.data, req.admin!.id);
        return order ? { ok: true, order } : reply.code(404).send({ ok: false, error: 'not_found' });
      });

      priv.get('/api/admin/products', async () => ({ ok: true, products: await d.catalog.list() }));
      priv.patch<IdReq>('/api/admin/products/:id', async (req, reply) => {
        if (!UUID.test(req.params.id)) return reply.code(404).send({ ok: false, error: 'not_found' });
        const p = ProductPatch.safeParse(req.body);
        if (!p.success) return reply.code(422).send(bad(p.error.issues));
        const product = await d.catalog.patch(req.params.id, p.data, req.admin!.id);
        return product ? { ok: true, product } : reply.code(404).send({ ok: false, error: 'not_found' });
      });

      priv.get('/api/admin/galleries', async () => ({ ok: true, galleries: await d.media.galleries() }));
      priv.patch<IdReq>('/api/admin/media/:id', async (req, reply) => {
        if (!UUID.test(req.params.id)) return reply.code(404).send({ ok: false, error: 'not_found' });
        const p = MediaPatch.safeParse(req.body);
        if (!p.success) return reply.code(422).send(bad(p.error.issues));
        return (await d.media.patch(req.params.id, p.data, req.admin!.id)) ? { ok: true } : reply.code(404).send({ ok: false, error: 'not_found' });
      });
    });
  };
}

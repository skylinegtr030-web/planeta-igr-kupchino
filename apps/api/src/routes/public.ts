import type { FastifyInstance } from 'fastify';
import { OrderCreate, type ApiError } from '@pi/shared';
import type { CatalogService } from '../services/catalog.js';
import type { ContentService } from '../services/content.js';
import type { OrderService } from '../services/orders.js';
import type { SiteService } from '../services/site.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

export const fieldErrors = (issues: { path: (string | number)[]; message: string }[]) =>
  Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message]));

export default function publicRoutes(d: { catalog: CatalogService; content: ContentService; orders: OrderService; site: SiteService }) {
  return async (app: FastifyInstance) => {
    app.get('/health', async () => ({ ok: true }));
    app.get('/api/catalog', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, categories: await d.catalog.list() }));
    app.get('/api/content', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, blocks: await d.content.list() }));
    app.get('/api/settings', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, ...(await d.site.settings()) }));
    app.get('/api/reviews', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, reviews: await d.site.reviews() }));
    app.post('/api/orders', async (req, reply) => {
      const p = OrderCreate.safeParse(req.body);
      if (!p.success) return reply.code(422).send({ ok: false, error: 'validation', fields: fieldErrors(p.error.issues) } satisfies ApiError);
      const { id } = await d.orders.create(p.data);
      return reply.code(201).send({ ok: true, id });
    });
  };
}

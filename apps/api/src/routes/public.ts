import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { StatsService } from '../services/stats.js';
import { OrderCreate, type ApiError } from '@pi/shared';
import type { CatalogService } from '../services/catalog.js';
import type { ContentService } from '../services/content.js';
import type { OrderService } from '../services/orders.js';
import type { SiteService } from '../services/site.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

export const fieldErrors = (issues: { path: (string | number)[]; message: string }[]) =>
  Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message]));

export default function publicRoutes(d: { catalog: CatalogService; content: ContentService; orders: OrderService; site: SiteService; stats?: StatsService }) {
  return async (app: FastifyInstance) => {
    app.get('/health', async () => ({ ok: true }));
    app.get('/api/catalog', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, categories: await d.catalog.list() }));
    app.get('/api/content', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, blocks: await d.content.list() }));
    app.get('/api/settings', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, ...(await d.site.settings()) }));
    app.post('/api/track', async (req, reply) => {
      if (!d.stats) return reply.code(204).send();
      const p = z.object({
        type: z.enum(['pageview', 'event']), path: z.string().max(300).default('/'), referrer: z.string().max(500).optional(),
        utm: z.object({ source: z.string().max(80).optional(), medium: z.string().max(80).optional(), campaign: z.string().max(120).optional() }).optional(),
        screenW: z.number().int().min(0).max(10000).optional(), name: z.string().max(60).optional(), label: z.string().max(120).optional(),
      }).safeParse(req.body);
      if (!p.success) return reply.code(204).send();
      d.stats.track(p.data, { ip: req.ip, userAgent: String(req.headers['user-agent'] ?? '') }).catch((e) => req.log.warn(e));
      return reply.code(204).send();
    });
    app.get('/api/reviews', async (_req, reply) => reply.header('cache-control', PUBLIC_CACHE).send({ ok: true, reviews: await d.site.reviews() }));
    app.post('/api/orders', async (req, reply) => {
      const p = OrderCreate.safeParse(req.body);
      if (!p.success) return reply.code(422).send({ ok: false, error: 'validation', fields: fieldErrors(p.error.issues) } satisfies ApiError);
      const { id } = await d.orders.create(p.data);
      return reply.code(201).send({ ok: true, id });
    });
  };
}

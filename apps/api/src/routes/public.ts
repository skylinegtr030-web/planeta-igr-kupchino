import type { FastifyInstance } from 'fastify';
import { OrderCreate, type ApiError } from '@pi/shared';
import type { CatalogService } from '../services/catalog.js';
import type { ContentService } from '../services/content.js';
import type { OrderService } from '../services/orders.js';

export const fieldErrors = (issues: { path: (string | number)[]; message: string }[]) =>
  Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message]));

export default function publicRoutes(d: { catalog: CatalogService; content: ContentService; orders: OrderService }) {
  return async (app: FastifyInstance) => {
    app.get('/health', async () => ({ ok: true }));
    app.get('/api/catalog', async () => ({ ok: true, categories: await d.catalog.list() }));
    app.get('/api/content', async () => ({ ok: true, blocks: await d.content.list() }));
    app.post('/api/orders', async (req, reply) => {
      const p = OrderCreate.safeParse(req.body);
      if (!p.success) return reply.code(422).send({ ok: false, error: 'validation', fields: fieldErrors(p.error.issues) } satisfies ApiError);
      const { id } = await d.orders.create(p.data);
      return reply.code(201).send({ ok: true, id });
    });
  };
}

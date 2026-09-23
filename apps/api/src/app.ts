import './types.js';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import type { CatalogService } from './services/catalog.js';
import type { ContentService } from './services/content.js';
import type { OrderService } from './services/orders.js';
import type { AuthService } from './services/auth.js';
import type { AdminOrderService } from './services/admin-orders.js';

export interface Deps {
  catalog: CatalogService; content: ContentService; orders: OrderService;
  auth: AuthService; adminOrders: AdminOrderService;
  webDist?: string; uploadsDir?: string; secureCookies?: boolean; logger?: boolean;
}

export function buildApp(d: Deps) {
  const app = Fastify({ logger: d.logger ?? false, bodyLimit: 64 * 1024, trustProxy: true });
  app.decorateRequest('admin', null);
  app.register(fastifyCookie);
  app.register(publicRoutes(d));
  app.register(adminRoutes({ auth: d.auth, orders: d.adminOrders, secureCookies: d.secureCookies ?? false }));
  const uploads = d.uploadsDir ? resolve(d.uploadsDir) : '';
  if (uploads && existsSync(uploads))
    app.register(fastifyStatic, { root: uploads, prefix: '/media/', decorateReply: false, maxAge: '30d', immutable: true });
  const web = d.webDist ? resolve(d.webDist) : '';
  if (web && existsSync(web)) app.register(fastifyStatic, { root: web, prefix: '/', wildcard: false });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith('/api/') ? reply.code(404).send({ ok: false, error: 'not_found' }) : reply.code(404).type('text/html').send('Not found'));
  app.setErrorHandler((err, req, reply) => { req.log.error(err); reply.code(500).send({ ok: false, error: 'internal' }); });
  return app;
}

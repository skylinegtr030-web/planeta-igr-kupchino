import './types.js';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import mediaResizeRoutes from './routes/media-resize.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import docsRoutes from './routes/docs.js';
import type { DocsService } from './services/docs.js';
import type { AdminContentService } from './services/admin-content.js';
import type { CatalogService } from './services/catalog.js';
import type { ContentService } from './services/content.js';
import type { OrderService } from './services/orders.js';
import type { SiteService } from './services/site.js';
import type { AuthService } from './services/auth.js';
import type { AdminOrderService } from './services/admin-orders.js';
import type { AdminCatalogService } from './services/admin-catalog.js';
import type { AdminMediaService } from './services/admin-media.js';

export interface Deps {
  catalog: CatalogService; content: ContentService; orders: OrderService; site: SiteService;
  auth: AuthService; adminOrders: AdminOrderService; adminCatalog: AdminCatalogService; adminMedia: AdminMediaService;
  docs: DocsService; adminContent: AdminContentService;
  webDist?: string; adminDist?: string; uploadsDir?: string; secureCookies?: boolean; logger?: boolean;
}

const dir = (p?: string) => (p && existsSync(resolve(p)) ? resolve(p) : '');

export function buildApp(d: Deps) {
  const app = Fastify({ logger: d.logger ?? false, bodyLimit: 64 * 1024, trustProxy: true });
  app.decorateRequest('admin', null);
  app.register(fastifyCookie);
  app.register(publicRoutes(d));
  app.register(docsRoutes({ docs: d.docs }));
  app.register(adminRoutes({ auth: d.auth, orders: d.adminOrders, catalog: d.adminCatalog, media: d.adminMedia, content: d.adminContent, secureCookies: d.secureCookies ?? false }));
  const uploads = dir(d.uploadsDir);
  if (uploads) {
    app.register(mediaResizeRoutes(uploads));
    app.register(fastifyStatic, { root: uploads, prefix: '/media/', decorateReply: false, maxAge: '30d', immutable: true });
  }
  const admin = dir(d.adminDist);
  if (admin) {
    app.get('/admin', (_req, reply) => reply.redirect('/admin/'));
    app.register(fastifyStatic, { root: admin, prefix: '/admin/', decorateReply: false });
  }
  const web = dir(d.webDist);
  if (web) app.register(fastifyStatic, { root: web, prefix: '/', wildcard: false });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith('/api/') ? reply.code(404).send({ ok: false, error: 'not_found' }) : reply.code(404).type('text/html').send('Not found'));
  app.setErrorHandler((err, req, reply) => { req.log.error(err); reply.code(500).send({ ok: false, error: 'internal' }); });
  return app;
}

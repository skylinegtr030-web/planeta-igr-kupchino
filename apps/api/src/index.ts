import { resolve } from 'node:path';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { buildApp } from './app.js';
import { catalogService } from './services/catalog.js';
import { contentService } from './services/content.js';
import { orderService } from './services/orders.js';
import { siteService } from './services/site.js';
import { authService } from './services/auth.js';
import { adminOrderService } from './services/admin-orders.js';
import { adminCatalogService } from './services/admin-catalog.js';
import { adminMediaService } from './services/admin-media.js';
import { docsService } from './services/docs.js';
import { adminContentService } from './services/admin-content.js';
import { adminV2Service } from './services/admin-v2.js';
import { statsService } from './services/stats.js';

const cfg = loadConfig();
const db = createPool(cfg.DATABASE_URL);
const applied = await migrate(db, resolve('apps/api/migrations'));
const app = buildApp({
  catalog: catalogService(db), content: contentService(db), orders: orderService(db), site: siteService(db),
  auth: authService(db), adminOrders: adminOrderService(db), adminCatalog: adminCatalogService(db), adminMedia: adminMediaService(db),
  docs: docsService(db), adminContent: adminContentService(db), adminV2: adminV2Service(db, resolve(cfg.UPLOADS_DIR)), stats: statsService(db),
  webDist: cfg.WEB_DIST, adminDist: cfg.ADMIN_DIST, uploadsDir: cfg.UPLOADS_DIR, secureCookies: cfg.COOKIE_SECURE === 'true', logger: true,
});
if (applied.length) app.log.info({ applied }, 'migrations applied');
await app.listen({ port: cfg.PORT, host: '0.0.0.0' });
for (const s of ['SIGTERM', 'SIGINT'] as const) process.on(s, async () => { await app.close(); await db.end(); process.exit(0); });

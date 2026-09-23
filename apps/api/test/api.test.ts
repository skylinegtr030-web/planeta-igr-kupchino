import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AdminOrder, AdminProduct, OrderCreate } from '@pi/shared';

const saved: OrderCreate[] = [];
const admin = { id: 'a1', email: 'admin', role: 'owner' as const };
const ID = '11111111-1111-1111-1111-111111111111';
const order: AdminOrder = { id: ID, number: 1, status: 'new', customerName: 'Анна', phone: '+79990001122', childName: null,
  eventDate: '2026-10-10', eventTime: null, comment: null, total: 0, adminNote: '', createdAt: '2026-09-23T14:00', items: [] };
const product: AdminProduct = { id: ID, category: 'Пакеты', title: 'Малыш', priceWeekday: 10000, priceWeekend: 12000, isPublished: true };

const app = buildApp({
  catalog: { list: async () => [{ slug: 'packs', title: 'Программы', kind: 'package', items: [] }] },
  content: { list: async () => [{ key: 'park.tower', data: { title: 'Башня' }, images: [{ src: '/media/park/a.jpeg', alt: '', w: 1440, h: 1920 }] }] },
  orders: { create: async (o) => { saved.push(o); return { id: saved.length }; } },
  site: {
    settings: async () => ({ contacts: { phone: '+7 981 818-01-34', hours: '10:00–22:00', addressFull: 'Балканская ул., 17', addressShort: '', mapQuery: '', mapLat: null, mapLon: null },
      ages: { kuzar: 7 }, tiers: { unlimitedWeekday: 1500 }, weekendDays: [0, 6], holidays: ['2026-11-04'] }),
    reviews: async () => [{ author: 'Анна', text: 'Отлично', rating: 5, source: null }],
  },
  auth: {
    login: async (e, p) => (e === 'admin' && p === 'secret' ? { token: 'tok', admin } : null),
    session: async (t) => (t === 'tok' ? admin : null),
    logout: async () => undefined,
  },
  adminOrders: { list: async () => [order], patch: async (id, p) => (id === ID ? { ...order, ...p } : null) },
  adminCatalog: { list: async () => [product], patch: async (id, p) => (id === ID ? { ...product, ...p } : null) },
  adminMedia: { galleries: async () => [{ slug: 'park-tower', title: 'Башня', images: [] }], patch: async (id) => id === ID },
  docs: {
    list: async () => [{ slug: 'privacy', title: 'Политика конфиденциальности' }],
    get: async (slug) => (slug === 'privacy' ? { slug, title: 'Политика конфиденциальности', body: '## Оператор\nОператор: {{company.name}}, ИНН {{company.inn}}.\n- пункт **один**\n- пункт два', published: true, sort: 1, updatedAt: '2026-09-23T10:00:00Z' } : null),
    company: async () => ({ company: { name: 'ООО «Планета Игр»', shortName: '', legalAddress: '', inn: '7811463242', kpp: '', ogrn: '1107847140422', bank: '', bik: '', account: '', corrAccount: '', director: '', phone: '', email: '' },
      contacts: { phone: '+7 981 818-01-34', hours: '10:00–22:00', addressFull: 'Балканская ул., 17', addressShort: '', mapQuery: '', mapLat: null, mapLon: null } }),
  },
  adminContent: {
    settings: async () => ({ contacts: { phone: '1' } }),
    putSetting: async () => undefined,
    blocks: async () => [{ key: 'park.tower', data: { title: 'Башня' }, updatedAt: '2026-09-23T10:00:00Z' }],
    patchBlock: async (key, p) => (key === 'park.tower' ? { key, data: { title: 'Башня', ...p }, updatedAt: 'x' } : null),
    createDoc: async (slug, title) => (slug === 'new' ? { key: 'doc.new', data: { title }, updatedAt: 'x' } : null),
  },
});
const auth = { cookies: { pi_session: 'tok' } };

describe('docs pages', () => {
  it('renders legal doc from db with company placeholders', async () => {
    const r = await app.inject('/docs/privacy');
    expect(r.statusCode).toBe(200);
    expect(String(r.headers['content-type'])).toMatch(/text\/html/);
    expect(r.body).toContain('ИНН 7811463242');
    expect(r.body).toContain('<strong>один</strong>');
    expect(r.body).toContain('<h2>Оператор</h2>');
  });
  it('renders company requisites and 404 for unknown', async () => {
    expect((await app.inject('/docs/company')).body).toContain('1107847140422');
    expect((await app.inject('/docs/nope')).statusCode).toBe(404);
    expect((await app.inject('/api/docs')).json().docs[0].slug).toBe('privacy');
  });
  it('orders require consent', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/orders', payload: { name: 'Анна', phone: '89990001122', eventDate: '2026-10-10' } });
    expect(r.statusCode).toBe(422);
    expect(r.json().fields.consent).toBeTruthy();
  });
});

describe('admin content', () => {
  const auth = { cookies: { pi_session: 'tok' } };
  it('settings put validates key', async () => {
    expect((await app.inject({ method: 'PUT', url: '/api/admin/settings/hack', payload: { value: {} }, ...auth })).statusCode).toBe(404);
    expect((await app.inject({ method: 'PUT', url: '/api/admin/settings/company', payload: { value: { inn: '1' } }, ...auth })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/admin/settings' })).statusCode).toBe(401);
  });
  it('blocks patch and doc create', async () => {
    const r = await app.inject({ method: 'PATCH', url: '/api/admin/blocks/park.tower', payload: { text: 'Новый текст' }, ...auth });
    expect(r.json().block.data.text).toBe('Новый текст');
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/blocks/park.tower', payload: {}, ...auth })).statusCode).toBe(422);
    expect((await app.inject({ method: 'POST', url: '/api/admin/docs', payload: { slug: 'new', title: 'Док' }, ...auth })).statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: '/api/admin/docs', payload: { slug: 'privacy', title: 'Док' }, ...auth })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/api/admin/docs', payload: { slug: 'Плохой', title: 'Док' }, ...auth })).statusCode).toBe(422);
  });
});

describe('public api', () => {
  it('health', async () => expect((await app.inject('/health')).json()).toEqual({ ok: true }));
  it('catalog', async () => expect((await app.inject('/api/catalog')).json().categories[0].kind).toBe('package'));
  it('settings and reviews are public and cached', async () => {
    const r = await app.inject('/api/settings');
    expect(r.json().contacts.phone).toBe('+7 981 818-01-34');
    expect(r.json().holidays).toEqual(['2026-11-04']);
    expect(String(r.headers['cache-control'])).toMatch(/max-age=60/);
    expect((await app.inject('/api/reviews')).json().reviews[0].rating).toBe(5);
  });
  it('content', async () => expect((await app.inject('/api/content')).json().blocks[0].images[0].src).toBe('/media/park/a.jpeg'));
  it('rejects invalid order', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/orders', payload: { name: 'A', phone: '12', eventDate: '10.10.2026' } });
    expect(r.statusCode).toBe(422);
    expect(Object.keys(r.json().fields).sort()).toEqual(['consent', 'eventDate', 'name', 'phone']);
  });
  it('accepts order, normalizes phone', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/orders', payload: { name: 'Анна', phone: '8 (999) 000-11-22', eventDate: '2026-10-10', kids: '12', consent: true } });
    expect(r.statusCode).toBe(201);
    expect(saved[0]).toMatchObject({ phone: '+79990001122', kids: 12, extras: [] });
  });
  it('unknown api is json 404', async () => expect((await app.inject('/api/nope')).statusCode).toBe(404));
});

describe('admin auth', () => {
  it('rejects wrong password', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'admin', password: 'x' } })).statusCode).toBe(401);
  });
  it('login sets httpOnly cookie', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'admin', password: 'secret' } });
    expect(r.statusCode).toBe(200);
    expect(String(r.headers['set-cookie'])).toMatch(/pi_session=tok.*HttpOnly/i);
  });
  it('every admin route requires session', async () => {
    for (const url of ['/api/admin/me', '/api/admin/orders', '/api/admin/products', '/api/admin/galleries'])
      expect((await app.inject(url)).statusCode, url).toBe(401);
  });
});

describe('admin data', () => {
  it('orders list and patch', async () => {
    expect((await app.inject({ url: '/api/admin/orders', ...auth })).json().orders).toHaveLength(1);
    const url = `/api/admin/orders/${ID}`;
    expect((await app.inject({ method: 'PATCH', url, ...auth, payload: {} })).statusCode).toBe(422);
    expect((await app.inject({ method: 'PATCH', url, ...auth, payload: { status: 'wrong' } })).statusCode).toBe(422);
    expect((await app.inject({ method: 'PATCH', url, ...auth, payload: { status: 'confirmed' } })).json().order.status).toBe('confirmed');
  });
  it('products: validates price', async () => {
    const url = `/api/admin/products/${ID}`;
    expect((await app.inject({ method: 'PATCH', url, ...auth, payload: { priceWeekday: -1 } })).statusCode).toBe(422);
    expect((await app.inject({ method: 'PATCH', url, ...auth, payload: { priceWeekday: 11000 } })).json().product.priceWeekday).toBe(11000);
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/products/bad', ...auth, payload: { priceWeekday: 1 } })).statusCode).toBe(404);
  });
  it('media toggle', async () => {
    expect((await app.inject({ url: '/api/admin/galleries', ...auth })).json().galleries[0].slug).toBe('park-tower');
    expect((await app.inject({ method: 'PATCH', url: `/api/admin/media/${ID}`, ...auth, payload: { isActive: false } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PATCH', url: `/api/admin/media/${ID}`, ...auth, payload: { isActive: 'yes' } })).statusCode).toBe(422);
  });
});

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AdminOrder, OrderCreate } from '@pi/shared';

const saved: OrderCreate[] = [];
const admin = { id: 'a1', email: 'admin', role: 'owner' as const };
const order: AdminOrder = { id: '11111111-1111-1111-1111-111111111111', number: 1, status: 'new', customerName: 'Анна', phone: '+79990001122',
  childName: null, eventDate: '2026-10-10', eventTime: null, comment: null, total: 0, adminNote: '', createdAt: '2026-09-23T14:00', items: [] };

const app = buildApp({
  catalog: { list: async () => [{ slug: 'packs', title: 'Программы', kind: 'package', items: [] }] },
  content: { list: async () => [{ key: 'park.tower', data: { title: 'Башня' }, images: [{ src: '/media/park/a.jpeg', alt: '', w: 1440, h: 1920 }] }] },
  orders: { create: async (o) => { saved.push(o); return { id: saved.length }; } },
  auth: {
    login: async (e, p) => (e === 'admin' && p === 'secret' ? { token: 'tok', admin } : null),
    session: async (t) => (t === 'tok' ? admin : null),
    logout: async () => undefined,
  },
  adminOrders: { list: async () => [order], patch: async (id, p) => (id === order.id ? { ...order, ...p } : null) },
});

describe('public api', () => {
  it('health', async () => expect((await app.inject('/health')).json()).toEqual({ ok: true }));
  it('catalog', async () => expect((await app.inject('/api/catalog')).json().categories[0].kind).toBe('package'));
  it('content', async () => expect((await app.inject('/api/content')).json().blocks[0].images[0].src).toBe('/media/park/a.jpeg'));
  it('rejects invalid order', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/orders', payload: { name: 'A', phone: '12', eventDate: '10.10.2026' } });
    expect(r.statusCode).toBe(422);
    expect(Object.keys(r.json().fields).sort()).toEqual(['eventDate', 'name', 'phone']);
  });
  it('accepts order, normalizes phone', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/orders', payload: { name: 'Анна', phone: '8 (999) 000-11-22', eventDate: '2026-10-10', kids: '12' } });
    expect(r.statusCode).toBe(201);
    expect(saved[0]).toMatchObject({ phone: '+79990001122', kids: 12, extras: [] });
  });
  it('unknown api is json 404', async () => expect((await app.inject('/api/nope')).statusCode).toBe(404));
});

describe('admin api', () => {
  it('rejects wrong password', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'admin', password: 'x' } });
    expect(r.statusCode).toBe(401);
  });
  it('login sets httpOnly cookie', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'admin', password: 'secret' } });
    expect(r.statusCode).toBe(200);
    expect(String(r.headers['set-cookie'])).toMatch(/pi_session=tok.*HttpOnly/i);
  });
  it('orders require session', async () => {
    expect((await app.inject('/api/admin/orders')).statusCode).toBe(401);
    const r = await app.inject({ url: '/api/admin/orders', cookies: { pi_session: 'tok' } });
    expect(r.statusCode).toBe(200);
    expect(r.json().orders).toHaveLength(1);
  });
  it('patch validates and updates', async () => {
    const url = `/api/admin/orders/${order.id}`;
    expect((await app.inject({ method: 'PATCH', url, cookies: { pi_session: 'tok' }, payload: {} })).statusCode).toBe(422);
    expect((await app.inject({ method: 'PATCH', url, cookies: { pi_session: 'tok' }, payload: { status: 'wrong' } })).statusCode).toBe(422);
    const r = await app.inject({ method: 'PATCH', url, cookies: { pi_session: 'tok' }, payload: { status: 'confirmed' } });
    expect(r.json().order.status).toBe('confirmed');
  });
});

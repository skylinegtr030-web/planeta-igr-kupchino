import type { FastifyInstance } from 'fastify';
import type { DocsService } from '../services/docs.js';
import { docPage, fill, mdToHtml } from '../services/render-doc.js';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export default function docsRoutes(d: { docs: DocsService }) {
  return async (app: FastifyInstance) => {
    app.get('/api/docs', async (_req, reply) => reply.header('cache-control', 'public, max-age=300').send({ ok: true, docs: await d.docs.list() }));
    app.get('/api/company', async (_req, reply) => reply.header('cache-control', 'public, max-age=300').send({ ok: true, ...(await d.docs.company()) }));

    app.get<{ Params: { slug: string } }>('/docs/:slug', async (req, reply) => {
      const [{ company, contacts }, nav] = await Promise.all([d.docs.company(), d.docs.list()]);
      const vars: Record<string, string> = {};
      for (const [k, v] of Object.entries(company)) vars['company.' + k] = String(v ?? '');
      for (const [k, v] of Object.entries(contacts)) vars['contacts.' + k] = String(v ?? '');
      vars['site.url'] = `${req.protocol}://${req.hostname}`;
      let title: string, html: string, updatedAt: string | null = null;
      if (req.params.slug === 'company') {
        title = 'Реквизиты';
        const rows: [string, string][] = [['Полное наименование', company.name], ['Юридический адрес', company.legalAddress], ['ИНН / КПП', [company.inn, company.kpp].filter(Boolean).join(' / ')],
          ['ОГРН', company.ogrn], ['Расчётный счёт', company.account], ['Банк', company.bank], ['БИК', company.bik], ['Корр. счёт', company.corrAccount],
          ['Руководитель', company.director], ['Телефон', company.phone || contacts.phone], ['E-mail', company.email], ['Адрес парка', contacts.addressFull], ['Режим работы', contacts.hours]];
        html = `<table>${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
      } else {
        const doc = await d.docs.get(req.params.slug);
        if (!doc) return reply.code(404).type('text/html; charset=utf-8').send(docPage({ title: 'Документ не найден', html: '<p>Такой страницы нет.</p>', updatedAt: null, nav, company: company.shortName || company.name, phone: contacts.phone, current: '' }));
        title = doc.title; html = mdToHtml(fill(doc.body, vars)); updatedAt = doc.updatedAt;
      }
      return reply.header('cache-control', 'public, max-age=300').type('text/html; charset=utf-8')
        .send(docPage({ title, html, updatedAt, nav: [...nav, { slug: 'company', title: 'Реквизиты' }], company: company.shortName || company.name, phone: contacts.phone, current: req.params.slug }));
    });
  };
}

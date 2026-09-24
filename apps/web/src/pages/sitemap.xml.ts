import type { APIRoute } from 'astro';
const SITE = import.meta.env.PUBLIC_SITE_URL ?? 'https://planeta.84.201.143.53.nip.io';
const today = new Date().toISOString().slice(0, 10);
const urls: [string, string, string][] = [['/', 'weekly', '1.0'], ['/docs/rules', 'monthly', '0.4'], ['/docs/privacy', 'yearly', '0.2'], ['/docs/oferta', 'yearly', '0.2'], ['/docs/company', 'yearly', '0.2']];
export const GET: APIRoute = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, f, pr]) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });

import type { APIRoute } from 'astro';
const SITE = import.meta.env.PUBLIC_SITE_URL ?? 'https://planeta.84.201.143.53.nip.io';
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\nHost: ${SITE.replace(/^https?:\/\//, '')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });

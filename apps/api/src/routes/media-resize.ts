import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Уменьшенные версии фотографий по запросу: /media/w/{480|960|1600}/park/file.jpeg → WebP.
 * Оригиналы не трогаем; результат кладём в кэш (в каталог загрузок, если он доступен для записи, иначе во временный).
 */
const WIDTHS = new Set([480, 960, 1600]);

export default function mediaResizeRoutes(uploadsDir: string) {
  return async (app: FastifyInstance) => {
    let sharp: typeof import('sharp') | null = null;
    try { sharp = (await import('sharp')).default; } catch { app.log.warn('sharp недоступен — /media/w отдаёт оригиналы'); }

    const cacheRoots = [path.join(uploadsDir, '_cache'), path.join(tmpdir(), 'planeta-igr-cache')];
    let cacheRoot: string | null = null;
    for (const c of cacheRoots) { try { await mkdir(c, { recursive: true }); await writeFile(path.join(c, '.w'), '1'); cacheRoot = c; break; } catch { /* дальше */ } }

    app.get<{ Params: { w: string; '*': string } }>('/media/w/:w/*', async (req, reply) => {
      const w = Number(req.params.w); const rel = req.params['*'];
      if (!WIDTHS.has(w) || !rel || rel.includes('..') || rel.startsWith('_')) return reply.code(404).send();
      const src = path.join(uploadsDir, rel);
      let st; try { st = await stat(src); } catch { return reply.code(404).send(); }
      if (!st.isFile()) return reply.code(404).send();
      reply.header('cache-control', 'public, max-age=2592000, immutable');
      if (!sharp) return reply.type('image/jpeg').send(await readFile(src));
      const key = createHash('sha1').update(`${rel}:${st.size}:${st.mtimeMs}:${w}`).digest('hex');
      const out = cacheRoot ? path.join(cacheRoot, `${key}.webp`) : null;
      if (out) { try { return reply.type('image/webp').send(await readFile(out)); } catch { /* нет в кэше */ } }
      const buf = await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
      if (out) { const tmp = `${out}.${process.pid}.tmp`; writeFile(tmp, buf).then(() => rename(tmp, out)).catch(() => {}); }
      return reply.type('image/webp').send(buf);
    });
  };
}

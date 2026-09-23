import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Db } from './pool.js';

export async function migrate(db: Db, dir: string): Promise<string[]> {
  const c = await db.connect();
  const applied: string[] = [];
  try {
    await c.query('select pg_advisory_lock(727002)');
    await c.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
    const done = new Set((await c.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name));
    for (const f of (await readdir(dir)).filter((x) => x.endsWith('.sql')).sort()) {
      if (done.has(f)) continue;
      await c.query('begin');
      try {
        await c.query(await readFile(join(dir, f), 'utf8'));
        await c.query('insert into schema_migrations(name) values ($1)', [f]);
        await c.query('commit');
        applied.push(f);
      } catch (e) { await c.query('rollback'); throw e; }
    }
  } finally {
    await c.query('select pg_advisory_unlock(727002)').catch(() => undefined);
    c.release();
  }
  return applied;
}

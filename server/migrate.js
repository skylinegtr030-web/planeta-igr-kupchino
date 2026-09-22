'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'migrations');
const LOCK = 727001;

async function migrate(pool) {
  const c = await pool.connect();
  try {
    await c.query('select pg_advisory_lock($1)', [LOCK]);
    await c.query(`create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
    const done = new Set((await c.query('select name from schema_migrations')).rows.map(r => r.name));
    const files = fs.readdirSync(DIR).filter(f => /^\d{3}_[\w-]+\.sql$/.test(f)).sort();

    if (files[0] && !done.has(files[0])) {
      const { rows } = await c.query("select to_regclass('public.products') as t");
      if (rows[0].t) {
        await c.query('insert into schema_migrations(name) values ($1)', [files[0]]);
        done.add(files[0]);
      }
    }

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
      await c.query('begin');
      try {
        await c.query(sql);
        await c.query('insert into schema_migrations(name) values ($1)', [file]);
        await c.query('commit');
        console.log('migration applied:', file);
      } catch (err) {
        await c.query('rollback');
        throw new Error(`migration ${file} failed: ${err.message}`);
      } finally {
        await c.query('set search_path to public');
      }
    }
  } finally {
    await c.query('select pg_advisory_unlock($1)', [LOCK]).catch(() => {});
    c.release();
  }
}

module.exports = { migrate };

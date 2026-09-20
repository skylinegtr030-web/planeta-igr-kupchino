'use strict';
const http     = require('http');
const fs       = require('fs');
const fsp      = fs.promises;
const path     = require('path');
const { Pool } = require('pg');

const PORT      = Number(process.env.PORT || 3000);
const SITE_ROOT = process.env.SITE_ROOT || path.resolve(__dirname, '..', 'site');
const MAX_BODY  = Number(process.env.MAX_ORDER_BODY_BYTES || 65536);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf'
};

const PRIVATE_PREFIXES = [
  '/server', '/runtime', '/backups', '/.git', '/.github'
];

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type':           'application/json; charset=utf-8',
    'Content-Length':         Buffer.byteLength(payload),
    'Cache-Control':          'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('payload_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error('invalid_json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

async function saveOrder(req, res) {
  const input = await readBody(req);
  const name  = clean(input.name || input.fio, 120);
  const phone = clean(input.phone, 40);
  if (!name || !phone) {
    json(res, 422, { ok: false, error: 'name_and_phone_required' });
    return;
  }
  const payload = {
    childName:    clean(input.childName,    100),
    childBday:    clean(input.childBday,     20),
    eventTime:    clean(input.eventTime,     20),
    comment:      clean(input.comment,     2000),
    packName:     clean(input.packName,     200),
    roomName:     clean(input.roomName,     200),
    extrasNames:  clean(input.extrasNames,  500),
    durationText: clean(input.durationText, 100),
    endTimeText:  clean(input.endTimeText,  100),
    priceText:    clean(input.priceText,    200),
    source: 'website'
  };
  const eventDate = clean(input.eventDate, 20) || null;
  const { rows } = await pool.query(
    `insert into orders (name, phone, event_date, payload)
     values ($1, $2, $3, $4)
     returning id, created_at`,
    [name, phone, eventDate, JSON.stringify(payload)]
  );
  json(res, 201, { ok: true, id: rows[0].id, createdAt: rows[0].created_at });
}

async function apiPackages(res) {
  const { rows } = await pool.query(
    `select slug, title, description, price_weekday, price_weekend, attrs
     from products where is_published = true order by sort_order`
  );
  json(res, 200, { ok: true, packages: rows });
}

async function apiExtras(res) {
  const { rows } = await pool.query(
    `select slug, title, description, price, price_from, duration_min, upto,
            emoji, photo_url, color1, color2, options, sort_order
     from extras where is_published = true order by sort_order`
  );
  json(res, 200, { ok: true, extras: rows });
}

async function apiSettings(res, key) {
  if (key) {
    const { rows } = await pool.query(
      'select value from site_settings where key = $1', [key]
    );
    if (!rows.length) { json(res, 404, { ok: false, error: 'not_found' }); return; }
    json(res, 200, { ok: true, value: rows[0].value });
  } else {
    const { rows } = await pool.query('select key, value from site_settings order by key');
    json(res, 200, { ok: true, settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
  }
}

async function serveStatic(req, res, pathname) {
  if (PRIVATE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    json(res, 404, { ok: false, error: 'not_found' });
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file     = path.resolve(SITE_ROOT, relative);
  if (!file.startsWith(SITE_ROOT + path.sep) && file !== SITE_ROOT) {
    json(res, 404, { ok: false, error: 'not_found' });
    return;
  }
  try {
    let target = file;
    let stat   = await fsp.stat(target);
    if (stat.isDirectory()) { target = path.join(target, 'index.html'); stat = await fsp.stat(target); }
    if (!stat.isFile()) throw new Error('not_file');
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, {
      'Content-Type':           MIME[ext] || 'application/octet-stream',
      'Content-Length':         stat.size,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy':        'strict-origin-when-cross-origin',
      'Cache-Control':          'public, max-age=3600'
    });
    fs.createReadStream(target).pipe(res);
  } catch {
    try {
      const fallback = path.join(SITE_ROOT, 'index.html');
      const stat     = await fsp.stat(fallback);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
      fs.createReadStream(fallback).pipe(res);
    } catch {
      json(res, 404, { ok: false, error: 'not_found' });
    }
  }
}

async function handler(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const method   = req.method;

  if (pathname === '/health' && method === 'GET') {
    json(res, 200, { ok: true, service: 'planeta-igr', time: new Date().toISOString() }); return;
  }
  if (pathname === '/api/order') {
    if (method === 'POST') { await saveOrder(req, res); return; }
    res.setHeader('Allow', 'POST');
    json(res, 405, { ok: false, error: 'method_not_allowed' }); return;
  }
  if (pathname === '/api/packages' && method === 'GET') { await apiPackages(res); return; }
  if (pathname === '/api/extras'   && method === 'GET') { await apiExtras(res);   return; }
  if (pathname.startsWith('/api/settings') && method === 'GET') {
    const key = pathname.replace('/api/settings', '').replace(/^\//, '') || null;
    await apiSettings(res, key); return;
  }
  if (pathname.startsWith('/api/')) { json(res, 404, { ok: false, error: 'not_found' }); return; }
  if (method !== 'GET' && method !== 'HEAD') { json(res, 405, { ok: false, error: 'method_not_allowed' }); return; }
  await serveStatic(req, res, pathname);
}

async function start() {
  console.log('SITE_ROOT:', SITE_ROOT);
  console.log('Connecting to DB:', process.env.DATABASE_URL ? 'URL set' : 'NO DATABASE_URL!');
  const client = await pool.connect();
  client.release();
  console.log('Database connected OK');
  http.createServer((req, res) => {
    handler(req, res).catch(err => {
      const status = err.status || 500;
      json(res, status, { ok: false, error: status === 500 ? 'server_error' : err.message });
    });
  }).listen(PORT, '0.0.0.0', () => {
    console.log('Planeta Igr listening on port ' + PORT);
  });
}

start().catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});

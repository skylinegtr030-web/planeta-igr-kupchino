'use strict';
const http     = require('http');
const fs       = require('fs');
const fsp      = fs.promises;
const path     = require('path');
const { Pool } = require('pg');
const crypto   = require('crypto');

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

const PRIVATE_PREFIXES = ['/server','/runtime','/backups','/.git','/.github'];

// ─ helpers ─────────────────────────────────────────────────────────────────────
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
    let size = 0; const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('payload_too_large'),{status:413})); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(Buffer.concat(chunks).toString('utf8')); }
      catch { reject(Object.assign(new Error('read_error'),{status:500})); }
    });
    req.on('error', reject);
  });
}
async function parseBody(req) {
  const raw = await readBody(req);
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('invalid_json'),{status:400}); }
}
const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

// ─ session auth ─────────────────────────────────────────────────────────────
async function getSession(req) {
  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  const { rows } = await pool.query(
    `select a.id, a.role from admin_sessions s
     join admins a on a.id = s.admin_id
     where s.token=$1 and s.expires_at > now()`, [token]
  );
  return rows[0] || null;
}
async function requireSession(req, res) {
  const s = await getSession(req);
  if (!s) { json(res, 401, { ok: false, error: 'unauthorized' }); return null; }
  return s;
}

// ─ POST /api/admin/login ────────────────────────────────────────────────────
async function adminLogin(req, res) {
  const input = await parseBody(req);
  const pwd   = clean(input.password || '', 200);
  if (!pwd) { json(res, 422, { ok: false, error: 'password_required' }); return; }
  // проверяем пароль через bcrypt в PostgreSQL
  const { rows } = await pool.query(
    `select id from admins where pass_hash = crypt($1, pass_hash) limit 1`, [pwd]
  );
  if (!rows.length) { json(res, 401, { ok: false, error: 'invalid_password' }); return; }
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `insert into admin_sessions (token, admin_id, expires_at)
     values ($1, $2, now() + interval '30 days')`,
    [token, rows[0].id]
  );
  json(res, 200, { ok: true, token });
}

// ─ POST /api/admin/logout ───────────────────────────────────────────────────
async function adminLogout(req, res) {
  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token) await pool.query('delete from admin_sessions where token=$1', [token]);
  json(res, 200, { ok: true });
}

// ─ GET /api/admin/check ─────────────────────────────────────────────────────
async function adminCheck(req, res) {
  const s = await requireSession(req, res);
  if (!s) return;
  json(res, 200, { ok: true, role: s.role });
}

// ─ POST /api/order ──────────────────────────────────────────────────────────────
async function saveOrder(req, res) {
  const input = await parseBody(req);
  const name  = clean(input.name || input.fio, 120);
  const phone = clean(input.phone, 40);
  if (!name || !phone) { json(res, 422, { ok: false, error: 'name_and_phone_required' }); return; }
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
     values ($1, $2, $3, $4) returning id, created_at`,
    [name, phone, eventDate, JSON.stringify(payload)]
  );
  json(res, 201, { ok: true, id: rows[0].id, createdAt: rows[0].created_at });
}

// ─ GET /api/orders ────────────────────────────────────────────────────────────
async function apiOrders(req, res) {
  const s = await requireSession(req, res); if (!s) return;
  const url    = new URL(req.url, 'http://localhost');
  const status = url.searchParams.get('status') || null;
  const { rows } = await pool.query(
    status
      ? `select id,created_at,updated_at,name,phone,event_date,status,admin_note,payload from orders where status=$1 order by created_at desc limit 200`
      : `select id,created_at,updated_at,name,phone,event_date,status,admin_note,payload from orders order by created_at desc limit 200`,
    status ? [status] : []
  );
  json(res, 200, { ok: true, orders: rows });
}

// ─ PATCH /api/orders/:id ───────────────────────────────────────────────────────
async function apiOrderPatch(req, res, id) {
  const s = await requireSession(req, res); if (!s) return;
  const input   = await parseBody(req);
  const allowed = ['Новая','В работе','Подтверждена','Отклонена'];
  const status  = clean(input.status||'', 40);
  const note    = clean(input.admin_note != null ? input.admin_note : '', 2000);
  const sets=[]; const p=[];
  if (status) { if(!allowed.includes(status)){json(res,422,{ok:false,error:'invalid_status'});return;} p.push(status); sets.push(`status=$${p.length}`); }
  if (input.admin_note!=null) { p.push(note); sets.push(`admin_note=$${p.length}`); }
  if (!sets.length) { json(res,422,{ok:false,error:'nothing_to_update'}); return; }
  p.push(id);
  const { rowCount } = await pool.query(`update orders set ${sets.join(',')} where id=$${p.length}`, p);
  if (!rowCount) { json(res,404,{ok:false,error:'not_found'}); return; }
  json(res, 200, { ok: true });
}

// ─ GET /api/stats ───────────────────────────────────────────────────────────────
async function apiStats(req, res) {
  const s = await requireSession(req, res); if (!s) return;
  const { rows } = await pool.query(`
    select
      count(*)                                           as total,
      count(*) filter (where status='Новая')           as new_count,
      count(*) filter (where status='Подтверждена')   as confirmed,
      count(*) filter (where status='Отклонена')    as cancelled,
      count(*) filter (where event_date >= current_date
                         and event_date <  current_date+30) as upcoming_30d,
      count(*) filter (where created_at >= current_date-7)  as last_7d
    from orders`);
  json(res, 200, { ok: true, stats: rows[0] });
}

// ─ GET /api/packages ────────────────────────────────────────────────────────
async function apiPackages(res) {
  const { rows } = await pool.query(
    `select slug,title,description,price_weekday,price_weekend,attrs
     from products where is_published=true order by sort_order`);
  json(res, 200, { ok: true, packages: rows });
}

// ─ PATCH /api/admin/packages/:slug ──────────────────────────────────────────
async function apiPackagePatch(req, res, slug) {
  const s = await requireSession(req, res); if (!s) return;
  const input = await parseBody(req);
  await pool.query(
    `update products set price_weekday=$1, price_weekend=$2 where slug=$3`,
    [Number(input.price_weekday), Number(input.price_weekend), slug]
  );
  json(res, 200, { ok: true });
}

// ─ GET /api/extras ──────────────────────────────────────────────────────────
async function apiExtras(res) {
  const { rows } = await pool.query(
    `select slug,title,description,price,price_from,duration_min,upto,
            emoji,photo_url,color1,color2,options,sort_order
     from extras where is_published=true order by sort_order`);
  json(res, 200, { ok: true, extras: rows });
}

// ─ PATCH /api/admin/extras/:slug ───────────────────────────────────────────
async function apiExtraPatch(req, res, slug) {
  const s = await requireSession(req, res); if (!s) return;
  const input = await parseBody(req);
  await pool.query(
    `update extras set price=$1, description=$2 where slug=$3`,
    [Number(input.price), clean(input.description||'', 500), slug]
  );
  json(res, 200, { ok: true });
}

// ─ GET /api/media ──────────────────────────────────────────────────────────
async function apiMedia(req, res) {
  const url  = new URL(req.url, 'http://localhost');
  const grp  = url.searchParams.get('group') || null;
  const pathCol  = await colExists('media','storage_path') ? 'storage_path' : 'path';
  const groupCol = await colExists('media','folder')       ? 'folder'       : '"group"';
  const { rows } = await pool.query(
    grp
      ? `select id,${pathCol} as path,alt,${groupCol} as "group",sort_order from media where is_active=true and ${groupCol}=$1 order by sort_order`
      : `select id,${pathCol} as path,alt,${groupCol} as "group",sort_order from media where is_active=true order by ${groupCol},sort_order`,
    grp ? [grp] : []
  );
  json(res, 200, { ok: true, media: rows });
}
async function colExists(table, col) {
  const { rows } = await pool.query(
    `select 1 from information_schema.columns where table_name=$1 and column_name=$2`,[table,col]);
  return rows.length > 0;
}

// ─ GET/PUT /api/admin/settings/:key ────────────────────────────────────────
async function apiSettings(res, key) {
  if (key) {
    const { rows } = await pool.query('select value from site_settings where key=$1',[key]);
    if (!rows.length) { json(res,404,{ok:false,error:'not_found'}); return; }
    json(res, 200, { ok: true, value: rows[0].value });
  } else {
    const { rows } = await pool.query('select key,value from site_settings order by key');
    json(res, 200, { ok: true, settings: Object.fromEntries(rows.map(r=>[r.key,r.value])) });
  }
}
async function apiSettingsPut(req, res, key) {
  const s = await requireSession(req, res); if (!s) return;
  const input = await parseBody(req);
  await pool.query(
    `insert into site_settings(key,value) values($1,$2)
     on conflict(key) do update set value=excluded.value, updated_at=now()`,
    [key, JSON.stringify(input.value)]
  );
  json(res, 200, { ok: true });
}

// ─ static ───────────────────────────────────────────────────────────────────────
async function serveStatic(req, res, pathname) {
  if (PRIVATE_PREFIXES.some(p => pathname===p || pathname.startsWith(p+'/'))) {
    json(res,404,{ok:false,error:'not_found'}); return;
  }
  const relative = pathname==='/' ? 'index.html' : pathname.replace(/^\/+/,'');
  const file     = path.resolve(SITE_ROOT, relative);
  if (!file.startsWith(SITE_ROOT+path.sep) && file!==SITE_ROOT) {
    json(res,404,{ok:false,error:'not_found'}); return;
  }
  try {
    let target=file, stat=await fsp.stat(target);
    if (stat.isDirectory()) { target=path.join(target,'index.html'); stat=await fsp.stat(target); }
    if (!stat.isFile()) throw new Error('not_file');
    const ext=path.extname(target).toLowerCase();
    res.writeHead(200,{
      'Content-Type': MIME[ext]||'application/octet-stream',
      'Content-Length': stat.size,
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Cache-Control':'public, max-age=3600'
    });
    fs.createReadStream(target).pipe(res);
  } catch {
    try {
      const fallback=path.join(SITE_ROOT,'index.html');
      const stat=await fsp.stat(fallback);
      res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Content-Length':stat.size,'Cache-Control':'no-store'});
      fs.createReadStream(fallback).pipe(res);
    } catch { json(res,404,{ok:false,error:'not_found'}); }
  }
}

// ─ router ──────────────────────────────────────────────────────────────────────
async function handler(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const method   = req.method;

  if (pathname==='/health' && method==='GET') {
    json(res,200,{ok:true,service:'planeta-igr',time:new Date().toISOString()}); return;
  }

  // admin auth
  if (pathname==='/api/admin/login'  && method==='POST') { await adminLogin(req,res);  return; }
  if (pathname==='/api/admin/logout' && method==='POST') { await adminLogout(req,res); return; }
  if (pathname==='/api/admin/check'  && method==='GET')  { await adminCheck(req,res);  return; }

  // orders
  if (pathname==='/api/order'  && method==='POST') { await saveOrder(req,res);  return; }
  if (pathname==='/api/orders' && method==='GET')  { await apiOrders(req,res);  return; }
  if (pathname==='/api/stats'  && method==='GET')  { await apiStats(req,res);   return; }
  const opatch = pathname.match(/^\/api\/orders\/([\w-]+)$/);
  if (opatch && method==='PATCH') { await apiOrderPatch(req,res,opatch[1]); return; }

  // packages
  if (pathname==='/api/packages' && method==='GET') { await apiPackages(res); return; }
  const pkgPatch = pathname.match(/^\/api\/admin\/packages\/([\w-]+)$/);
  if (pkgPatch && method==='PATCH') { await apiPackagePatch(req,res,pkgPatch[1]); return; }

  // extras
  if (pathname==='/api/extras' && method==='GET') { await apiExtras(res); return; }
  const extPatch = pathname.match(/^\/api\/admin\/extras\/([\w-]+)$/);
  if (extPatch && method==='PATCH') { await apiExtraPatch(req,res,extPatch[1]); return; }

  // media
  if (pathname==='/api/media' && method==='GET') { await apiMedia(req,res); return; }

  // settings
  if (pathname.startsWith('/api/settings') && method==='GET') {
    const key=pathname.replace('/api/settings','').replace(/^\//,'')||null;
    await apiSettings(res,key); return;
  }
  const settingsPut = pathname.match(/^\/api\/admin\/settings\/([\w-]+)$/);
  if (settingsPut && method==='PUT') { await apiSettingsPut(req,res,settingsPut[1]); return; }

  if (pathname.startsWith('/api/')) { json(res,404,{ok:false,error:'not_found'}); return; }
  if (method!=='GET' && method!=='HEAD') { json(res,405,{ok:false,error:'method_not_allowed'}); return; }
  await serveStatic(req,res,pathname);
}

async function start() {
  console.log('SITE_ROOT:', SITE_ROOT);
  console.log('DB:', process.env.DATABASE_URL ? 'URL set' : 'NO DATABASE_URL!');
  const client = await pool.connect(); client.release();
  console.log('DB connected OK');
  http.createServer((req,res) => {
    handler(req,res).catch(err => {
      const st=err.status||500;
      json(res,st,{ok:false,error:st===500?'server_error':err.message});
    });
  }).listen(PORT,'0.0.0.0',()=>console.log('Planeta Igr port '+PORT));
}

start().catch(err=>{ console.error('Startup error:',err.message); process.exit(1); });

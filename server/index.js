const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const SITE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.resolve('/app/data');
const ORDERS_ROOT = path.join(DATA_ROOT, 'orders');
const MAX_BODY = Number(process.env.MAX_ORDER_BODY_BYTES || 1048576);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const PRIVATE_PREFIXES = [
  '/admin', '/server', '/runtime', '/backups', '/.git', '/.github', '/api/'
];

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

function readJson(req) {
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
      } catch (error) {
        reject(Object.assign(new Error('invalid_json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function cleanText(value, limit) {
  return String(value == null ? '' : value).trim().slice(0, limit);
}

async function saveOrder(req, res) {
  try {
    const input = await readJson(req);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const order = {
      id,
      createdAt,
      status: 'new',
      name: cleanText(input.name || input.fio, 120),
      phone: cleanText(input.phone, 40),
      childName: cleanText(input.childName, 100),
      childBday: cleanText(input.childBday, 20),
      eventDate: cleanText(input.eventDate, 20),
      eventTime: cleanText(input.eventTime, 20),
      comment: cleanText(input.comment, 2000),
      packName: cleanText(input.packName, 200),
      roomName: cleanText(input.roomName, 200),
      extrasNames: cleanText(input.extrasNames, 2000),
      durationText: cleanText(input.durationText, 100),
      endTimeText: cleanText(input.endTimeText, 100),
      priceText: cleanText(input.priceText, 200),
      source: 'website'
    };

    if (!order.name || !order.phone) {
      json(res, 422, { ok: false, error: 'name_and_phone_required' });
      return;
    }

    const month = createdAt.slice(0, 7);
    const folder = path.join(ORDERS_ROOT, month);
    await fsp.mkdir(folder, { recursive: true });
    const target = path.join(folder, createdAt.replace(/[:.]/g, '-') + '-' + id + '.json');
    const temp = target + '.tmp';
    await fsp.writeFile(temp, JSON.stringify(order, null, 2) + '\n', { mode: 0o600 });
    await fsp.rename(temp, target);
    json(res, 201, { ok: true, id, createdAt });
  } catch (error) {
    const status = error.status || 500;
    json(res, status, { ok: false, error: status === 500 ? 'server_error' : error.message });
  }
}

async function serveStatic(req, res, pathname) {
  if (PRIVATE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix))) {
    json(res, 404, { ok: false, error: 'not_found' });
    return;
  }

  let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let file = path.resolve(SITE_ROOT, relative);
  if (!file.startsWith(SITE_ROOT + path.sep)) {
    json(res, 404, { ok: false, error: 'not_found' });
    return;
  }

  try {
    let stat = await fsp.stat(file);
    if (stat.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fsp.stat(file);
    }
    if (!stat.isFile()) throw new Error('not_file');

    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    headers['Cache-Control'] = path.basename(file) === 'content.json'
      ? 'no-store'
      : 'public, max-age=3600';
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    try {
      const fallback = path.join(SITE_ROOT, 'index.html');
      const stat = await fsp.stat(fallback);
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': stat.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(fallback).pipe(res);
    } catch (nested) {
      json(res, 404, { ok: false, error: 'not_found' });
    }
  }
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/health' && req.method === 'GET') {
    json(res, 200, { ok: true, service: 'planeta-igr', time: new Date().toISOString() });
    return;
  }

  if (pathname === '/api/order' && req.method === 'POST') {
    await saveOrder(req, res);
    return;
  }

  if (pathname === '/api/order') {
    res.setHeader('Allow', 'POST');
    json(res, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    json(res, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  await serveStatic(req, res, pathname);
}

fsp.mkdir(ORDERS_ROOT, { recursive: true })
  .then(() => {
    http.createServer((req, res) => {
      handler(req, res).catch(() => json(res, 500, { ok: false, error: 'server_error' }));
    }).listen(PORT, '0.0.0.0', () => {
      console.log('Planeta Igr server listening on port ' + PORT);
    });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

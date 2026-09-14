/* Vercel Serverless Function: админ-API с авторизацией по логину и паролю.
   Переменные окружения проекта на Vercel:
     ADMIN_LOGIN    — логин администратора
     ADMIN_PASSWORD — пароль администратора
     GH_TOKEN       — fine-grained PAT (Contents: Read and write) для записи в репозиторий
   GitHub-токен никогда не покидает сервер: браузер получает только короткоживущую
   сессию, подписанную HMAC. Смена пароля мгновенно инвалидирует все сессии.

   Запросы (Content-Type: application/json):
     { "action": "login",   "user": "...", "password": "..." }            → { status, token }
     GET  /api/admin?action=content                                        → content.json
     { "action": "save",   "data": {...}, "sha": "..." }                  → обновить content.json
     GET  /api/admin?action=orders&months=3                                → список заявок
     { "action": "status", "path": "orders/...", "status": "Подтверждена" }→ смена статуса
     { "action": "upload", "name": "file.jpg", "content": "<base64>" }    → загрузка файла
   Все действия, кроме login, требуют заголовок Authorization: Bearer <token>.
*/

const crypto = require('crypto');

const OWNER = process.env.GH_OWNER || 'skylinegtr030-web';
const REPO = process.env.GH_REPO || 'planeta-igr-kupchino';
const BRANCH = process.env.GH_BRANCH || 'main';
const CONTENT_FILE = 'content.json';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 дней
const STATUSES = new Set(['Новая', 'В работе', 'Подтверждена', 'Отклонена']);

function secretKey() {
  return String(process.env.ADMIN_LOGIN || '') + ':' + String(process.env.ADMIN_PASSWORD || '');
}
function sign(payload) {
  return crypto.createHmac('sha256', secretKey()).update(payload).digest('hex');
}
function issueToken(user) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + SESSION_TTL })).toString('base64url');
  return payload + '.' + sign(payload);
}
function verifyToken(token) {
  if (typeof token !== 'string' || token.indexOf('.') === -1) return null;
  var payload = token.slice(0, token.lastIndexOf('.'));
  var sig = token.slice(token.lastIndexOf('.') + 1);
  if (sign(payload) !== sig) return null;
  var data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!data || !data.exp || data.exp < Date.now()) return null;
  return data;
}
function safeEqual(a, b) {
  var ba = Buffer.from(String(a));
  var bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function configured() {
  return Boolean(process.env.ADMIN_LOGIN && process.env.ADMIN_PASSWORD);
}

function jsonRes(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
}

function decodeBase64(base64) {
  return Buffer.from(String(base64).replace(/\n/g, ''), 'base64').toString('utf8');
}
function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

async function ghApi(path, options) {
  options = options || {};
  var token = process.env.GH_TOKEN;
  if (!token) { var e = new Error('GH_TOKEN не задан в переменных окружения'); e.status = 500; throw e; }
  var response = await fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + path, {
    method: options.method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'planeta-igr-admin'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (response.status === 404) return { __missing: true };
  var text = await response.text();
  var body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    var err = new Error(body.message || ('GitHub HTTP ' + response.status));
    err.status = response.status;
    throw err;
  }
  return body;
}

async function listMonth(month) {
  var dir = await ghApi('/contents/orders/' + month + '?ref=' + BRANCH);
  if (dir.__missing || !Array.isArray(dir)) return [];
  var files = dir.filter(function (x) { return x.type === 'file' && x.name.endsWith('.json'); });
  var results = await Promise.all(files.map(async function (file) {
    try {
      var body = await ghApi('/contents/' + file.path + '?ref=' + BRANCH);
      if (body.__missing) return null;
      var order = JSON.parse(decodeBase64(body.content));
      order.__path = file.path;
      return order;
    } catch (e) { return null; }
  }));
  return results.filter(Boolean);
}
function recentMonths(count) {
  var now = new Date();
  var out = [];
  for (var i = 0; i < count; i++) {
    var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET' && req.method !== 'POST') return jsonRes(res, 405, { status: 'error', error: 'method' });

  try {
    var body = (req.method === 'POST' && typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
    var action = String((req.query && req.query.action) || body.action || '');

    // ---- вход ----
    if (action === 'login') {
      if (!configured()) return jsonRes(res, 500, { status: 'error', error: 'ADMIN_LOGIN и ADMIN_PASSWORD не заданы в переменных окружения Vercel' });
      if (!safeEqual(body.user || '', process.env.ADMIN_LOGIN) ||
          !safeEqual(body.password || '', process.env.ADMIN_PASSWORD)) {
        return jsonRes(res, 401, { status: 'error', error: 'Неверный логин или пароль' });
      }
      return jsonRes(res, 200, { status: 'ok', token: issueToken(process.env.ADMIN_LOGIN) });
    }

    // ---- всё остальное требует сессию ----
    if (!configured()) return jsonRes(res, 500, { status: 'error', error: 'сервер не настроен' });
    var auth = req.headers['authorization'] || '';
    var session = verifyToken(auth.startsWith('Bearer ') ? auth.slice(7).trim() : '');
    if (!session) return jsonRes(res, 401, { status: 'error', error: 'auth' });

    if (req.method === 'GET' && action === 'content') {
      var file = await ghApi('/contents/' + CONTENT_FILE + '?ref=' + BRANCH);
      if (file.__missing) return jsonRes(res, 404, { status: 'error', error: 'content.json не найден' });
      return jsonRes(res, 200, { status: 'ok', content: JSON.parse(decodeBase64(file.content)), sha: file.sha });
    }

    if (action === 'save') {
      if (!body.data || typeof body.data !== 'object') return jsonRes(res, 400, { status: 'error', error: 'data' });
      await ghApi('/contents/' + CONTENT_FILE, {
        method: 'PUT',
        body: {
          message: 'content: обновление через панель',
          content: encodeBase64(JSON.stringify(body.data, null, 2) + '\n'),
          sha: String(body.sha || ''),
          branch: BRANCH
        }
      });
      return jsonRes(res, 200, { status: 'ok' });
    }

    if (req.method === 'GET' && action === 'orders') {
      var months = Math.max(1, Math.min(12, Number(req.query && req.query.months) || 6));
      var orders = [];
      for (var m of recentMonths(months)) orders.push.apply(orders, await listMonth(m));
      orders.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
      return jsonRes(res, 200, { status: 'ok', orders: orders });
    }

    if (action === 'status') {
      var path = String(body.path || '').replace(/^\/+/, '');
      var status = String(body.status || '');
      if (!path.startsWith('orders/') || !path.endsWith('.json')) return jsonRes(res, 400, { status: 'error', error: 'path' });
      if (!STATUSES.has(status)) return jsonRes(res, 400, { status: 'error', error: 'status' });
      var current = await ghApi('/contents/' + path + '?ref=' + BRANCH);
      if (current.__missing) return jsonRes(res, 404, { status: 'error', error: 'not_found' });
      var order = JSON.parse(decodeBase64(current.content));
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await ghApi('/contents/' + path, {
        method: 'PUT',
        body: {
          message: 'order: ' + status + ' — ' + (order.fio || ''),
          content: encodeBase64(JSON.stringify(order, null, 2) + '\n'),
          sha: current.sha,
          branch: BRANCH
        }
      });
      return jsonRes(res, 200, { status: 'ok', order: order });
    }

    if (action === 'upload') {
      var name = String(body.name || '').replace(/[^a-zA-Z0-9._-]/g, '-');
      if (!name || name === '.' || name === '..') return jsonRes(res, 400, { status: 'error', error: 'name' });
      if (!/^[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(name)) return jsonRes(res, 400, { status: 'error', error: 'format' });
      if (!body.content) return jsonRes(res, 400, { status: 'error', error: 'content' });
      await ghApi('/contents/' + encodeURIComponent(name), {
        method: 'PUT',
        body: { message: 'media: ' + name, content: String(body.content), branch: BRANCH }
      });
      return jsonRes(res, 200, { status: 'ok', name: name });
    }

    return jsonRes(res, 400, { status: 'error', error: 'action' });
  } catch (err) {
    return jsonRes(res, err.status || 500, { status: 'error', error: err.message || 'server' });
  }
};

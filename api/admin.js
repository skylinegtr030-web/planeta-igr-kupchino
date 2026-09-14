/* Vercel Serverless Function: админ-API. Вход — по ссылке на почту (magic link).
   Переменные окружения проекта на Vercel:
     ADMIN_EMAILS   — список разрешённых адресов через запятую (например: "mihail@example.com,test@yandex.ru")
     RESEND_API_KEY — ключ Resend для отправки писем (https://resend.com, бесплатный тариф до 3 000 писем в месяц)
     MAIL_FROM      — обратный адрес письма (по умолчанию: "onboarding@resend.dev")
     SITE_URL       — базовый адрес сайта (по умолчанию берётся из request'а)
     GH_TOKEN       — fine-grained PAT (Contents: Read and write) для доступа к репозиторию
   GitHub-токен никогда не покидает сервер. Браузер получает только короткоживущую сессию, подписанную HMAC.

   Запросы (Content-Type: application/json):
     { "action": "request-link", "email": "..." }                → { status: "sent" }
     { "action": "verify",       "token": "..." }                → { status, session }
     GET  /api/admin?action=content                              → content.json (нужен Authorization: Bearer <session>)
     { "action": "save",   "data": {...}, "sha": "..." }        → обновить content.json
     GET  /api/admin?action=orders&months=3                      → список заявок
     { "action": "status", "path": "orders/...", "status": "…" } → смена статуса
     { "action": "upload", "name": "file.jpg", "content": "…" }  → загрузка файла
*/

const crypto = require('crypto');

const OWNER = process.env.GH_OWNER || 'skylinegtr030-web';
const REPO = process.env.GH_REPO || 'planeta-igr-kupchino';
const BRANCH = process.env.GH_BRANCH || 'main';
const CONTENT_FILE = 'content.json';
const LINK_TTL = 15 * 60 * 1000;           // ссылка живёт 15 минут
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // сессия — 30 дней
const STATUSES = new Set(['Новая', 'В работе', 'Подтверждена', 'Отклонена']);

function secretKey() {
  // Секрет для подписи ссылок и сессий. Меняется, если поменять список адресов.
  return 'pg-admin-v2:' + String(process.env.ADMIN_EMAILS || '') + ':' + String(process.env.GH_TOKEN || '').slice(0, 12);
}
function sign(kind, payload) {
  return crypto.createHmac('sha256', secretKey() + ':' + kind).update(payload).digest('hex');
}
function issue(kind, data, ttl) {
  var body = Object.assign({}, data, { exp: Date.now() + ttl });
  var payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  return payload + '.' + sign(kind, payload);
}
function verify(kind, token) {
  if (typeof token !== 'string' || token.indexOf('.') === -1) return null;
  var payload = token.slice(0, token.lastIndexOf('.'));
  var sig = token.slice(token.lastIndexOf('.') + 1);
  if (sign(kind, payload) !== sig) return null;
  var data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!data || !data.exp || data.exp < Date.now()) return null;
  return data;
}
function allowedEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(/[,\s;]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
}
function isAllowed(email) {
  return allowedEmails().indexOf(String(email || '').trim().toLowerCase()) !== -1;
}
function configured() {
  return Boolean(process.env.ADMIN_EMAILS && process.env.RESEND_API_KEY && process.env.GH_TOKEN);
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
  if (!token) { var e = new Error('GH_TOKEN не задан'); e.status = 500; throw e; }
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

function siteBase(req) {
  if (process.env.SITE_URL) return String(process.env.SITE_URL).replace(/\/+$/, '');
  var host = req.headers['x-forwarded-host'] || req.headers.host;
  var proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return proto + '://' + host;
}

async function sendMail(to, link) {
  var from = process.env.MAIL_FROM || 'onboarding@resend.dev';
  var subject = 'Вход в панель управления «Планета Игр»';
  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111a3b;line-height:1.5">' +
    '<h2 style="color:#111a3b;margin:0 0 12px">Вход в панель управления</h2>' +
    '<p>Нажмите кнопку ниже, чтобы войти. Ссылка действует 15 минут и открывается один раз.</p>' +
    '<p style="margin:24px 0"><a href="' + link + '" style="background:#1f5fd6;color:#fff;padding:12px 22px;border-radius:10px;font-weight:800;text-decoration:none">Войти в панель</a></p>' +
    '<p style="color:#6b7690;font-size:13px">Если вы этот вход не запрашивали — просто игнорируйте письмо.</p>' +
    '<p style="color:#6b7690;font-size:12px;word-break:break-all">' + link + '</p>' +
    '</div>';
  var text = 'Вход в панель «Планета Игр». Ссылка действует 15 минут:\n\n' + link + '\n\nЕсли вы её не запрашивали — просто игнорируйте письмо.';
  var response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: from, to: [to], subject: subject, html: html, text: text })
  });
  if (!response.ok) {
    var body = await response.text();
    var err = new Error('Не удалось отправить письмо: ' + (body || response.statusText));
    err.status = 502;
    throw err;
  }
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

    // ---- запрос ссылки на почту ----
    if (action === 'request-link') {
      if (!configured()) return jsonRes(res, 500, { status: 'error', error: 'Не настроены ADMIN_EMAILS, RESEND_API_KEY или GH_TOKEN' });
      var email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonRes(res, 400, { status: 'error', error: 'Введите корректный email' });
      if (!isAllowed(email)) {
        // По безопасности не раскрываем чужие адреса — всегда отвечаем «отправлено».
        return jsonRes(res, 200, { status: 'sent' });
      }
      var linkToken = issue('link', { e: email }, LINK_TTL);
      var link = siteBase(req) + '/admin/#token=' + encodeURIComponent(linkToken);
      await sendMail(email, link);
      return jsonRes(res, 200, { status: 'sent' });
    }

    // ---- превращение ссылки в сессию ----
    if (action === 'verify') {
      var linkData = verify('link', String(body.token || ''));
      if (!linkData || !isAllowed(linkData.e)) return jsonRes(res, 401, { status: 'error', error: 'Ссылка недействительна или устарела' });
      var sessionToken = issue('session', { e: linkData.e }, SESSION_TTL);
      return jsonRes(res, 200, { status: 'ok', session: sessionToken, email: linkData.e });
    }

    // ---- всё остальное требует сессию ----
    if (!configured()) return jsonRes(res, 500, { status: 'error', error: 'сервер не настроен' });
    var auth = req.headers['authorization'] || '';
    var session = verify('session', auth.startsWith('Bearer ') ? auth.slice(7).trim() : '');
    if (!session || !isAllowed(session.e)) return jsonRes(res, 401, { status: 'error', error: 'auth' });

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

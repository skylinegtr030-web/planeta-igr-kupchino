/* Vercel Serverless Function: чтение и обновление заявок из папки orders/.
   GET  /api/orders?token=<GH_TOKEN>&limit=200  → { orders: [...] }
   PATCH /api/orders                            → body { path, status, requestId }
     Смена статуса заявки. Тело: { path: "orders/2026-10/2026-10-15-<uuid>.json", status: "..." }.
   Токен админки передаётся заголовком Authorization: Bearer <GH_TOKEN>.
   Токен посетителей сайта здесь не участвует — только личный токен админа.
   Список статусов: Новая, В работе, Подтверждена, Отклонена.
*/

const OWNER = process.env.GH_OWNER || 'skylinegtr030-web';
const REPO  = process.env.GH_REPO  || 'planeta-igr-kupchino';
const BRANCH = process.env.GH_BRANCH || 'main';
const STATUSES = new Set(['Новая', 'В работе', 'Подтверждена', 'Отклонена']);

function jsonRes(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
}

function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  if (req.query && typeof req.query.token === 'string') return req.query.token;
  return '';
}

async function ghApi(token, path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'planeta-igr-orders'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (response.status === 404) return { __missing: true };
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const err = new Error(body.message || `GitHub HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return body;
}

function decodeBase64(base64) {
  return Buffer.from(String(base64).replace(/\n/g, ''), 'base64').toString('utf8');
}

function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

async function listMonth(token, month) {
  const dir = await ghApi(token, `/contents/orders/${month}?ref=${BRANCH}`);
  if (dir.__missing || !Array.isArray(dir)) return [];
  const files = dir.filter(x => x.type === 'file' && x.name.endsWith('.json'));
  // Читаем содержимое через batching. Файлы небольшие.
  const results = await Promise.all(files.map(async file => {
    try {
      const body = await ghApi(token, `/contents/${file.path}?ref=${BRANCH}`);
      if (body.__missing) return null;
      const order = JSON.parse(decodeBase64(body.content));
      order.__path = file.path;
      order.__sha = body.sha;
      return order;
    } catch (e) {
      return null;
    }
  }));
  return results.filter(Boolean);
}

async function listOrders(token, months) {
  const collected = [];
  for (const month of months) {
    const items = await listMonth(token, month);
    collected.push(...items);
  }
  collected.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return collected;
}

function recentMonths(count) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const token = extractToken(req);
  if (!token) return jsonRes(res, 401, { status: 'error', error: 'token' });

  try {
    if (req.method === 'GET') {
      const monthsCount = Math.max(1, Math.min(12, Number(req.query && req.query.months) || 6));
      const months = recentMonths(monthsCount);
      const orders = await listOrders(token, months);
      return jsonRes(res, 200, { status: 'ok', orders });
    }
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const path = String(body.path || '').replace(/^\/+/, '');
      const status = String(body.status || '');
      if (!path.startsWith('orders/') || !path.endsWith('.json')) return jsonRes(res, 400, { status: 'error', error: 'path' });
      if (!STATUSES.has(status)) return jsonRes(res, 400, { status: 'error', error: 'status' });
      const current = await ghApi(token, `/contents/${path}?ref=${BRANCH}`);
      if (current.__missing) return jsonRes(res, 404, { status: 'error', error: 'not_found' });
      const order = JSON.parse(decodeBase64(current.content));
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await ghApi(token, `/contents/${path}`, {
        method: 'PUT',
        body: {
          message: `order: ${status} — ${order.fio || ''}`,
          content: encodeBase64(JSON.stringify(order, null, 2) + '\n'),
          sha: current.sha,
          branch: BRANCH
        }
      });
      return jsonRes(res, 200, { status: 'ok', order });
    }
    return jsonRes(res, 405, { status: 'error', error: 'method' });
  } catch (err) {
    return jsonRes(res, err.status || 500, { status: 'error', error: err.message || 'server' });
  }
};

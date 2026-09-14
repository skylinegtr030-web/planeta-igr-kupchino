/* Vercel Serverless Function: приём заявок с формы.
   Кладёт заявку в репозиторий как orders/YYYY-MM-DD/<uuid>.json.
   Требуемые переменные окружения проекта на Vercel:
     GH_TOKEN     — fine-grained PAT со скоупом Contents: Read and write для этого репо
     GH_OWNER     — владелец репозитория (по умолчанию skylinegtr030-web)
     GH_REPO      — имя репозитория (по умолчанию planeta-igr-kupchino)
     GH_BRANCH    — ветка (по умолчанию main)
*/

const CATALOG = {
  packs: {
    malysh: { name: 'Малыш JO', duration: 180 },
    jungle: { name: 'Гости в джунглях', duration: 180 },
    king:   { name: 'Король саванны', duration: 180 },
    cyber:  { name: 'Кибер Пати', duration: 180 }
  },
  rooms: {
    'jungle-room': { name: 'Банкетная комната «Джунгли»' },
    'loft-room':   { name: 'Банкетная комната «Лофт»' },
    'duo-room':    { name: '«Джунгли» + «Лофт» — две комнаты сразу' }
  },
  extras: {
    animator:               { name: 'Анимационная программа',                duration: 60 },
    quest:                  { name: 'Квест',                                  duration: 40 },
    masterclass:            { name: 'Мастер-класс',                           duration: 40 },
    sciShow:                { name: 'Научное шоу / Тесла-шоу / Жонглёр-шоу',  duration: 40 },
    bubbles:                { name: 'Мыльные пузыри / Крио-шоу',              duration: 30 },
    pinata:                 { name: 'Пиньята',                                duration: 15 },
    qzar:                   { name: 'Лазертаг Q-ZAR',                         duration: 60 },
    lavaFloor:              { name: 'Лава-пол',                               duration: 30 },
    unlimitedTicket:        { name: 'Входной билет «Безлимит»',               duration: 0  },
    unlimitedTicketWeekend: { name: 'Безлимит в выходные',                    duration: 0  },
    invite:                 { name: 'Именное электронное пригласительное',    duration: 0  },
    tables:                 { name: 'Аренда столиков на площадке',            duration: 60 },
    balloonFountain:        { name: 'Фонтан из 10 гелиевых шаров',            duration: 0  },
    surpriseBalloon:        { name: 'Шар-сюрприз',                            duration: 0  },
    serving:                { name: 'Дополнительная сервировка',              duration: 0  },
    timeCards:              { name: 'Тайм-карты на автоматы (30 минут)',      duration: 30 },
    timeCards60:            { name: 'Тайм-карта 60 минут',                    duration: 60 }
  }
};

const NAME_RE = /^[\p{L}][\p{L}\p{M}]*(?:[-'’]\p{L}[\p{L}\p{M}]*)*$/u;
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function clean(v) { return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''; }
function normPhone(raw) {
  const value = clean(raw);
  if (!/^\+?[\d ()-]+$/.test(value)) return '';
  let d = value.replace(/\D/g, '');
  if (d.length === 10 && !value.startsWith('+')) d = '7' + d;
  if (d.length === 11 && d[0] === '8' && !value.startsWith('+')) d = '7' + d.slice(1);
  if (!/^7\d{10}$/.test(d) || /^(\d)\1{9}$/.test(d.slice(1))) return '';
  return '+' + d;
}
function dateOK(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
function nameOK(value, minParts, max) {
  const parts = value.split(' ');
  return value.length >= 2 && value.length <= max && parts.length >= minParts && parts.length <= 6 &&
    parts.every(p => NAME_RE.test(p));
}
function todayMsk() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const v = {};
  parts.forEach(p => { v[p.type] = p.value; });
  return { date: `${v.year}-${v.month}-${v.day}`, minutes: Number(v.hour) * 60 + Number(v.minute) };
}
function fmtMoney(n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽'; }

function validate(raw) {
  const errors = {};
  const now = todayMsk();
  const extras = Array.isArray(raw.extra) ? raw.extra : (raw.extra ? [raw.extra] : []);
  const d = {
    fio: clean(raw.fio),
    childName: clean(raw.childName),
    phone: normPhone(raw.phone),
    childBday: clean(raw.childBday),
    eventDate: clean(raw.eventDate),
    eventTime: clean(raw.eventTime),
    comment: clean(raw.comment),
    promo: clean(raw.promo).toUpperCase(),
    pack: clean(raw.pack),
    room: clean(raw.room),
    extra: extras.filter(x => typeof x === 'string')
  };
  if (!nameOK(d.fio, 2, 120)) errors.fio = 'Укажите фамилию и имя буквами. Допустимы пробел, дефис и апостроф; не более 120 символов.';
  if (!nameOK(d.childName, 1, 80)) errors.childName = 'Укажите имя буквами, от 2 до 80 символов. Допустимы пробел, дефис и апостроф.';
  if (!d.phone) errors.phone = 'Введите полный номер: +7 и 10 цифр. Можно начать с 8. Буквы и неполные номера не принимаются.';
  if (!dateOK(d.childBday) || d.childBday < '1900-01-01' || d.childBday > now.date) errors.childBday = 'Укажите действительную дату рождения, не позднее сегодняшней.';
  if (!dateOK(d.eventDate) || d.eventDate < now.date) errors.eventDate = 'Выберите сегодняшнюю или будущую дату праздника.';
  if (!errors.childBday && !errors.eventDate && d.childBday > d.eventDate) errors.childBday = 'Дата рождения должна быть не позднее даты праздника.';
  if (d.comment.length > 1000) errors.comment = 'Сократите комментарий до 1 000 символов.';
  if (d.promo && d.promo !== 'PLANETA10') errors.promo = 'Промокод не найден. Проверьте его или оставьте поле пустым.';
  if (d.pack && !CATALOG.packs[d.pack]) errors.pack = 'Выберите пакет из списка.';
  if (d.room && !CATALOG.rooms[d.room]) errors.room = 'Выберите комнату из списка.';
  const extraCounts = {};
  d.extra.forEach(id => { extraCounts[id] = (extraCounts[id] || 0) + 1; });
  if (d.extra.some(id => !CATALOG.extras[id]) ||
      Object.keys(extraCounts).some(id => extraCounts[id] > 30)) errors.extra = 'Выберите дополнительные услуги из списка — не более 30 шт каждой.';
  if (!d.pack && !d.room && !d.extra.length) errors.selection = 'Выберите хотя бы пакет, банкетную комнату или услугу.';

  // Время в часы работы
  let duration = 0;
  const p = CATALOG.packs[d.pack];
  let price = 0;
  if (p && !errors.pack) { duration = p.duration; price = 0; }
  else if (d.room && !errors.room) { duration = 120; price = d.room === 'duo-room' ? 10000 : 7000; }
  else price = 0;
  if (!errors.extra) d.extra.forEach(id => { duration += CATALOG.extras[id].duration; });
  const start = /^\d{2}:\d{2}$/.test(d.eventTime) ? d.eventTime.split(':').map(Number) : [];
  const minutes = start.length ? start[0] * 60 + start[1] : NaN;
  if (!start.length || start[0] > 23 || start[1] > 59 || minutes < 600 || minutes >= 1320) {
    errors.eventTime = 'Выберите время начала в часы работы центра: с 10:00 до 22:00.';
  } else if (!errors.eventDate && d.eventDate === now.date && minutes <= now.minutes) {
    errors.eventTime = 'Это время сегодня уже прошло. Выберите более позднее время или другую дату.';
  } else if (duration && minutes + duration > 1320) {
    errors.eventTime = 'По выбранной программе праздник закончится после 22:00. Выберите более раннее начало или сократите программу.';
  }
  const end = Number.isFinite(minutes) ? minutes + duration : NaN;
  const endTimeText = Number.isFinite(end)
    ? String(Math.floor(end / 60) % 24).padStart(2, '0') + ':' + String(end % 60).padStart(2, '0')
    : '';
  const durationText = [Math.floor(duration / 60) ? Math.floor(duration / 60) + ' ч' : '',
                       duration % 60 ? duration % 60 + ' мин' : ''].filter(Boolean).join(' ');
  return { ok: Object.keys(errors).length === 0, errors, data: d, duration, durationText, endTimeText };
}

function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function jsonRes(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
}

async function githubApi(path, options = {}) {
  const owner = process.env.GH_OWNER || 'skylinegtr030-web';
  const repo  = process.env.GH_REPO  || 'planeta-igr-kupchino';
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error('GH_TOKEN не задан в переменных окружения');
  const url = `https://api.github.com/repos/${owner}/${repo}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'planeta-igr-orders'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = body.message || `GitHub HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return body;
}

async function saveOrder(order) {
  const branch = process.env.GH_BRANCH || 'main';
  const path = `orders/${order.eventDate.slice(0, 7)}/${order.eventDate}-${order.requestId}.json`;
  // Идемпотентность: если файл уже есть, возвращаем как «дубль»
  try {
    await githubApi(`/contents/${path}?ref=${branch}`);
    return { duplicate: true, path };
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  await githubApi(`/contents/${path}`, {
    method: 'PUT',
    body: {
      message: `order: ${order.fio} — ${order.eventDate}`,
      content: encodeBase64(JSON.stringify(order, null, 2) + '\n'),
      branch
    }
  });
  return { duplicate: false, path };
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method === 'GET') { return jsonRes(res, 200, { status: 'ready', version: 'orders-v1' }); }
  if (req.method !== 'POST') { return jsonRes(res, 405, { status: 'error', error: 'method' }); }

  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return jsonRes(res, 200, { status: 'invalid', errors: { fio: 'Некорректная заявка.' } });
    if (raw.website) return jsonRes(res, 200, { status: 'invalid', errors: { fio: 'Некорректная заявка.' } }); // honeypot
    if (JSON.stringify(raw).length > 16000) return jsonRes(res, 200, { status: 'invalid', errors: { fio: 'Некорректная заявка.' } });
    const requestId = clean(raw.requestId);
    if (!UUID_RE.test(requestId)) return jsonRes(res, 200, { status: 'invalid', errors: { fio: 'Некорректная заявка.' } });

    const checked = validate(raw);
    if (!checked.ok) return jsonRes(res, 200, { status: 'invalid', errors: checked.errors });

    const d = checked.data;
    const pack = CATALOG.packs[d.pack];
    const room = CATALOG.rooms[d.room];
    const priceText = clean(raw.priceText);
    const order = {
      requestId,
      createdAt: new Date().toISOString(),
      status: 'Новая',
      fio: d.fio,
      phone: d.phone,
      childName: d.childName,
      childBday: d.childBday,
      eventDate: d.eventDate,
      eventTime: d.eventTime,
      pack: d.pack,
      packName: pack ? pack.name : '',
      room: d.room,
      roomName: room ? room.name : '',
      extra: d.extra,
      extraNames: (function () {
        const times = {};
        d.extra.forEach(id => { times[id] = (times[id] || 0) + 1; });
        return Object.keys(times).map(id => CATALOG.extras[id].name + (times[id] > 1 ? ' ×' + times[id] : ''));
      })(),
      durationText: checked.durationText,
      endTimeText: checked.endTimeText,
      priceText: priceText || '',
      promo: d.promo,
      comment: d.comment
    };

    const saved = await saveOrder(order);
    return jsonRes(res, 200, { status: 'ok', requestId, duplicate: saved.duplicate });
  } catch (err) {
    return jsonRes(res, 500, { status: 'error', error: err.message || 'server' });
  }
};

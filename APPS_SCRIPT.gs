// Built from order-rules.js and the website catalogue. Deploy with the V8 runtime.
var ORDER_CATALOG = {
  "packs": {
    "malysh": {
      "name": "Малыш JO",
      "price": 24500,
      "guests": "До 6 гостей",
      "duration": 180
    },
    "jungle": {
      "name": "Гости в джунглях",
      "price": 33000,
      "guests": "До 8 гостей",
      "duration": 180
    },
    "king": {
      "name": "Король саванны",
      "price": 50500,
      "guests": "До 10 гостей",
      "duration": 240
    },
    "cyber": {
      "name": "Кибер Пати",
      "price": 36500,
      "guests": "До 10 гостей",
      "duration": 180
    }
  },
  "rooms": {
    "jungle-room": {
      "name": "Банкетная комната «Джунгли»"
    },
    "loft-room": {
      "name": "Банкетная комната «Лофт»"
    }
  },
  "extras": {
    "animator": {
      "name": "Анимационная программа",
      "price": 7500,
      "duration": 60,
      "emoji": "🎭",
      "c1": "#ffc72c",
      "c2": "#e2231a",
      "desc": "Аниматор в костюме любимого персонажа на 1 час — игры, конкурсы и хорошее настроение для всех гостей."
    },
    "quest": {
      "name": "Квест",
      "price": 8500,
      "duration": 40,
      "emoji": "🗝️",
      "c1": "#1f5fd6",
      "c2": "#111a3b",
      "upto": "до 12 человек",
      "desc": "Квест с ведущим на выбор — 40 минут ярких приключений для команды именинника.",
      "options": [
        { "name": "Академия Супергероев", "meta": "5–8 лет · 40 мин" },
        { "name": "Форт Боярд", "meta": "6–10 лет · 45 мин" },
        { "name": "Алиса в Стране Чудес", "meta": "5–8 лет · 40 мин" },
        { "name": "Мультиквест", "meta": "5–6 лет · 40 мин" }
      ]
    },
    "masterclass": {
      "name": "Мастер-класс",
      "price": 10000,
      "duration": 40,
      "emoji": "🎨",
      "c1": "#28a745",
      "c2": "#63e6ff",
      "upto": "до 10 человек",
      "desc": "Творческий мастер-класс на выбор — 40 минут, всё оборудование и материалы включены.",
      "options": [
        { "name": "Слайм-лаборатория", "meta": "5+ лет · 30–40 мин" },
        { "name": "Пушистый Монстрик", "meta": "4+ лет · 30–40 мин" },
        { "name": "Свеча из вощины", "meta": "5+ лет · 25–30 мин" },
        { "name": "Роспись шопера", "meta": "6+ лет · 40–60 мин" },
        { "name": "Магнитик на память", "meta": "4+ лет · 25–30 мин" }
      ]
    },
    "sciShow": {
      "name": "Научное шоу / Тесла-шоу / Жонглёр-шоу",
      "price": 12000,
      "duration": 40,
      "emoji": "⚡",
      "c1": "#7b2fd6",
      "c2": "#1f5fd6",
      "upto": "до 15 человек",
      "desc": "Эффектная программа на выбор — химические опыты, шоу катушки Тесла или зажигательный жонглёр. 40 минут ярких эмоций.",
      "options": [
        { "name": "Научное шоу", "meta": "до 15 чел · 40 мин" },
        { "name": "Тесла-шоу", "meta": "до 15 чел · 40 мин" },
        { "name": "Жонглёр-шоу", "meta": "до 15 чел · 40 мин" }
      ]
    },
    "bubbles": {
      "name": "Мыльные пузыри / Крио-шоу",
      "price": 9000,
      "duration": 30,
      "emoji": "🫧",
      "c1": "#28a745",
      "c2": "#8fe3a6",
      "photo": "extra-bubbles.jpg",
      "upto": "до 15 человек",
      "desc": "Шоу гигантских мыльных пузырей или эффектное крио-шоу с холодным паром — на выбор. 30 минут зрелища для всей компании."
    },
    "pinata": {
      "name": "Пиньята",
      "price": 4000,
      "duration": 15,
      "emoji": "🪩",
      "c1": "#e2231a",
      "c2": "#ffc72c",
      "desc": "Яркая пиньята со сладкими сюрпризами внутри — весёлая традиция для завершения праздника."
    },
    "qzar": {
      "name": "Лазертаг Q-ZAR",
      "price": 17000,
      "duration": 60,
      "emoji": "🔫",
      "c1": "#111a3b",
      "c2": "#1f5fd6",
      "upto": "до 12 человек",
      "desc": "Командные лазерные бои в неоновом лабиринте с бластерами — час азартной игры для именинника и его команды."
    },
    "lavaFloor": {
      "name": "Лава-пол",
      "price": 2500,
      "duration": 30,
      "emoji": "🌋",
      "c1": "#e2231a",
      "c2": "#ffc72c",
      "desc": "Светящийся интерактивный пол с игровыми режимами — «пол это лава», догонялки со светом и реакция на скорость."
    },
    "unlimitedTicket": {
      "name": "Входной билет «Безлимит»",
      "price": 1500,
      "duration": 0,
      "emoji": "🎟️",
      "c1": "#1f5fd6",
      "c2": "#28a745",
      "desc": "Безлимитное посещение игровой площадки на весь день — 1 500 ₽ в будни, 1 800 ₽ в выходные и праздники."
    },
    "invite": {
      "name": "Именное электронное пригласительное",
      "price": 500,
      "duration": 0,
      "emoji": "💌",
      "c1": "#e2231a",
      "c2": "#ffc72c",
      "desc": "Именная электронная открытка-приглашение для гостей праздника — удобно разослать всем заранее."
    },
    "tables": {
      "name": "Аренда столиков на площадке",
      "price": 1000,
      "duration": 60,
      "emoji": "🪨",
      "c1": "#28a745",
      "c2": "#1f5fd6",
      "desc": "Столик на игровой площадке — 1 000 ₽ за час или 5 000 ₽ за безлимитное пребывание в течение дня."
    },
    "balloonFountain": {
      "name": "Фонтан из 10 гелиевых шаров",
      "price": 2600,
      "duration": 0,
      "emoji": "🎈",
      "c1": "#1f5fd6",
      "c2": "#e2231a",
      "desc": "Яркий фонтан из десяти гелиевых шаров для оформления праздничного стола или фотозоны."
    },
    "surpriseBalloon": {
      "name": "Шар-сюрприз",
      "price": 2500,
      "duration": 0,
      "emoji": "🎁",
      "c1": "#e2231a",
      "c2": "#28a745",
      "desc": "Большой шар с сюрпризом внутри — эффектный момент праздника, когда именинник его лопает."
    },
    "serving": {
      "name": "Дополнительная сервировка",
      "price": 1000,
      "duration": 0,
      "emoji": "🍽️",
      "c1": "#ffc72c",
      "c2": "#28a745",
      "desc": "Дополнительный комплект праздничной сервировки стола на одного гостя сверх включённого в пакет."
    },
    "timeCards": {
      "name": "Тайм-карты на автоматы",
      "price": 1290,
      "duration": 30,
      "emoji": "⏳",
      "c1": "#7b2fd6",
      "c2": "#ffc72c",
      "desc": "Безлимитная тайм-карта на игровые автоматы — 1 290 ₽ за 30 минут или 2 190 ₽ за 60 минут."
    }
  }
};
/* Shared browser / Apps Script validation. All dates use the centre's timezone. */
(function (root) {
  'use strict';
  const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  const dateOK = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T00:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
  };
  const nameOK = (value, minParts, max) => {
    const parts = value.split(' ');
    return value.length >= 2 && value.length <= max && parts.length >= minParts &&
      parts.length <= 6 && parts.every(p => /^\p{L}[\p{L}\p{M}]*(?:[-'’]\p{L}[\p{L}\p{M}]*)*$/u.test(p));
  };
  function clock(now) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now || new Date());
    const v = {};
    parts.forEach(p => { v[p.type] = p.value; });
    return { date: `${v.year}-${v.month}-${v.day}`, minutes: Number(v.hour) * 60 + Number(v.minute) };
  }
  function phone(value) {
    const raw = clean(value);
    if (!/^\+?[\d ()-]+$/.test(raw)) return '';
    let d = raw.replace(/\D/g, '');
    if (d.length === 10 && !raw.startsWith('+')) d = '7' + d;
    if (d.length === 11 && d[0] === '8' && !raw.startsWith('+')) d = '7' + d.slice(1);
    if (!/^7\d{10}$/.test(d) || /^(\d)\1{9}$/.test(d.slice(1))) return '';
    return '+' + d;
  }
  function validate(raw, catalog, now) {
    const errors = {};
    const current = clock(now);
    const d = {
      fio: clean(raw.fio), childName: clean(raw.childName), phone: phone(raw.phone),
      childBday: clean(raw.childBday), eventDate: clean(raw.eventDate), eventTime: clean(raw.eventTime),
      comment: clean(raw.comment), promo: clean(raw.promo).toUpperCase(),
      pack: clean(raw.pack), room: clean(raw.room),
      extra: Array.isArray(raw.extra) ? raw.extra : raw.extra ? [raw.extra] : []
    };
    if (!nameOK(d.fio, 2, 120)) errors.fio = 'Укажите фамилию и имя буквами. Допустимы пробел, дефис и апостроф; не более 120 символов.';
    if (!nameOK(d.childName, 1, 80)) errors.childName = 'Укажите имя буквами, от 2 до 80 символов. Допустимы пробел, дефис и апостроф.';
    if (!d.phone) errors.phone = 'Введите полный номер: +7 и 10 цифр. Можно начать с 8. Буквы и неполные номера не принимаются.';
    if (!dateOK(d.childBday) || d.childBday < '1900-01-01' || d.childBday > current.date) {
      errors.childBday = 'Укажите действительную дату рождения, не позднее сегодняшней.';
    }
    if (!dateOK(d.eventDate) || d.eventDate < current.date) errors.eventDate = 'Выберите сегодняшнюю или будущую дату праздника.';
    if (!errors.childBday && !errors.eventDate && d.childBday > d.eventDate) errors.childBday = 'Дата рождения должна быть не позднее даты праздника.';
    if (d.comment.length > 1000) errors.comment = 'Сократите комментарий до 1 000 символов.';
    if (d.promo && d.promo !== 'PLANETA10') errors.promo = 'Промокод не найден. Проверьте его или оставьте поле пустым.';
    if (d.pack && !Object.prototype.hasOwnProperty.call(catalog.packs, d.pack)) errors.pack = 'Выберите пакет из списка.';
    if (d.room && !Object.prototype.hasOwnProperty.call(catalog.rooms, d.room)) errors.room = 'Выберите комнату из списка.';
    if (d.extra.length > Object.keys(catalog.extras).length ||
        d.extra.some(id => typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(catalog.extras, id)) ||
        new Set(d.extra).size !== d.extra.length) errors.extra = 'Выберите дополнительные услуги из списка.';
    if (!d.pack && !d.room && !d.extra.length) errors.selection = 'Выберите хотя бы пакет, банкетную комнату или услугу.';
    let duration = 0, price = 0;
    const p = catalog.packs[d.pack];
    if (p && !errors.pack) { duration = p.duration; price = p.price; }
    else if (d.room && !errors.room) { duration = 120; price = 7000; }
    if (!errors.extra) d.extra.forEach(id => { duration += catalog.extras[id].duration; price += catalog.extras[id].price; });
    const discount = d.promo === 'PLANETA10' ? Math.round(price * .1) : 0;
    const start = /^\d{2}:\d{2}$/.test(d.eventTime) ? d.eventTime.split(':').map(Number) : [];
    const minutes = start[0] * 60 + start[1];
    if (!start.length || start[0] > 23 || start[1] > 59 || minutes < 600 || minutes >= 1320) {
      errors.eventTime = 'Выберите время начала в часы работы центра: с 10:00 до 22:00.';
    } else if (!errors.eventDate && d.eventDate === current.date && minutes <= current.minutes) {
      errors.eventTime = 'Это время сегодня уже прошло. Выберите более позднее время или другую дату.';
    } else if (duration && minutes + duration > 1320) {
      errors.eventTime = 'По выбранной программе праздник закончится после 22:00. Выберите более раннее начало или сократите программу.';
    }
    const end = minutes + duration;
    return {
      ok: Object.keys(errors).length === 0, errors, data: d, duration,
      price: price - discount, discount,
      durationText: [Math.floor(duration / 60) ? Math.floor(duration / 60) + ' ч' : '', duration % 60 ? duration % 60 + ' мин' : ''].filter(Boolean).join(' '),
      endTimeText: Number.isFinite(end) ? String(Math.floor(end / 60) % 24).padStart(2, '0') + ':' + String(end % 60).padStart(2, '0') : ''
    };
  }
  root.OrderRules = { validate, clock, phone };
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* Generated deployment: shared rules plus authoritative catalogue. No sheet data is exposed. */
function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return jsonReply({ status: 'ready', version: 'validation-v2' });
}
function doPost(e) {
  var lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 16000) return jsonReply({ status: 'invalid', errors: { fio: 'Некорректная заявка.' } });
    var raw = JSON.parse(e.postData.contents);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.website) return jsonReply({ status: 'invalid', errors: { fio: 'Некорректная заявка.' } });
    var checked = OrderRules.validate(raw, ORDER_CATALOG, new Date());
    if (!checked.ok) return jsonReply({ status: 'invalid', errors: checked.errors });
    var requestId = raw.requestId || Utilities.getUuid();
    if (typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) return jsonReply({ status: 'error' });
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return jsonReply({ status: 'error' });
    var sheet = SpreadsheetApp.openById('1boDLPH_fv4ndJKNZG-VWJaWLUVZ6L5YDAVD8ZJ_mA6M').getSheetByName('Заявки');
    if (!sheet) throw new Error('Missing worksheet');
    // Keep the established 16 columns. Column Q is the technical idempotency key.
    var header = sheet.getRange(1, 17);
    if (header.getValue() && header.getValue() !== 'ИД заявки') throw new Error('Unexpected column Q');
    if (!header.getValue()) header.setValue('ИД заявки');
    if (sheet.getLastRow() > 1) {
      var existing = sheet.getRange(2, 17, sheet.getLastRow() - 1, 1)
        .createTextFinder(requestId).matchEntireCell(true).findNext();
      if (existing) return jsonReply({ status: 'ok', requestId: requestId, duplicate: true });
    }
    var d = checked.data;
    var pack = ORDER_CATALOG.packs[d.pack];
    var room = ORDER_CATALOG.rooms[d.room];
    var priceText = checked.price.toLocaleString('ru-RU') + ' ₽';
    if (checked.discount) priceText += ' (со скидкой 10%)';
    var row = [
      Utilities.formatDate(new Date(), 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss'),
      d.fio, d.phone, d.childName, d.childBday, d.eventDate, d.eventTime,
      pack ? pack.name : '', room ? room.name : '',
      d.extra.map(function (id) { return ORDER_CATALOG.extras[id].name; }).join(', '),
      checked.durationText, checked.endTimeText, priceText, d.promo, d.comment, 'Новая', requestId
    ].map(function (value) {
      // Treat user-supplied text as text, never as a spreadsheet formula.
      var text = String(value);
      return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
    });
    var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    target.setNumberFormat('@');
    target.setValues([row]);
    SpreadsheetApp.flush();
    return jsonReply({ status: 'ok', requestId: requestId });
  } catch (error) {
    return jsonReply({ status: 'error' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

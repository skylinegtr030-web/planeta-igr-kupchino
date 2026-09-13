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

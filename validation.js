/* Connected after the page's catalogue and shared rules. */
(function () {
  'use strict';
  const form = document.getElementById('orderForm');
  const fields = ['fio', 'phone', 'childName', 'childBday', 'eventDate', 'eventTime', 'comment', 'promo'];
  const catalog = { packs: PACKS, rooms: ROOMS, extras: EXTRAS };
  const touched = new Set();
  let attempted = false, busy = false, requestId = '', lastPayload = '';
  const status = document.getElementById('orderSentMsg');
  const button = form.querySelector('[type=submit]');
  function values() {
    const data = {};
    new FormData(form).forEach((v, k) => { if (k !== 'extra') data[k] = v; });
    data.extra = [...form.querySelectorAll('[name=extra]:checked')].map(c => c.value);
    return data;
  }
  function render(errors, all) {
    fields.forEach(name => {
      const el = form.elements.namedItem(name);
      const message = (all || touched.has(name)) ? errors[name] || '' : '';
      el.setAttribute('aria-invalid', message ? 'true' : 'false');
      document.getElementById('error-' + name).textContent = message;
    });
    document.getElementById('error-selection').textContent = all ? errors.selection || errors.pack || errors.room || errors.extra || '' : '';
  }
  function result() {
    const today = OrderRules.clock().date;
    form.eventDate.min = today;
    form.childBday.max = today;
    return OrderRules.validate(values(), catalog);
  }
  function showStatus(text, error) {
    status.textContent = text;
    status.style.display = text ? 'block' : 'none';
    status.style.color = error ? '#a91616' : '#24633a';
  }
  fields.forEach(name => {
    const el = form.elements.namedItem(name);
    el.addEventListener('blur', () => {
      touched.add(name);
      if (name === 'phone') {
        const p = OrderRules.phone(el.value);
        if (p) el.value = `${p.slice(0, 2)} (${p.slice(2, 5)}) ${p.slice(5, 8)}-${p.slice(8, 10)}-${p.slice(10)}`;
      }
      render(result().errors, attempted);
    });
  });
  form.addEventListener('input', () => {
    recalc();
    render(result().errors, attempted);
    if (!busy) showStatus('', false);
  });
  form.addEventListener('change', () => { recalc(); render(result().errors, attempted); });
  function focusError() {
    const first = form.querySelector('[aria-invalid=true]');
    if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    else document.getElementById('error-selection').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  window.submitOrder = async function (e) {
    e.preventDefault();
    if (busy) return;
    attempted = true;
    const checked = result();
    render(checked.errors, true);
    if (!checked.ok) { showStatus('Проверьте отмеченные поля. Заявка ещё не отправлена.', true); focusError(); return; }
    recalc();
    const payload = { ...checked.data, website: form.website.value };
    const signature = JSON.stringify(payload);
    if (signature !== lastPayload || !requestId) {
      requestId = crypto.randomUUID();
      lastPayload = signature;
    }
    payload.requestId = requestId;
    busy = true; button.disabled = true; button.textContent = 'Отправляем…';
    form.setAttribute('aria-busy', 'true');
    showStatus('', false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const ENDPOINT = (window.PLANETA_CONFIG && window.PLANETA_CONFIG.sheetWebhookUrl) ||
        'https://script.google.com/macros/s/AKfycbxyNdqz_-U_DDZRGyIF-2y_sITJwBbsH7Q5CHRtBs2e8lMFGB532Ne10q99xbeRi4m9Vw/exec';
      if (!ENDPOINT) throw new Error('unconfigured');
      const response = await fetch(ENDPOINT, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('http');
      const reply = await response.json();
      if (reply.status === 'invalid') {
        render(reply.errors || {}, true);
        showStatus('Проверьте отмеченные поля. Заявка не отправлена.', true);
        focusError(); return;
      }
      if (reply.status !== 'ok') throw new Error('server');
      showStatus('Заявка записана. Мы свяжемся с вами для подтверждения праздника.', false);
      form.reset(); touched.clear(); attempted = false; requestId = ''; lastPayload = '';
      renderOrderOptions(); recalc(); render({}, true);
    } catch (err) {
      showStatus('Не удалось подтвердить запись заявки. Данные сохранены в форме. Проверьте интернет и повторите отправку; если проблема останется, позвоните нам.', true);
    } finally {
      clearTimeout(timer); busy = false; button.disabled = false;
      button.textContent = 'Отправить заявку'; form.removeAttribute('aria-busy');
    }
  };
  // No native English tooltips: all validation messages are inline, in Russian.
  form.noValidate = true;
  result();
})();

/* Sync EXTRAS catalogue and room base price with the updated price list (photo, Sep 2026). */
(function () {
  'use strict';
  Object.keys(EXTRAS).forEach(function (k) { delete EXTRAS[k]; });
  Object.assign(EXTRAS, {
    animator: { name: 'Анимационная программа', price: 7500, duration: 60, emoji: '🎭', c1: '#ffc72c', c2: '#e2231a',
      desc: 'Аниматор в костюме любимого персонажа на 1 час — игры, конкурсы и хорошее настроение для всех гостей.' },
    quest: { name: 'Квест', price: 8500, duration: 40, emoji: '🗝️', c1: '#1f5fd6', c2: '#111a3b', upto: 'до 12 человек',
      desc: 'Квест с ведущим на выбор — 40 минут ярких приключений для команды именинника.',
      options: [
        { name: 'Академия Супергероев', meta: '5–8 лет · 40 мин' },
        { name: 'Форт Боярд', meta: '6–10 лет · 45 мин' },
        { name: 'Алиса в Стране Чудес', meta: '5–8 лет · 40 мин' },
        { name: 'Мультиквест', meta: '5–6 лет · 40 мин' }
      ] },
    masterclass: { name: 'Мастер-класс', price: 10000, duration: 40, emoji: '🎨', c1: '#28a745', c2: '#63e6ff', upto: 'до 10 человек',
      desc: 'Творческий мастер-класс на выбор — 40 минут, всё оборудование и материалы включены.',
      options: [
        { name: 'Слайм-лаборатория', meta: '5+ лет · 30–40 мин' },
        { name: 'Пушистый Монстрик', meta: '4+ лет · 30–40 мин' },
        { name: 'Свеча из вощины', meta: '5+ лет · 25–30 мин' },
        { name: 'Роспись шопера', meta: '6+ лет · 40–60 мин' },
        { name: 'Магнитик на память', meta: '4+ лет · 25–30 мин' }
      ] },
    sciShow: { name: 'Научное шоу / Тесла-шоу / Жонглёр-шоу', price: 12000, duration: 40, emoji: '⚡', c1: '#7b2fd6', c2: '#1f5fd6', upto: 'до 15 человек',
      desc: 'Эффектная программа на выбор — химические опыты, шоу катушки Тесла или зажигательный жонглёр. 40 минут ярких эмоций.',
      options: [
        { name: 'Научное шоу', meta: 'до 15 чел · 40 мин' },
        { name: 'Тесла-шоу', meta: 'до 15 чел · 40 мин' },
        { name: 'Жонглёр-шоу', meta: 'до 15 чел · 40 мин' }
      ] },
    bubbles: { name: 'Мыльные пузыри / Крио-шоу', price: 9000, duration: 30, emoji: '🫧', c1: '#28a745', c2: '#8fe3a6', photo: 'extra-bubbles.jpg', upto: 'до 15 человек',
      desc: 'Шоу гигантских мыльных пузырей или эффектное крио-шоу с холодным паром — на выбор. 30 минут зрелища для всей компании.' },
    pinata: { name: 'Пиньята', price: 4000, duration: 15, emoji: '🪅', c1: '#e2231a', c2: '#ffc72c',
      desc: 'Яркая пиньята со сладкими сюрпризами внутри — весёлая традиция для завершения праздника.' },
    qzar: { name: 'Лазертаг Q-ZAR', price: 17000, duration: 60, emoji: '🔫', c1: '#111a3b', c2: '#1f5fd6', upto: 'до 12 человек',
      desc: 'Командные лазерные бои в неоновом лабиринте с бластерами — час азартной игры для именинника и его команды.' },
    lavaFloor: { name: 'Лава-пол', price: 2500, duration: 30, emoji: '🌋', c1: '#e2231a', c2: '#ffc72c',
      desc: 'Светящийся интерактивный пол с игровыми режимами — «пол это лава», догонялки со светом и реакция на скорость.' },
    unlimitedTicket: { name: 'Входной билет «Безлимит»', price: 1500, duration: 0, emoji: '🎟️', c1: '#1f5fd6', c2: '#28a745',
      desc: 'Безлимитное посещение игровой площадки на весь день — 1 500 ₽ в будни, 1 800 ₽ в выходные и праздники.' },
    invite: { name: 'Именное электронное пригласительное', price: 500, duration: 0, emoji: '💌', c1: '#e2231a', c2: '#ffc72c',
      desc: 'Именная электронная открытка-приглашение для гостей праздника — удобно разослать всем заранее.' },
    tables: { name: 'Аренда столиков на площадке', price: 1000, duration: 60, emoji: '🪑', c1: '#28a745', c2: '#1f5fd6',
      desc: 'Столик на игровой площадке — 1 000 ₽ за час или 5 000 ₽ за безлимитное пребывание в течение дня.' },
    balloonFountain: { name: 'Фонтан из 10 гелиевых шаров', price: 2600, duration: 0, emoji: '🎈', c1: '#1f5fd6', c2: '#e2231a',
      desc: 'Яркий фонтан из десяти гелиевых шаров для оформления праздничного стола или фотозоны.' },
    surpriseBalloon: { name: 'Шар-сюрприз', price: 2500, duration: 0, emoji: '🎁', c1: '#e2231a', c2: '#28a745',
      desc: 'Большой шар с сюрпризом внутри — эффектный момент праздника, когда именинник его лопает.' },
    serving: { name: 'Дополнительная сервировка', price: 1000, duration: 0, emoji: '🍽️', c1: '#ffc72c', c2: '#28a745',
      desc: 'Дополнительный комплект праздничной сервировки стола на одного гостя сверх включённого в пакет.' },
    timeCards: { name: 'Тайм-карты на автоматы', price: 1290, duration: 30, emoji: '⏳', c1: '#7b2fd6', c2: '#ffc72c',
      desc: 'Безлимитная тайм-карта на игровые автоматы — 1 290 ₽ за 30 минут или 2 190 ₽ за 60 минут.' }
  });

  window.recalc = function () {
    const form = document.getElementById('orderForm');
    const packId = form.pack.value;
    const roomVal = form.room.value;
    const extraChecks = [...form.querySelectorAll('input[name="extra"]:checked')].map(c => c.value);
    let duration = 0, price = 0;
    if (packId && PACKS[packId]) {
      duration += PACKS[packId].duration;
      price += PACKS[packId].price;
    } else if (roomVal) {
      duration += 120; price += 7000;
    }
    extraChecks.forEach(id => { duration += EXTRAS[id].duration; price += EXTRAS[id].price; });
    const promo = (form.promo.value || '').trim().toUpperCase();
    let discount = 0;
    if (promo === 'PLANETA10' && price > 0) { discount = Math.round(price * 0.1); price -= discount; }
    const hrs = Math.floor(duration / 60), mins = duration % 60;
    const durationText = duration > 0 ? (hrs > 0 ? hrs + ' ч ' : '') + (mins > 0 ? mins + ' мин' : '').trim() : '—';
    document.getElementById('sumDuration').textContent = durationText || '—';
    let endText = '—';
    if (form.eventTime.value && duration > 0) {
      const [h, m] = form.eventTime.value.split(':').map(Number);
      const totalMin = h * 60 + m + duration;
      const eh = Math.floor((totalMin % 1440) / 60), em = totalMin % 60;
      endText = String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0');
    }
    document.getElementById('sumEnd').textContent = endText;
    let priceText = price > 0 ? price.toLocaleString('ru-RU') + ' ₽' : '—';
    let priceTextPlain = price > 0 ? price.toLocaleString('ru-RU') + ' ₽' : '';
    if (discount > 0) {
      priceText += ` <span class="order-discount">(скидка 10%: −${discount.toLocaleString('ru-RU')} ₽)</span>`;
      priceTextPlain += ` (со скидкой 10%, без скидки: ${(price + discount).toLocaleString('ru-RU')} ₽)`;
    }
    document.getElementById('sumPrice').innerHTML = priceText;
    document.getElementById('hPackName').value = packId && PACKS[packId] ? PACKS[packId].name + ' — ' + PACKS[packId].price.toLocaleString('ru-RU') + ' ₽' : '';
    document.getElementById('hRoomName').value = roomVal && ROOMS[roomVal] ? ROOMS[roomVal].name : '';
    document.getElementById('hExtrasNames').value = extraChecks.map(id => EXTRAS[id].name).join(', ');
    document.getElementById('hDurationText').value = durationText || '';
    document.getElementById('hEndTimeText').value = endText === '—' ? '' : endText;
    document.getElementById('hPriceText').value = priceTextPlain;
  };

  var note = document.querySelector('.room-note');
  if (note) note.textContent = 'Аренда банкетной комнаты — 7 000 ₽ / 2 часа · продление — 3 500 ₽ / час · аренда двух комнат одновременно — 10 000 ₽ / 2 часа';
  if (typeof renderExtras === 'function') renderExtras();
  if (typeof renderOrderOptions === 'function') renderOrderOptions();
  if (typeof recalc === 'function') recalc();
})();

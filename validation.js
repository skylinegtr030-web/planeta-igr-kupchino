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
    form.querySelectorAll('[data-extra-qty]').forEach(row => {
      const n = parseInt(row.dataset.count || '0', 10);
      for (let i = 0; i < n; i++) data.extra.push(row.dataset.extraQty);
    });
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
    const priceEl = form.querySelector('[name=priceText]');
    const payload = { ...checked.data, website: form.website.value, priceText: priceEl ? priceEl.value : '' };
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
      const ENDPOINT = (window.PLANETA_CONFIG && window.PLANETA_CONFIG.orderEndpoint) || '/api/order';
      const response = await fetch(ENDPOINT, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
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
    const extraChecks = [...form.querySelectorAll('[name=extra]:checked')].map(c => c.value);
    form.querySelectorAll('[data-extra-qty]').forEach(row => {
      const n = parseInt(row.dataset.count || '0', 10);
      for (let i = 0; i < n; i++) extraChecks.push(row.dataset.extraQty);
    });
    let duration = 0, price = 0;
    if (packId && PACKS[packId]) {
      duration += PACKS[packId].duration;
      price += PACKS[packId].price;
    } else if (roomVal) {
      const rc = (window.PG_CONTENT && window.PG_CONTENT.rooms) || {};
      duration += 120;
      price += roomVal === 'duo-room' ? (rc.duoBase || 10000) : (rc.roomBase || 7000);
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
    const extraTimes = {};
    extraChecks.forEach(id => { extraTimes[id] = (extraTimes[id] || 0) + 1; });
    document.getElementById('hExtrasNames').value = Object.keys(extraTimes).map(id => EXTRAS[id].name + (extraTimes[id] > 1 ? ' ×' + extraTimes[id] : '')).join(', ');
    document.getElementById('hDurationText').value = durationText || '';
    document.getElementById('hEndTimeText').value = endText === '—' ? '' : endText;
    document.getElementById('hPriceText').value = priceTextPlain;
  };

  var rooms = document.getElementById('rooms');
  var note = document.querySelector('.room-note');
  if (rooms && note && !document.getElementById('roomDuo')) {
    var css = document.createElement('style');
    css.textContent =
      '.rm-price{font-size:1.8rem;font-weight:900;color:var(--red);margin:0 0 14px}' +
      '.rm-price small{display:block;font-size:.82rem;font-weight:700;color:#8a93ab;margin-top:2px}' +
      '.rm-duo{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
      '.rm-duo img{width:100%;height:340px;object-fit:cover;border-radius:20px;box-shadow:0 16px 40px rgba(17,26,59,.16);transition:.4s}' +
      '.rm-duo img:hover{transform:scale(1.03)}' +
      '.room-note{font-size:.85rem;font-weight:700;color:#8a93ab;margin-top:24px}' +
      '@media(max-width:900px){.rm-duo img{height:200px}}';
    document.head.appendChild(css);

    var rc = (window.PG_CONTENT && window.PG_CONTENT.rooms) || {};
    var priceHtml = String(rc.roomBase || 7000).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ' \u20bd<small>за 2 часа \u00b7 любая из комнат</small>';
    var singles = rooms.querySelectorAll('.activity');
    Array.prototype.forEach.call(singles, function (row) {
      var link = row.querySelector('a.btn');
      if (!link || row.querySelector('.rm-price')) return;
      var p = document.createElement('div');
      p.className = 'rm-price';
      p.innerHTML = priceHtml;
      link.parentNode.insertBefore(p, link);
    });

    if (singles.length) {
      var duo = singles[0].cloneNode(true);
      duo.id = 'roomDuo';
      duo.className = 'activity';
      var badge = duo.querySelector('.badge');
      if (badge) { badge.className = 'badge blue'; badge.textContent = 'Большая компания'; }
      var title = duo.querySelector('h3');
      if (title) title.textContent = 'Две комнаты одновременно';
      var text = duo.querySelector('p');
      if (text) text.textContent = 'Забираете «Джунгли» и «Лофт» целиком: в одной комнате накрытый стол, в другой фотозона и активности. Удобно, когда гостей много или взрослые хотят посидеть отдельно от детей.';
      var duoPrice = duo.querySelector('.rm-price');
      if (duoPrice) duoPrice.innerHTML = String(rc.duoBase || 10000).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ' \u20bd<small>за 2 часа \u00b7 «Джунгли» + «Лофт»</small>';
      var duoLink = duo.querySelector('a.btn');
      if (duoLink) {
        duoLink.textContent = 'Добавить в корзину';
        duoLink.setAttribute('onclick', "openOrder(null,'duo-room')");
      }
      var oldImg = duo.querySelector('img');
      if (oldImg) {
        var pair = document.createElement('div');
        pair.className = 'rm-duo';
        pair.innerHTML =
          '<img src="room-jungle-1.jpg" alt="Комната «Джунгли»" loading="lazy" decoding="async">' +
          '<img src="room-loft-1.jpg" alt="Комната «Лофт»" loading="lazy" decoding="async">';
        oldImg.parentNode.replaceChild(pair, oldImg);
      }
      note.parentNode.insertBefore(duo, note);
    }

    note.textContent = 'Продление — 3 500 \u20bd за каждый следующий час';
  }
  // Обновление цен комнат при поступлении данных из панели
  function refreshRoomPrices() {
    var rc = (window.PG_CONTENT && window.PG_CONTENT.rooms) || {};
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    var single = rc.roomBase || 7000;
    var duoP = rc.duoBase || 10000;
    Array.prototype.forEach.call(
      document.querySelectorAll('#rooms .activity:not(#roomDuo) .rm-price'),
      function (el) { el.innerHTML = fmt(single) + ' \u20bd<small>за 2 часа \u00b7 любая из комнат</small>'; }
    );
    var dp = document.querySelector('#roomDuo .rm-price');
    if (dp) dp.innerHTML = fmt(duoP) + ' \u20bd<small>за 2 часа \u00b7 «Джунгли» + «Лофт»</small>';
  }
  window.addEventListener('pg:content', refreshRoomPrices);

  if (typeof renderExtras === 'function') renderExtras();
  if (typeof renderOrderOptions === 'function') renderOrderOptions();
  if (typeof recalc === 'function') recalc();
})();

/* Rich programme details for quests, master-classes and shows (posters, Sep 2026). */
(function () {
  'use strict';
  var PROGRAMS = {
    quest: [
      { name: 'Академия Супергероев', emoji: '🦸', age: '5–8 лет', time: '40 минут',
        desc: 'Настало время стать настоящими супергероями! Под руководством любимого героя ребятам предстоит пройти обучение в секретной Академии, выполнить самые сложные миссии, проявить ловкость, смекалку и командный дух.',
        list: ['любимый Супергерой', 'личная Лицензия Супергероя', 'секретные спецгаджеты', 'карта тайной базы', '«блокбастерные» испытания', 'задания на ловкость, скорость и смекалку', 'торжественное посвящение в супергерои'] },
      { name: 'Форт Боярд', emoji: '🗝️', age: '6–10 лет', time: '45 минут',
        desc: 'Только настоящая команда сможет открыть сокровищницу и завладеть главным кладом!',
        list: ['таинственный Мастер Теней', 'уникальный тематический реквизит', 'поиск ключей и подсказок', 'захватывающие испытания', 'задания на силу, ловкость и смекалку', 'оригинальная сокровищница', 'сладкие подарки каждому участнику'] },
      { name: 'Алиса в Стране Чудес', emoji: '🐰', age: '5–8 лет', time: '40 минут',
        desc: '«Я опаздываю! Ох, как я опаздываю!» Белый Кролик уже ждёт своих друзей, ведь впереди удивительное путешествие в волшебное Зазеркалье.',
        list: ['любимый герой Зазеркалья', 'сказочные испытания', 'скачки на фламинго', 'загадки Красной Королевы', '«Безумное чаепитие»', 'измеритель Счастья', 'яркий праздничный финал'] },
      { name: 'Мультиквест', emoji: '🎁', age: '5–6 лет', time: '40 минут',
        desc: 'Сокровища нашего парка ждут самых смелых и весёлых ребят!',
        list: ['задания на самых популярных аттракционах', 'весёлые танцевальные активности', 'динамичные испытания', 'интересные головоломки', 'Измеритель Счастья', 'сладкий подарок каждому ребёнку'] }
    ],
    masterclass: [
      { name: 'Слайм-лаборатория', emoji: '🧪', age: '5+ лет', time: '30–40 минут',
        desc: 'Создадим настоящий слайм своими руками!',
        list: ['приготовление слайма с нуля', 'выбор цвета и аромата', 'добавление блёсток и декоративных элементов', 'эксперименты с текстурой', 'индивидуальный контейнер', 'готовый слайм каждому участнику'] },
      { name: 'Пушистый Монстрик', emoji: '👾', age: '4+ лет', time: '30–40 минут',
        desc: 'Каждый ребёнок создаст собственного забавного монстра в необычной объёмной технике!',
        list: ['создание объёмной основы', 'необычная техника рисования с помощью трубочки', 'оформление глазок и мордочки', 'создание причёски из ярких ленточек', 'украшение декоративными элементами', 'готовая поделка каждому ребёнку'] },
      { name: 'Свеча из вощины', emoji: '🕯️', age: '5+ лет', time: '25–30 минут',
        desc: 'Создадим красивую свечу из натуральной пчелиной вощины!',
        list: ['изготовление свечи из натуральной вощины', 'украшение лентами и декоративными элементами', 'красивое оформление', 'готовая свеча каждому участнику'] },
      { name: 'Роспись шопера', emoji: '👜', age: '6+ лет', time: '40–60 минут',
        desc: 'Каждый ребёнок создаст собственную дизайнерскую сумку!',
        list: ['хлопковый шопер', 'специальные краски по ткани', 'трафареты и авторские рисунки', 'создание собственного дизайна', 'готовый шопер каждому участнику'] },
      { name: 'Магнитик на память', emoji: '🧲', age: '4+ лет', time: '25–30 минут',
        desc: 'Создадим яркий магнитик, который будет каждый день напоминать о весёлом празднике!',
        list: ['деревянная фигурка на выбор', 'роспись безопасными акриловыми красками', 'украшение блёстками, стразами и декоративными элементами', 'крепление магнитной основы', 'готовый магнитик каждому ребёнку'] }
    ],
    bubbles: [
      { name: 'Шоу мыльных пузырей', emoji: '🫧', age: 'для всех', time: '30 минут',
        desc: 'Яркое пузырьковое шоу с гигантскими мыльными пузырями и эффектными трюками.',
        list: ['гигантские мыльные пузыри', 'эффектные трюки ведущего', 'пузырь вокруг именинника', 'фото и видео на память'] },
      { name: 'Крио-шоу', emoji: '❄️', age: 'для всех', time: '30 минут',
        desc: 'Зрелищное шоу с холодными эффектами, дымом и необычными экспериментами.',
        list: ['облака холодного пара', 'эффектные ледяные эксперименты', 'интерактив с гостями', 'впечатляющие кадры для фото'] }
    ],
    sciShow: [
      { name: 'Научное шоу', emoji: '🔬', age: 'до 15 человек', time: '40 минут',
        desc: 'Увлекательные эксперименты, неожиданные реакции и настоящая магия науки.',
        list: ['яркие химические опыты', 'неожиданные реакции', 'участие детей в экспериментах', 'объяснения простым языком'] },
      { name: 'Тесла-шоу', emoji: '⚡', age: 'до 15 человек', time: '40 минут',
        desc: 'Электрические разряды, молнии и впечатляющие эксперименты с электричеством.',
        list: ['работа катушки Тесла', 'настоящие молнии', 'эксперименты с электричеством', 'безопасная демонстрация с ведущим'] },
      { name: 'Жонглёр-шоу', emoji: '🤹', age: 'до 15 человек', time: '40 минут',
        desc: 'Весёлое цирковое представление с жонглированием, трюками и интерактивом.',
        list: ['цирковые трюки', 'жонглирование разными предметами', 'интерактив с гостями', 'весёлый финал с детьми'] }
    ]
  };

  var style = document.createElement('style');
  style.textContent =
    '@keyframes pgIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
    '.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px;margin-top:16px}' +
    '.pg-card{position:relative;cursor:pointer;background:#fff;border:2px solid #eef0f6;border-radius:16px;padding:14px 16px;opacity:0;animation:pgIn .45s both;animation-delay:var(--d);transition:border-color .2s,box-shadow .3s,transform .2s}' +
    '.pg-card:hover{transform:translateY(-4px);border-color:var(--blue);box-shadow:0 14px 28px rgba(17,26,59,.12)}' +
    '.pg-card.open{border-color:var(--red);box-shadow:0 16px 32px rgba(226,35,26,.14)}' +
    '.pg-emoji{display:block;font-size:1.8rem;line-height:1;margin-bottom:6px;transition:transform .3s}' +
    '.pg-card:hover .pg-emoji{transform:scale(1.18) rotate(-8deg)}' +
    '.pg-name{display:block;font-weight:900;font-size:1rem;color:var(--dark)}' +
    '.pg-meta{display:block;font-size:.78rem;font-weight:700;color:#8a93ab;margin-top:2px}' +
    '.pg-more{display:inline-block;margin-top:8px;font-size:.78rem;font-weight:800;color:var(--blue)}' +
    '.pg-card.open .pg-more{color:var(--red)}' +
    '.pg-body{display:block;max-height:0;overflow:hidden;transition:max-height .45s ease}' +
    '.pg-card.open .pg-body{max-height:640px}' +
    '.pg-desc{display:block;font-size:.85rem;font-weight:600;color:#42506e;margin:10px 0 8px}' +
    '.pg-list{list-style:none;margin:0;padding:0}' +
    '.pg-list li{position:relative;font-size:.82rem;font-weight:700;color:#42506e;padding:3px 0 3px 18px;opacity:0}' +
    '.pg-card.open .pg-list li{animation:pgIn .35s forwards;animation-delay:calc(var(--li) * 45ms)}' +
    '.pg-list li:before{content:"★";position:absolute;left:0;color:var(--yellow)}';
  document.head.appendChild(style);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  window.openExtraModal = function (id) {
    var ex = EXTRAS[id];
    if (!ex) return;
    document.getElementById('extraModalTitle').textContent = ex.name;
    var media = document.getElementById('extraModalMedia');
    media.innerHTML = ex.photo
      ? '<img src="' + ex.photo + '" alt="' + esc(ex.name) + '">'
      : '<div class="icon-block" style="background:linear-gradient(135deg,' + ex.c1 + ',' + ex.c2 + ')">' + ex.emoji + '</div>';

    var priceLabel = (ex.priceFrom ? 'от ' : '') + ex.price.toLocaleString('ru-RU') + ' ₽';
    var html = '<p>' + esc(ex.desc) + '</p>';
    var prog = PROGRAMS[id];

    if (prog) {
      html += '<div class="tier-row"><span>' + (ex.upto ? esc(ex.upto) + ' · ' : '') + ex.duration + ' мин</span>' +
        '<span class="tier-price">' + priceLabel + '</span></div>';
      html += '<div class="pg-grid">';
      prog.forEach(function (o, i) {
        html += '<div class="pg-card" data-pg="' + i + '" style="--d:' + (i * 70) + 'ms">' +
          '<span class="pg-emoji">' + o.emoji + '</span>' +
          '<span class="pg-name">' + esc(o.name) + '</span>' +
          '<span class="pg-meta">' + esc(o.age) + ' · ' + esc(o.time) + '</span>' +
          '<span class="pg-more">Что внутри →</span>' +
          '<span class="pg-body"><span class="pg-desc">' + esc(o.desc) + '</span><ul class="pg-list">' +
          o.list.map(function (li, k) { return '<li style="--li:' + k + '">' + esc(li) + '</li>'; }).join('') +
          '</ul></span></div>';
      });
      html += '</div>';
    } else if (ex.options) {
      html += '<div style="margin-top:6px">';
      ex.options.forEach(function (o) {
        html += '<div class="tier-row"><span>' + esc(o.name) + '<br><span style="font-weight:600;color:#8a93ab;font-size:.78rem">' + esc(o.meta) + '</span></span>' +
          '<span class="tier-price">' + priceLabel + '</span></div>';
      });
      html += '</div>';
    } else {
      html += '<div class="tier-row"><span>' + ex.duration + ' мин</span><span class="tier-price">' + priceLabel + '</span></div>';
    }

    html += '<a href="javascript:void(0)" class="btn btn-primary" style="width:100%;margin-top:16px;text-align:center" ' +
      'onclick="closeExtraModal();openOrder(null,null,\'' + id + '\')">Добавить в заявку</a>';

    var body = document.getElementById('extraModalBody');
    body.innerHTML = html;
    Array.prototype.forEach.call(body.querySelectorAll('.pg-card'), function (card) {
      card.addEventListener('click', function () { card.classList.toggle('open'); });
    });
    document.getElementById('extraModal').classList.add('active');
  };
})();

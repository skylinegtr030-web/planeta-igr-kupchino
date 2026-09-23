(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var state = { sel: null, rules: { startFrom: '10:00', startTo: '21:59', maxMonthsAhead: 12, weekendDays: [0, 6] }, quoteSeq: 0, quote: null };
  var ROOM_PHOTO = { 'jungle-room': '/assets/images/rooms/jungle/room-jungle-1.jpg', 'loft-room': '/assets/images/rooms/loft/room-loft-1.jpg', 'duo-room': '/assets/rooms/room-wide.jpg' };
  var THEME = { berry: '#e2231a', jungle: '#28a745', savanna: '#ffc72c', cyber: '#1f5fd6' };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rub(n) { return Math.round(Number(n) || 0).toLocaleString('ru-RU') + '\u00a0\u20bd'; }
  function getJSON(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }); }
  function isoDate(d) { var z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }

  function priceBlock(it) {
    if (Number(it.price_weekday) === Number(it.price_weekend)) return '<div><b>' + rub(it.price_weekday) + '</b><small>любой день</small></div>';
    return '<div><b>' + rub(it.price_weekday) + '</b><small>будни</small></div><div><b>' + rub(it.price_weekend) + '</b><small>выходные</small></div>';
  }

  function packCard(it) {
    var a = it.attrs || {}, items = Array.isArray(a.items) ? a.items : [];
    return '<article class="card reveal" data-type="pack" data-slug="' + esc(it.slug) + '" style="--c:' + (THEME[a.theme] || '#e2231a') + '">' +
      '<div class="band"></div><div class="body">' + (a.mark ? '<span class="tag">' + esc(a.mark) + '</span>' : '') +
      '<h3>' + esc(it.title) + '</h3><p class="desc">' + esc(it.description || it.capacity || '') + '</p>' +
      '<div class="price">' + priceBlock(it) + '</div><ul>' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<button class="btn pick" type="button">Выбрать пакет</button></div></article>';
  }

  function roomCard(it) {
    var img = (it.cover && (it.cover.url || it.cover.path || it.cover)) || ROOM_PHOTO[it.slug] || '/assets/rooms/room-table.jpg';
    if (typeof img !== 'string') img = ROOM_PHOTO[it.slug] || '/assets/rooms/room-table.jpg';
    return '<article class="card reveal" data-type="room" data-slug="' + esc(it.slug) + '">' +
      '<img loading="lazy" src="' + esc(img) + '" alt="' + esc(it.title) + '"><div class="body">' +
      (it.capacity ? '<span class="tag">' + esc(it.capacity) + '</span>' : '') + '<h3>' + esc(it.title) + '</h3><p class="desc">' + esc(it.description || '') + '</p>' +
      '<div class="price">' + priceBlock(it) + '</div><button class="btn pick" type="button">Выбрать комнату</button></div></article>';
  }

  function renderGrid(el, list, fn) {
    el.classList.remove('loading');
    el.innerHTML = list.length ? list.map(fn).join('') : '<div class="error-box">Скоро здесь появятся варианты.</div>';
    observe(el);
    $$('.card', el).forEach(tilt);
  }

  var catalog = {};
  function loadCatalog() {
    return getJSON('/api/catalog').then(function (data) {
      var cats = data.categories || [];
      var byKind = function (k) { return cats.filter(function (c) { return c.kind === k; }).reduce(function (a, c) { return a.concat(c.items || []); }, []).filter(function (i) { return i.bookable !== false; }); };
      var packs = byKind('package'), rooms = byKind('room');
      packs.concat(rooms).forEach(function (i) { catalog[i.slug] = i; });
      renderGrid($('#packGrid'), packs, packCard);
      renderGrid($('#roomGrid'), rooms, roomCard);
    }).catch(function () {
      ['#packGrid', '#roomGrid'].forEach(function (s) { var el = $(s); el.classList.remove('loading'); el.innerHTML = '<div class="error-box">Не удалось загрузить цены. Обновите страницу или позвоните нам.</div>'; });
    });
  }

  function loadSettings() {
    return getJSON('/api/settings').then(function (d) {
      var s = d.settings || {}, c = s.contacts || {};
      if (s.booking_rules) Object.keys(s.booking_rules).forEach(function (k) { state.rules[k] = s.booking_rules[k]; });
      if (c.phone) $$('[data-phone]').forEach(function (a) { a.textContent = c.phone; a.href = 'tel:' + c.phone.replace(/[^\d+]/g, ''); });
      if (c.hours) $$('[data-hours]').forEach(function (e) { e.textContent = c.hours; });
      if (c.addressShort) $$('[data-address]').forEach(function (e) { e.textContent = c.addressShort; });
      if (c.addressFull) $$('[data-address-full]').forEach(function (e) { e.textContent = c.addressFull; });
    }).catch(function () {}).then(setupDateLimits);
  }

  function select(type, slug) {
    var it = catalog[slug]; if (!it) return;
    state.sel = { type: type, slug: slug, title: it.title, wd: it.price_weekday, we: it.price_weekend };
    $$('.card').forEach(function (c) { var on = c.dataset.slug === slug; c.classList.toggle('selected', on); var b = $('.pick', c); if (b) b.textContent = on ? 'Выбрано ✓' : (c.dataset.type === 'pack' ? 'Выбрать пакет' : 'Выбрать комнату'); });
    $('#cartName').textContent = it.title;
    $('#cartPrice').textContent = Number(it.price_weekday) === Number(it.price_weekend) ? rub(it.price_weekday) : 'от ' + rub(Math.min(it.price_weekday, it.price_weekend));
    $('#cart').hidden = false;
    renderChosen(); requestQuote();
  }

  function renderChosen() {
    var box = $('#chosenBox');
    if (state.sel) { box.className = 'chosen'; box.textContent = (state.sel.type === 'pack' ? 'Пакет: ' : 'Комната: ') + state.sel.title; }
    else { box.className = 'chosen empty'; box.textContent = 'Выберите пакет или комнату. Можно закрыть окно и нажать «Выбрать».'; }
  }

  function selection() {
    if (!state.sel) return { pack: '', room: '', extras: [] };
    return { pack: state.sel.type === 'pack' ? state.sel.slug : '', room: state.sel.type === 'room' ? state.sel.slug : '', extras: [] };
  }

  var qTimer = null;
  function requestQuote() {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      var f = $('#orderForm'), total = $('#quoteTotal'), note = $('#quoteNote');
      if (!state.sel) { total.textContent = '—'; note.textContent = ''; return; }
      if (!f.eventDate.value) { total.textContent = 'Выберите дату'; note.textContent = 'Цена зависит от дня недели'; return; }
      var seq = ++state.quoteSeq; total.textContent = 'Считаем…';
      var body = selection(); body.date = f.eventDate.value; body.promo = f.promo.value.trim();
      fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (q) {
          if (seq !== state.quoteSeq) return;
          if (!q || !q.ok) throw new Error('quote');
          state.quote = q; total.textContent = rub(q.total);
          var parts = [q.dayKind === 'holiday' ? 'Праздничный день — тариф выходного' : (q.weekend ? 'Тариф выходного дня' : 'Тариф буднего дня')];
          if (q.discount) parts.push('скидка ' + rub(q.discount) + ' по промокоду ' + q.promo);
          if (q.promoError) parts.push('промокод не подошёл');
          note.textContent = parts.join(' · ');
        })
        .catch(function () { if (seq === state.quoteSeq) { state.quote = null; total.textContent = 'Уточним по телефону'; note.textContent = 'Не удалось рассчитать автоматически'; } });
    }, 250);
  }

  function setupDateLimits() {
    var f = $('#orderForm'), now = new Date(), max = new Date();
    max.setMonth(max.getMonth() + (Number(state.rules.maxMonthsAhead) || 12));
    f.eventDate.min = isoDate(now); f.eventDate.max = isoDate(max);
    f.eventTime.min = state.rules.startFrom || '10:00'; f.eventTime.max = state.rules.startTo || '21:59';
  }

  function hint(input, msg) {
    input.classList.toggle('invalid', !!msg);
    var h = input.parentNode.querySelector('.hint');
    if (msg) { if (!h) { h = document.createElement('span'); h.className = 'hint'; input.parentNode.appendChild(h); } h.textContent = msg; }
    else if (h) h.remove();
    return !msg;
  }

  function validate(f) {
    var ok = true, digits = f.phone.value.replace(/\D/g, '');
    ok = hint(f.name, f.name.value.trim().length < 2 ? 'Укажите имя' : '') && ok;
    ok = hint(f.phone, digits.length < 10 || digits.length > 12 ? 'Проверьте номер телефона' : '') && ok;
    var d = f.eventDate.value, dm = '';
    if (!d) dm = 'Выберите дату'; else if (d < f.eventDate.min) dm = 'Дата уже прошла'; else if (f.eventDate.max && d > f.eventDate.max) dm = 'Бронируем не дальше чем на ' + (state.rules.maxMonthsAhead || 12) + ' мес.';
    ok = hint(f.eventDate, dm) && ok;
    var t = f.eventTime.value, tm = '';
    if (!t) tm = 'Укажите время'; else if (t < f.eventTime.min || t > f.eventTime.max) tm = 'Начало с ' + f.eventTime.min + ' до ' + f.eventTime.max;
    ok = hint(f.eventTime, tm) && ok;
    if (!state.sel) { renderChosen(); ok = false; }
    return ok;
  }

  function submit(e) {
    e.preventDefault();
    var f = e.target, st = $('#formStatus'), btn = $('button[type=submit]', f);
    st.className = 'status'; st.textContent = '';
    if (f.website.value) return;
    if (!validate(f)) { st.className = 'status err'; st.textContent = 'Проверьте отмеченные поля'; return; }
    var payload = {
      name: f.name.value.trim(), phone: f.phone.value.trim(), eventDate: f.eventDate.value, eventTime: f.eventTime.value,
      comment: f.comment.value.trim(), promo: f.promo.value.trim(),
      packName: state.sel.type === 'pack' ? state.sel.title : '', roomName: state.sel.type === 'room' ? state.sel.title : '',
      priceText: state.quote ? rub(state.quote.total) : '', selection: selection()
    };
    btn.disabled = true; btn.textContent = 'Отправляем…';
    fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.j && res.j.error);
        st.className = 'status ok'; st.textContent = 'Заявка отправлена! Мы перезвоним, чтобы подтвердить праздник.';
        confetti(); f.reset(); state.sel = null; state.quote = null;
        $$('.card.selected').forEach(function (c) { c.classList.remove('selected'); }); $('#cart').hidden = true;
        renderChosen(); requestQuote();
      })
      .catch(function () { st.className = 'status err'; st.textContent = 'Не получилось отправить. Позвоните нам, пожалуйста.'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Отправить заявку'; });
  }

  function openModal() { renderChosen(); $('#orderModal').hidden = false; document.body.style.overflow = 'hidden'; setTimeout(function () { var f = $('#orderForm'); (f.name.value ? f.eventDate : f.name).focus(); }, 50); requestQuote(); }
  function closeModal() { $('#orderModal').hidden = true; document.body.style.overflow = ''; }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#e2231a', '#1f5fd6', '#ffc72c', '#28a745'];
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('i'); p.className = 'confetti';
      p.style.left = Math.random() * 100 + 'vw'; p.style.background = colors[i % 4];
      p.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; p.style.animationDelay = Math.random() * .4 + 's';
      document.body.appendChild(p); setTimeout(p.remove.bind(p), 4200);
    }
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { threshold: .12 }) : null;
  function observe(root) { $$('.reveal', root).forEach(function (el) { if (io) io.observe(el); else el.classList.add('visible'); }); }

  function tilt(card) {
    if (!matchMedia('(hover: hover)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    card.addEventListener('pointermove', function (e) { var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = 'perspective(900px) rotateX(' + (-y * 5) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-6px)'; });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }

  document.addEventListener('click', function (e) {
    var pick = e.target.closest('.pick');
    if (pick) { var c = pick.closest('.card'); select(c.dataset.type, c.dataset.slug); return; }
    if (e.target.closest('[data-order]')) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#orderModal').hidden) closeModal(); });

  document.addEventListener('DOMContentLoaded', function () {
    var f = $('#orderForm');
    f.addEventListener('submit', submit);
    f.eventDate.addEventListener('change', requestQuote);
    f.promo.addEventListener('input', requestQuote);
    $$('input', f).forEach(function (i) { i.addEventListener('input', function () { if (i.classList.contains('invalid')) hint(i, ''); }); });
    setupDateLimits(); observe(document); renderChosen();
    loadSettings(); loadCatalog();
  });
})();

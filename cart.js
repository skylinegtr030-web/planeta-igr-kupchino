/* Планета Игр — корзина: набирайте пакет, комнату и услуги по всему сайту,
   затем одним нажатием перенесите всё в заявку. Хранится в браузере. */
(function () {
  'use strict';

  var KEY = 'pg-cart-v1';
  var EMPTY = function () { return { pack: '', room: '', extras: [] }; };

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        return {
          pack: typeof raw.pack === 'string' ? raw.pack : '',
          room: typeof raw.room === 'string' ? raw.room : '',
          extras: Array.isArray(raw.extras) ? raw.extras.filter(function (x) { return typeof x === 'string'; }) : []
        };
      }
    } catch (e) {}
    return EMPTY();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
  }
  var cart = load();

  function info(kind, id) {
    try {
      if (kind === 'pack' && typeof PACKS !== 'undefined' && PACKS[id]) return { name: PACKS[id].name, price: PACKS[id].price };
      if (kind === 'room' && typeof ROOMS !== 'undefined' && ROOMS[id]) {
        var rc = (window.PG_CONTENT && window.PG_CONTENT.rooms) || {};
        return { name: ROOMS[id].name, price: id === 'duo-room' ? (rc.duoBase || 10000) : (rc.roomBase || 7000) };
      }
      if (kind === 'extra' && typeof EXTRAS !== 'undefined' && EXTRAS[id]) return { name: EXTRAS[id].name, price: EXTRAS[id].price };
    } catch (e) {}
    return null;
  }
  function items() {
    var out = [];
    if (cart.pack) { var p = info('pack', cart.pack); if (p) out.push({ kind: 'pack', id: cart.pack, name: p.name, price: p.price }); }
    if (cart.room) { var r = info('room', cart.room); if (r) out.push({ kind: 'room', id: cart.room, name: r.name, price: r.price }); }
    cart.extras.forEach(function (id) {
      var e = info('extra', id);
      if (e) out.push({ kind: 'extra', id: id, name: e.name, price: e.price });
    });
    return out;
  }
  function count() { return (cart.pack ? 1 : 0) + (cart.room ? 1 : 0) + cart.extras.length; }
  function total() {
    return items().reduce(function (sum, x) { return sum + (x.price || 0); }, 0);
  }

  // ---------- интерфейс ----------
  var css = document.createElement('style');
  css.textContent =
    '.pg-cart-pill{position:fixed;right:18px;bottom:18px;z-index:940;display:flex;align-items:center;gap:10px;' +
    'background:#111a3b;color:#fff;padding:12px 18px;border-radius:999px;box-shadow:0 12px 30px rgba(17,26,59,.28);' +
    'font-weight:900;cursor:pointer;border:0;font-size:.95rem;transition:transform .15s}' +
    '.pg-cart-pill:hover{transform:translateY(-2px)}' +
    '.pg-cart-pill .pg-cart-count{background:#e2231a;min-width:22px;height:22px;border-radius:999px;display:flex;' +
    'align-items:center;justify-content:center;font-size:.75rem;padding:0 4px}' +
    '.pg-cart-pill .pg-cart-sum{opacity:.85;font-weight:800}' +
    '.pg-cart-popup{position:fixed;right:18px;bottom:72px;z-index:941;width:min(340px,calc(100vw - 36px));' +
    'background:#fff;border-radius:18px;box-shadow:0 22px 60px rgba(17,26,59,.24);padding:16px;display:none}' +
    '.pg-cart-popup.open{display:block}' +
    '.pg-cart-popup h4{margin:0 0 10px;font-size:1.02rem;color:#111a3b}' +
    '.pg-cart-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;' +
    'border-bottom:1px solid #eef1f8;font-size:.88rem;color:#42506e}' +
    '.pg-cart-row b{color:#111a3b}' +
    '.pg-cart-rm{border:0;background:#f3e7e6;color:#c21a12;width:24px;height:24px;border-radius:8px;cursor:pointer;' +
    'font-weight:900;flex:0 0 auto}' +
    '.pg-cart-total{display:flex;justify-content:space-between;padding:12px 0 4px;font-weight:900;color:#111a3b}' +
    '.pg-cart-actions{display:flex;gap:8px;margin-top:10px}' +
    '.pg-cart-actions button{flex:1;border:0;border-radius:10px;padding:11px 10px;font-weight:900;cursor:pointer;font-size:.88rem}' +
    '.pg-cart-go{background:#1f5fd6;color:#fff}' +
    '.pg-cart-wipe{background:#eef2fb;color:#1f5fd6}' +
    '.pg-cart-empty{color:#8a93ab;font-weight:700;padding:14px 0;text-align:center;font-size:.9rem}' +
    '.pg-toast{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:950;background:#1f8f3b;color:#fff;' +
    'padding:10px 20px;border-radius:12px;font-weight:800;box-shadow:0 10px 26px rgba(31,143,59,.35);font-size:.9rem;' +
    'display:none;max-width:calc(100vw - 40px);text-align:center}' +
    '@media(max-width:600px){.pg-cart-pill{right:12px;bottom:12px;padding:10px 14px}.pg-cart-popup{right:12px;bottom:64px}}';
  document.head.appendChild(css);

  var pill = document.createElement('button');
  pill.className = 'pg-cart-pill';
  pill.setAttribute('aria-label', 'Корзина заявки');
  pill.innerHTML = '<span class="pg-cart-count">0</span> Корзина <span class="pg-cart-sum"></span>';
  pill.addEventListener('click', function () { togglePopup(); });
  document.body.appendChild(pill);

  var popup = document.createElement('div');
  popup.className = 'pg-cart-popup';
  document.body.appendChild(popup);

  var toast = document.createElement('div');
  toast.className = 'pg-toast';
  document.body.appendChild(toast);
  var toastTimer = 0;
  function showToast(text) {
    toast.textContent = text;
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.style.display = 'none'; }, 2000);
  }

  function fmt(n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽'; }

  function renderPopup() {
    var list = items();
    if (!list.length) {
      popup.innerHTML = '<h4>Корзина пуста</h4><div class="pg-cart-empty">Добавьте пакет, комнату или услуги — карточки по всему сайту.</div>';
      return;
    }
    var rows = list.map(function (x) {
      return '<div class="pg-cart-row"><span>' + escapeHtml(x.name) + '</span>' +
        '<span style="display:flex;gap:8px;align-items:center"><b>' + fmt(x.price) + '</b>' +
        '<button class="pg-cart-rm" data-kind="' + x.kind + '" data-id="' + escapeHtml(x.id) + '" aria-label="Убрать">×</button></span></div>';
    }).join('');
    popup.innerHTML = '<h4>Ваша заявка</h4>' + rows +
      '<div class="pg-cart-total"><span>Примерная сумма</span><span>' + fmt(total()) + '</span></div>' +
      '<div class="pg-cart-actions">' +
      '<button class="pg-cart-wipe">Очистить</button>' +
      '<button class="pg-cart-go">Оформить заявку</button></div>';
    Array.prototype.forEach.call(popup.querySelectorAll('.pg-cart-rm'), function (btn) {
      btn.addEventListener('click', function () {
        remove(btn.dataset.kind, btn.dataset.id);
      });
    });
    popup.querySelector('.pg-cart-wipe').addEventListener('click', function () {
      cart = EMPTY();
      save();
      renderAll();
      showToast('Корзина очищена');
    });
    popup.querySelector('.pg-cart-go').addEventListener('click', function () {
      popup.classList.remove('open');
      window.openOrder();
    });
  }
  function renderPill() {
    pill.querySelector('.pg-cart-count').textContent = count();
    pill.querySelector('.pg-cart-sum').textContent = count() ? fmt(total()) : '';
    pill.style.display = '';
  }
  function renderAll() { renderPill(); renderPopup(); }
  function togglePopup() { renderPopup(); popup.classList.toggle('open'); }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // ---------- операции ----------
  function add(kind, id) {
    if (!id) return;
    if (kind === 'pack') cart.pack = id;
    else if (kind === 'room') cart.room = id;
    else if (kind === 'extra') {
      var at = cart.extras.indexOf(id);
      if (at !== -1) { cart.extras.splice(at, 1); save(); renderAll(); showToast('Убрано из корзины'); return; }
      cart.extras.push(id);
    }
    save();
    renderAll();
    var i = info(kind, id);
    showToast('Добавлено в корзину: ' + (i ? i.name : ''));
  }
  function remove(kind, id) {
    if (kind === 'pack' && cart.pack === id) cart.pack = '';
    if (kind === 'room' && cart.room === id) cart.room = '';
    if (kind === 'extra') {
      var at = cart.extras.indexOf(id);
      if (at !== -1) cart.extras.splice(at, 1);
    }
    save();
    renderAll();
  }
  function applyToForm() {
    if (!count()) return;
    var form = document.getElementById('orderForm');
    if (!form) return;
    if (cart.pack) {
      var p = form.querySelector('input[name="pack"][value="' + cart.pack + '"]');
      if (p) p.checked = true;
    }
    if (cart.room) {
      var r = form.querySelector('input[name="room"][value="' + cart.room + '"]');
      if (r) r.checked = true;
    }
    cart.extras.forEach(function (id) {
      var c = form.querySelector('input[name="extra"][value="' + id + '"]');
      if (c) c.checked = true;
    });
    if (typeof window.recalc === 'function') window.recalc();
  }

  // ---------- перехват кнопок «выбрать» ----------
  var origOpen = window.openOrder;
  window.openOrder = function (packId, roomId, extraId) {
    if (packId || roomId || extraId) {
      if (packId) add('pack', packId);
      if (roomId) add('room', roomId);
      if (extraId) add('extra', extraId);
      return;
    }
    var result = origOpen && origOpen.apply(this, arguments);
    applyToForm();
    return result;
  };

  // ---------- корзина очищается после успешной заявки ----------
  var sentMsg = document.getElementById('orderSentMsg');
  if (sentMsg && typeof MutationObserver !== 'undefined') {
    new MutationObserver(function () {
      if ((sentMsg.textContent || '').indexOf('Заявка записана') !== -1) {
        cart = EMPTY();
        save();
        renderAll();
      }
    }).observe(sentMsg, { childList: true, characterData: true, subtree: true });
  }

  // ---------- обновление при смене цен ----------
  window.addEventListener('pg:content', renderAll);

  renderAll();
  window.PGCart = { add: add, remove: remove, applyToForm: applyToForm, items: items };
})();

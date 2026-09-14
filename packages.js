/* Planeta Igr — themed package cards and weekday/weekend pricing.
   Prices flow from content.json via PG_CONTENT; defaults are used only until it loads. */
(function () {
  'use strict';

  var DATA = {
    malysh: {
      name: 'Малыш JO', weekday: 24000, weekend: 27000, guests: 'До 10 человек', duration: 180, theme: 'berry', mark: 'Для малышей',
      items: ['Банкетная комната — 3 часа', 'Праздничная сервировка', 'Анимационная программа — 1 час', 'Билеты «Безлимит»', 'Подарок имениннику', 'Шар-сюрприз в подарок']
    },
    jungle: {
      name: 'Гости в джунглях', weekday: 37900, weekend: 41900, guests: 'До 10 человек', duration: 180, theme: 'jungle', mark: 'Популярный',
      items: ['Банкетная комната — 3 часа', 'Праздничная сервировка', 'Анимационная программа — 1 час', 'Билеты «Безлимит»', 'Аквагрим / блеск-тату / 10 гелиевых шаров — на выбор', 'Именные электронные приглашения', '10 тайм-карт на 30 минут', 'Подарок имениннику', 'Пиньята в подарок']
    },
    king: {
      name: 'Король саванны', weekday: 84100, weekend: 88100, guests: 'До 10 человек', duration: 180, theme: 'savanna', mark: 'Максимум',
      items: ['Банкетная комната — 3 часа', 'Праздничная сервировка', '10 гелиевых шаров', 'Анимационная программа — 1 час', 'Мастер-класс / шоу / квест — на выбор', 'Билеты «Безлимит»', 'Лава-пол — 30 минут', 'Аквагрим / блеск-тату — на выбор', 'Лазертаг Q-ZAR — 1 час', '10 тайм-карт на 1 час', 'Именные электронные приглашения', 'Серебряное шоу в подарок']
    },
    cyber: {
      name: 'Кибер Пати', weekday: 45900, weekend: 45900, guests: 'До 10 человек', duration: 180, theme: 'cyber', mark: 'Технологичный',
      items: ['Банкетная комната — 3 часа', 'Праздничная сервировка', 'Лазертаг Q-ZAR — 1 час', 'Лава-пол — 20 минут', '10 тайм-карт на 1 час']
    }
  };

  var style = document.createElement('style');
  style.textContent =
    '#prices .section-inner{position:relative}' +
    '#prices .section-inner:before{content:"";position:absolute;inset:-25px -20px;border-radius:30px;background:radial-gradient(circle at 10% 10%,rgba(226,35,26,.08),transparent 32%),radial-gradient(circle at 90% 15%,rgba(31,95,214,.1),transparent 34%);pointer-events:none}' +
    '#prices .pack-grid{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}' +
    '#prices .pack{position:relative;overflow:hidden;min-height:100%;padding:0;border:0;border-radius:26px;background:#fff;box-shadow:0 18px 42px rgba(17,26,59,.12);text-align:left;transform:none}' +
    '#prices .pack:hover{transform:translateY(-7px);box-shadow:0 26px 56px rgba(17,26,59,.18)}' +
    '.pk-head{position:relative;padding:24px 24px 20px;color:#fff;overflow:hidden}' +
    '.pk-head:after{content:"";position:absolute;width:150px;height:150px;border:28px solid rgba(255,255,255,.12);border-radius:50%;right:-46px;top:-62px}' +
    '.pack[data-theme="berry"] .pk-head{background:linear-gradient(135deg,#c51d59,#ef416f)}' +
    '.pack[data-theme="jungle"] .pk-head{background:linear-gradient(135deg,#167238,#28a745)}' +
    '.pack[data-theme="savanna"] .pk-head{background:linear-gradient(135deg,#d66a0b,#f2a51a)}' +
    '.pack[data-theme="cyber"] .pk-head{background:linear-gradient(135deg,#111a3b,#1f5fd6)}' +
    '.pk-mark{position:relative;z-index:1;display:inline-block;margin-bottom:10px;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.18);font-size:.72rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase}' +
    '.pk-head h3{position:relative;z-index:1;margin:0;font-size:1.55rem;color:#fff}' +
    '.pk-guests{position:relative;z-index:1;margin-top:5px;font-weight:800;opacity:.9}' +
    '.pk-prices{position:relative;z-index:1;display:flex;gap:10px;margin-top:16px}' +
    '.pk-price{flex:1;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.94);color:#111a3b}' +
    '.pk-price span{display:block;font-size:.68rem;font-weight:800;color:#66708a;text-transform:uppercase}' +
    '.pk-price strong{display:block;margin-top:2px;font-size:1.18rem;font-weight:900}' +
    '.pk-price.single{max-width:230px}' +
    '.pk-body{padding:20px 24px 22px}' +
    '#prices .pk-list{margin:0;padding:0;list-style:none}' +
    '#prices .pk-list li{position:relative;padding:5px 0 5px 22px;color:#42506e;font-size:.9rem;font-weight:700}' +
    '#prices .pk-list li:before{content:"";position:absolute;left:1px;top:11px;width:9px;height:9px;border-radius:50%;background:var(--yellow);box-shadow:0 0 0 4px rgba(255,199,44,.18)}' +
    '#prices .pk-list li.pk-gift{color:#16823a;font-weight:900}' +
    '#prices .pk-list li.pk-gift:before{background:#28a745;box-shadow:0 0 0 4px rgba(40,167,69,.15)}' +
    '.pk-cta{margin-top:18px;padding-top:14px;border-top:1px solid #edf0f6;font-weight:900;color:#1f5fd6}' +
    '@media(max-width:780px){#prices .pack-grid{grid-template-columns:1fr}.pk-prices{flex-direction:column}.pk-price.single{max-width:none}}';
  document.head.appendChild(style);

  function money(n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽'; }
  function isWeekend() {
    var input = document.getElementById('eventDate');
    if (!input || !input.value) return false;
    var day = new Date(input.value + 'T12:00:00').getDay();
    return day === 0 || day === 6;
  }
  function priceFromContent(id) {
    var content = window.PG_CONTENT;
    if (!content || !content.packs || !content.packs[id]) return null;
    var value = content.packs[id];
    if (typeof value === 'number') return { weekday: value, weekend: value };
    return {
      weekday: Number(value.weekday) || DATA[id].weekday,
      weekend: Number(value.weekend) || Number(value.weekday) || DATA[id].weekend
    };
  }
  function currentPrices(id) {
    return priceFromContent(id) || { weekday: DATA[id].weekday, weekend: DATA[id].weekend };
  }
  function applyPrices() {
    var weekend = isWeekend();
    Object.keys(DATA).forEach(function (id) {
      var d = DATA[id];
      var p = currentPrices(id);
      if (!PACKS[id]) return;
      Object.assign(PACKS[id], {
        name: d.name,
        price: weekend ? p.weekend : p.weekday,
        weekday: p.weekday,
        weekend: p.weekend,
        guests: d.guests,
        duration: d.duration
      });
    });
  }
  function card(id, d) {
    var p = currentPrices(id);
    var fixed = p.weekday === p.weekend;
    var prices = fixed
      ? '<div class="pk-price single"><span>Будни и выходные</span><strong>' + money(p.weekday) + '</strong></div>'
      : '<div class="pk-price"><span>Будни</span><strong>' + money(p.weekday) + '</strong></div><div class="pk-price"><span>Выходные</span><strong>' + money(p.weekend) + '</strong></div>';
    var items = d.items.map(function (x) { return '<li class="' + (/подарок/i.test(x) ? 'pk-gift' : '') + '">' + x + '</li>'; }).join('');
    return '<div class="pack" data-theme="' + d.theme + '" onclick="openOrder(\'' + id + '\')">' +
      '<div class="pk-head"><span class="pk-mark">' + d.mark + '</span><h3>' + d.name + '</h3><div class="pk-guests">' + d.guests + '</div><div class="pk-prices">' + prices + '</div></div>' +
      '<div class="pk-body"><ul class="pk-list">' + items + '</ul><div class="pk-cta">Добавить в корзину →</div></div></div>';
  }

  function renderGrid() {
    var grid = document.querySelector('#prices .pack-grid');
    if (grid) grid.innerHTML = Object.keys(DATA).map(function (id) { return card(id, DATA[id]); }).join('');
  }

  applyPrices();
  var title = document.querySelector('#prices h2');
  if (title) title.textContent = 'Выберите программу для дня рождения';
  var intro = document.querySelector('#prices h2 + p');
  if (intro) intro.textContent = 'Четыре готовых сценария праздника до 10 человек. Цена зависит от дня недели — выберите пакет, а в заявке добавьте нужные услуги.';
  renderGrid();

  if (typeof renderOrderOptions === 'function') renderOrderOptions();
  var originalRecalc = window.recalc;
  window.recalc = function () {
    applyPrices();
    return originalRecalc && originalRecalc.apply(this, arguments);
  };
  var date = document.getElementById('eventDate');
  if (date) date.addEventListener('change', function () { renderGrid(); window.recalc(); });
  window.addEventListener('pg:content', function () {
    applyPrices();
    renderGrid();
    window.recalc();
  });
  window.recalc();
})();

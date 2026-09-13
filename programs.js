/* Planeta Igr — programme cards: SVG art, themed open effects (posters, Sep 2026). */
(function () {
  'use strict';

  var ART = {
    hero: { g: ['#1f5fd6', '#7b2fd6'], p: 'star',
      svg: '<path d="M32 6l18 8v14c0 12-8 21-18 24-10-3-18-12-18-24V14z" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 16l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff"/>' },
    chest: { g: ['#b8862b', '#6b4410'], p: 'star',
      svg: '<rect x="10" y="22" width="44" height="28" rx="4" fill="none" stroke="#fff" stroke-width="3"/><path d="M10 32h44M32 22v-8m0 8c-6 0-10-4-10-8s4-6 10 0c6-6 10-4 10 0s-4 8-10 8z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="32" cy="36" r="4" fill="#fff"/>' },
    alice: { g: ['#c2418a', '#7b2fd6'], p: 'star',
      svg: '<path d="M14 26h26v14a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z" fill="none" stroke="#fff" stroke-width="3"/><path d="M40 30h6a6 6 0 0 1 0 12h-6M12 50h34" stroke="#fff" stroke-width="3" fill="none"/><path d="M22 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8" stroke="#fff" stroke-width="3" fill="none"/>' },
    balloons: { g: ['#28a745', '#1f9d8a'], p: 'confetti',
      svg: '<ellipse cx="22" cy="22" rx="10" ry="12" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="42" cy="26" rx="9" ry="11" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 34c2 8-4 12-2 22M42 37c-2 7 3 10 1 19" stroke="#fff" stroke-width="2.5" fill="none"/>' },
    slime: { g: ['#28a745', '#63e6ff'], p: 'bubble',
      svg: '<path d="M24 10h16v12l8 16a10 10 0 0 1-9 14H25a10 10 0 0 1-9-14l8-16z" fill="none" stroke="#fff" stroke-width="3"/><path d="M20 34h24M22 10h20" stroke="#fff" stroke-width="3"/><circle cx="28" cy="42" r="3" fill="#fff"/><circle cx="37" cy="46" r="2" fill="#fff"/>' },
    monster: { g: ['#7b2fd6', '#e2231a'], p: 'confetti',
      svg: '<path d="M32 14c11 0 18 8 18 18s-7 18-18 18-18-8-18-18 7-18 18-18z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="26" cy="30" r="3.5" fill="#fff"/><circle cx="39" cy="30" r="3.5" fill="#fff"/><path d="M25 39c4 4 10 4 14 0M32 14V6M18 20l-5-5M46 20l5-5" stroke="#fff" stroke-width="3" fill="none"/>' },
    candle: { g: ['#ffc72c', '#e2231a'], p: 'spark',
      svg: '<rect x="24" y="26" width="16" height="28" rx="3" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 26V20M32 8c5 6 6 9 6 12a6 6 0 0 1-12 0c0-3 1-6 6-12z" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 36h16" stroke="#fff" stroke-width="2"/>' },
    bag: { g: ['#e2231a', '#c2418a'], p: 'confetti',
      svg: '<path d="M14 22h36l4 32H10z" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 22v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 36c4 4 12 4 16 0" stroke="#fff" stroke-width="2.5" fill="none"/>' },
    magnet: { g: ['#1f5fd6', '#e2231a'], p: 'spark',
      svg: '<path d="M18 46V30a14 14 0 0 1 28 0v16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M18 46v6M46 46v6" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' },
    bubbles: { g: ['#28a745', '#63e6ff'], p: 'bubble',
      svg: '<circle cx="26" cy="28" r="13" fill="none" stroke="#fff" stroke-width="3"/><circle cx="44" cy="40" r="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="45" cy="19" r="5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="21" cy="23" r="3" fill="#fff"/>' },
    cryo: { g: ['#1f5fd6', '#63e6ff'], p: 'snow',
      svg: '<path d="M32 8v48M11 20l42 24M53 20L11 44" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 16l-5-5m5 5l5-5m-5 32l-5 5m5-5l5 5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
    science: { g: ['#7b2fd6', '#28a745'], p: 'bubble',
      svg: '<path d="M26 8h12v16l10 22a8 8 0 0 1-7 12H23a8 8 0 0 1-7-12l10-22z" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 32h20" stroke="#fff" stroke-width="3"/><circle cx="28" cy="44" r="3" fill="#fff"/><circle cx="37" cy="48" r="2" fill="#fff"/><circle cx="33" cy="38" r="2" fill="#fff"/>' },
    tesla: { g: ['#111a3b', '#1f5fd6'], p: 'spark',
      svg: '<path d="M36 6L16 34h12l-6 24 22-30H32z" fill="#fff"/><path d="M8 44l6-4M56 20l-6 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
    juggler: { g: ['#ffc72c', '#e2231a'], p: 'confetti',
      svg: '<circle cx="16" cy="34" r="6" fill="#fff"/><circle cx="32" cy="16" r="6" fill="#fff"/><circle cx="48" cy="34" r="6" fill="#fff"/><path d="M12 48c6-14 34-14 40 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>' }
  };

  var PROGRAMS = {
    quest: [
      { name: 'Академия Супергероев', art: 'hero', age: '5–8 лет', time: '40 минут',
        desc: 'Настало время стать настоящими супергероями! Под руководством любимого героя ребятам предстоит пройти обучение в секретной Академии, выполнить самые сложные миссии, проявить ловкость, смекалку и командный дух.',
        list: ['любимый Супергерой', 'личная Лицензия Супергероя', 'секретные спецгаджеты', 'карта тайной базы', '«блокбастерные» испытания', 'задания на ловкость, скорость и смекалку', 'торжественное посвящение в супергерои'] },
      { name: 'Форт Боярд', art: 'chest', age: '6–10 лет', time: '45 минут',
        desc: 'Только настоящая команда сможет открыть сокровищницу и завладеть главным кладом!',
        list: ['таинственный Мастер Теней', 'уникальный тематический реквизит', 'поиск ключей и подсказок', 'захватывающие испытания', 'задания на силу, ловкость и смекалку', 'оригинальная сокровищница', 'сладкие подарки каждому участнику'] },
      { name: 'Алиса в Стране Чудес', art: 'alice', age: '5–8 лет', time: '40 минут',
        desc: '«Я опаздываю! Ох, как я опаздываю!» Белый Кролик уже ждёт своих друзей, ведь впереди удивительное путешествие в волшебное Зазеркалье.',
        list: ['любимый герой Зазеркалья', 'сказочные испытания', 'скачки на фламинго', 'загадки Красной Королевы', '«Безумное чаепитие»', 'измеритель Счастья', 'яркий праздничный финал'] },
      { name: 'Мультиквест', art: 'balloons', age: '5–6 лет', time: '40 минут',
        desc: 'Сокровища нашего парка ждут самых смелых и весёлых ребят!',
        list: ['задания на самых популярных аттракционах', 'весёлые танцевальные активности', 'динамичные испытания', 'интересные головоломки', 'Измеритель Счастья', 'сладкий подарок каждому ребёнку'] }
    ],
    masterclass: [
      { name: 'Слайм-лаборатория', art: 'slime', age: '5+ лет', time: '30–40 минут',
        desc: 'Создадим настоящий слайм своими руками!',
        list: ['приготовление слайма с нуля', 'выбор цвета и аромата', 'добавление блёсток и декоративных элементов', 'эксперименты с текстурой', 'индивидуальный контейнер', 'готовый слайм каждому участнику'] },
      { name: 'Пушистый Монстрик', art: 'monster', age: '4+ лет', time: '30–40 минут',
        desc: 'Каждый ребёнок создаст собственного забавного монстра в необычной объёмной технике!',
        list: ['создание объёмной основы', 'необычная техника рисования с помощью трубочки', 'оформление глазок и мордочки', 'создание причёски из ярких ленточек', 'украшение декоративными элементами', 'готовая поделка каждому ребёнку'] },
      { name: 'Свеча из вощины', art: 'candle', age: '5+ лет', time: '25–30 минут',
        desc: 'Создадим красивую свечу из натуральной пчелиной вощины!',
        list: ['изготовление свечи из натуральной вощины', 'украшение лентами и декоративными элементами', 'красивое оформление', 'готовая свеча каждому участнику'] },
      { name: 'Роспись шопера', art: 'bag', age: '6+ лет', time: '40–60 минут',
        desc: 'Каждый ребёнок создаст собственную дизайнерскую сумку!',
        list: ['хлопковый шопер', 'специальные краски по ткани', 'трафареты и авторские рисунки', 'создание собственного дизайна', 'готовый шопер каждому участнику'] },
      { name: 'Магнитик на память', art: 'magnet', age: '4+ лет', time: '25–30 минут',
        desc: 'Создадим яркий магнитик, который будет каждый день напоминать о весёлом празднике!',
        list: ['деревянная фигурка на выбор', 'роспись безопасными акриловыми красками', 'украшение блёстками, стразами и декоративными элементами', 'крепление магнитной основы', 'готовый магнитик каждому ребёнку'] }
    ],
    bubbles: [
      { name: 'Шоу мыльных пузырей', art: 'bubbles', age: 'для всех', time: '30 минут',
        desc: 'Яркое пузырьковое шоу с гигантскими мыльными пузырями и эффектными трюками.',
        list: ['гигантские мыльные пузыри', 'эффектные трюки ведущего', 'пузырь вокруг именинника', 'фото и видео на память'] },
      { name: 'Крио-шоу', art: 'cryo', age: 'для всех', time: '30 минут',
        desc: 'Зрелищное шоу с холодными эффектами, дымом и необычными экспериментами.',
        list: ['облака холодного пара', 'эффектные ледяные эксперименты', 'интерактив с гостями', 'впечатляющие кадры для фото'] }
    ],
    sciShow: [
      { name: 'Научное шоу', art: 'science', age: 'до 15 человек', time: '40 минут',
        desc: 'Увлекательные эксперименты, неожиданные реакции и настоящая магия науки.',
        list: ['яркие химические опыты', 'неожиданные реакции', 'участие детей в экспериментах', 'объяснения простым языком'] },
      { name: 'Тесла-шоу', art: 'tesla', age: 'до 15 человек', time: '40 минут',
        desc: 'Электрические разряды, молнии и впечатляющие эксперименты с электричеством.',
        list: ['работа катушки Тесла', 'настоящие молнии', 'эксперименты с электричеством', 'безопасная демонстрация с ведущим'] },
      { name: 'Жонглёр-шоу', art: 'juggler', age: 'до 15 человек', time: '40 минут',
        desc: 'Весёлое цирковое представление с жонглированием, трюками и интерактивом.',
        list: ['цирковые трюки', 'жонглирование разными предметами', 'интерактив с гостями', 'весёлый финал с детьми'] }
    ]
  };

  var style = document.createElement('style');
  style.textContent =
    '@keyframes pgIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}' +
    '@keyframes pgRise{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:.9}100%{opacity:0;transform:translateY(-70px) scale(1.2)}}' +
    '@keyframes pgFall{0%{opacity:0;transform:translateY(-10px) rotate(0)}20%{opacity:1}100%{opacity:0;transform:translateY(70px) rotate(320deg)}}' +
    '@keyframes pgFlash{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.6)}}' +
    '@keyframes pgGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}' +
    '.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:16px}' +
    '.pg-card{position:relative;overflow:hidden;cursor:pointer;background:#fff;border:1px solid rgba(17,26,59,.08);border-radius:18px;padding:0 0 16px;opacity:0;animation:pgIn .5s both;animation-delay:var(--d);box-shadow:0 10px 24px rgba(17,26,59,.08);transition:transform .25s,box-shadow .3s}' +
    '.pg-card:hover{transform:translateY(-6px);box-shadow:0 20px 38px rgba(17,26,59,.16)}' +
    '.pg-cover{position:relative;height:96px;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.pg-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,rgba(255,255,255,.25),transparent 60%)}' +
    '.pg-card:hover .pg-cover svg{transform:scale(1.12) rotate(-4deg)}' +
    '.pg-cover svg{width:64px;height:64px;position:relative;z-index:2;transition:transform .35s}' +
    '.pg-card.open .pg-cover{animation:pgGlow 1.6s ease-in-out infinite}' +
    '.pg-txt{padding:14px 16px 0}' +
    '.pg-name{display:block;font-weight:900;font-size:1rem;color:var(--dark)}' +
    '.pg-meta{display:block;font-size:.78rem;font-weight:700;color:#8a93ab;margin-top:2px}' +
    '.pg-more{display:inline-block;margin-top:10px;font-size:.78rem;font-weight:800;color:var(--blue)}' +
    '.pg-card.open .pg-more{color:var(--red)}' +
    '.pg-body{display:block;max-height:0;overflow:hidden;transition:max-height .5s ease;padding:0 16px}' +
    '.pg-card.open .pg-body{max-height:680px}' +
    '.pg-desc{display:block;font-size:.85rem;font-weight:600;color:#42506e;margin:10px 0 8px}' +
    '.pg-list{list-style:none;margin:0;padding:0}' +
    '.pg-list li{position:relative;font-size:.82rem;font-weight:700;color:#42506e;padding:3px 0 3px 18px;opacity:0}' +
    '.pg-card.open .pg-list li{animation:pgIn .35s forwards;animation-delay:calc(var(--li) * 45ms)}' +
    '.pg-list li:before{content:"";position:absolute;left:2px;top:11px;width:7px;height:7px;border-radius:50%;background:var(--yellow)}' +
    '.pg-fx{position:absolute;pointer-events:none;z-index:3}' +
    '.fx-bubble{border-radius:50%;border:2px solid rgba(255,255,255,.9);animation:pgRise 1.2s ease-out forwards}' +
    '.fx-snow{border-radius:50%;background:#fff;animation:pgFall 1.4s linear forwards}' +
    '.fx-confetti{border-radius:2px;animation:pgFall 1.2s ease-in forwards}' +
    '.fx-spark{border-radius:50%;background:#fff;box-shadow:0 0 12px 4px rgba(255,255,255,.9);animation:pgFlash .7s ease-out forwards}' +
    '.fx-star{border-radius:50%;background:var(--yellow);box-shadow:0 0 10px 3px rgba(255,199,44,.8);animation:pgFlash .9s ease-out forwards}';
  document.head.appendChild(style);

  var PALETTE = ['#e2231a', '#1f5fd6', '#28a745', '#ffc72c'];

  function burst(cover, type) {
    if (!cover) return;
    var count = (type === 'spark' || type === 'star') ? 10 : 14;
    for (var i = 0; i < count; i++) {
      var el = document.createElement('span');
      el.className = 'pg-fx fx-' + type;
      var size = type === 'bubble' ? 6 + Math.random() * 14 : 5 + Math.random() * 7;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = Math.random() * 92 + '%';
      el.style.top = (type === 'bubble' ? 70 + Math.random() * 25 : Math.random() * 70) + '%';
      el.style.animationDelay = (Math.random() * 0.4) + 's';
      if (type === 'confetti') el.style.background = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      cover.appendChild(el);
      setTimeout(function (node) { return function () { node.remove(); }; }(el), 2000);
    }
  }

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
        '<span class="tier-price">' + priceLabel + '</span></div><div class="pg-grid">';
      prog.forEach(function (o, i) {
        var a = ART[o.art];
        html += '<div class="pg-card" data-fx="' + a.p + '" style="--d:' + (i * 80) + 'ms">' +
          '<div class="pg-cover" style="background:linear-gradient(135deg,' + a.g[0] + ',' + a.g[1] + ')">' +
          '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' + a.svg + '</svg></div>' +
          '<div class="pg-txt"><span class="pg-name">' + esc(o.name) + '</span>' +
          '<span class="pg-meta">' + esc(o.age) + ' · ' + esc(o.time) + '</span>' +
          '<span class="pg-more">Что внутри →</span></div>' +
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
      card.addEventListener('click', function () {
        card.classList.toggle('open');
        if (card.classList.contains('open')) burst(card.querySelector('.pg-cover'), card.getAttribute('data-fx'));
      });
    });
    document.getElementById('extraModal').classList.add('active');
  };
})();

/* Planeta Igr — service covers, programme cards, themed effects. No emoji anywhere. */
(function () {
  'use strict';

  var G = {
    red: ['#e2231a', '#ff7a52'], blue: ['#1f5fd6', '#63b3ff'], green: ['#28a745', '#8fe3a6'],
    gold: ['#ffb02c', '#e2231a'], violet: ['#7b2fd6', '#1f5fd6'], ice: ['#1f5fd6', '#8fe3ff'],
    night: ['#111a3b', '#1f5fd6'], pink: ['#c2418a', '#7b2fd6'], wood: ['#b8862b', '#6b4410'],
    teal: ['#28a745', '#63e6ff'], lava: ['#e2231a', '#ffc72c']
  };

  var ART = {
    mask: { g: G.gold, p: 'confetti', svg: '<path d="M12 20c8-4 32-4 40 0 2 14-6 26-20 30-14-4-22-16-20-30z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="32" r="3.5" fill="#fff"/><circle cx="40" cy="32" r="3.5" fill="#fff"/><path d="M26 42c4 3 8 3 12 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M32 20V8m-8 4l-4-5m20 5l4-5" stroke="#fff" stroke-width="3"/>' },
    palette: { g: G.teal, p: 'confetti', svg: '<path d="M32 10c13 0 22 8 22 18 0 7-6 9-11 9-4 0-6 2-6 5s2 4 2 7-3 5-7 5c-12 0-22-9-22-22S19 10 32 10z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="3" fill="#fff"/><circle cx="36" cy="21" r="3" fill="#fff"/><circle cx="44" cy="29" r="3" fill="#fff"/><circle cx="22" cy="36" r="3" fill="#fff"/>' },
    pinata: { g: G.lava, p: 'confetti', svg: '<path d="M32 8l6 14 15 2-11 10 3 15-13-7-13 7 3-15L11 24l15-2z" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 22v10m-5 5h10" stroke="#fff" stroke-width="3"/><path d="M32 49v9" stroke="#fff" stroke-width="3"/>' },
    blaster: { g: G.night, p: 'spark', svg: '<path d="M8 26h34l12 6-12 6H22l-4 10h-8l4-10H8z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="46" cy="32" r="2.5" fill="#fff"/><path d="M16 20v-6m10 6v-6" stroke="#fff" stroke-width="3"/>' },
    volcano: { g: G.lava, p: 'spark', svg: '<path d="M8 52l14-26h20l14 26z" fill="none" stroke="#fff" stroke-width="3"/><path d="M26 26c0-6 2-10 6-14 2 5 6 6 6 12" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 40h20" stroke="#fff" stroke-width="3"/>' },
    ticket: { g: G.blue, p: 'star', svg: '<path d="M8 22h48v8a5 5 0 0 0 0 10v8H8v-8a5 5 0 0 0 0-10z" fill="none" stroke="#fff" stroke-width="3"/><path d="M30 26v4m0 4v4m0 4v4" stroke="#fff" stroke-width="3"/><circle cx="44" cy="32" r="4" fill="#fff"/>' },
    envelope: { g: G.red, p: 'star', svg: '<rect x="8" y="18" width="48" height="30" rx="4" fill="none" stroke="#fff" stroke-width="3"/><path d="M8 22l24 16 24-16" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 8l2 5 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" fill="#fff"/>' },
    table: { g: G.green, p: 'confetti', svg: '<path d="M32 8c10 0 20 6 22 12H10c2-6 12-12 22-12z" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 20v18" stroke="#fff" stroke-width="3"/><rect x="18" y="38" width="28" height="6" rx="3" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 44v10m20-10v10" stroke="#fff" stroke-width="3"/>' },
    balloons2: { g: G.blue, p: 'bubble', svg: '<ellipse cx="20" cy="20" rx="9" ry="11" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="38" cy="16" rx="8" ry="10" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="48" cy="28" rx="7" ry="9" fill="none" stroke="#fff" stroke-width="3"/><path d="M20 31l10 25M38 26l-6 30M48 37l-14 19" stroke="#fff" stroke-width="2.5"/>' },
    gift: { g: G.pink, p: 'confetti', svg: '<rect x="10" y="26" width="44" height="28" rx="4" fill="none" stroke="#fff" stroke-width="3"/><path d="M10 36h44M32 26v28" stroke="#fff" stroke-width="3"/><path d="M32 26c-8 0-12-4-12-8s6-6 12 0c6-6 12-4 12 0s-4 8-12 8z" fill="none" stroke="#fff" stroke-width="3"/>' },
    plate: { g: G.gold, p: 'star', svg: '<circle cx="32" cy="32" r="18" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32" cy="32" r="10" fill="none" stroke="#fff" stroke-width="2"/><path d="M6 16v14a4 4 0 0 0 8 0V16M10 30v18M58 16c0 6-3 8-3 14v18" stroke="#fff" stroke-width="3" fill="none"/>' },
    hourglass: { g: G.violet, p: 'snow', svg: '<path d="M16 8h32M16 56h32" stroke="#fff" stroke-width="3"/><path d="M20 8c0 12 12 18 12 24s-12 12-12 24M44 8c0 12-12 18-12 24s12 12 12 24" fill="none" stroke="#fff" stroke-width="3"/><path d="M26 46h12" stroke="#fff" stroke-width="3"/>' },
    hero: { g: G.violet, p: 'star', svg: '<path d="M32 6l18 8v14c0 12-8 21-18 24-10-3-18-12-18-24V14z" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 16l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff"/>' },
    chest: { g: G.wood, p: 'star', svg: '<rect x="10" y="22" width="44" height="28" rx="4" fill="none" stroke="#fff" stroke-width="3"/><path d="M10 32h44M32 22v-8m0 8c-6 0-10-4-10-8s4-6 10 0c6-6 10-4 10 0s-4 8-10 8z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="32" cy="36" r="4" fill="#fff"/>' },
    alice: { g: G.pink, p: 'star', svg: '<path d="M14 26h26v14a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z" fill="none" stroke="#fff" stroke-width="3"/><path d="M40 30h6a6 6 0 0 1 0 12h-6M12 50h34" stroke="#fff" stroke-width="3" fill="none"/><path d="M22 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8" stroke="#fff" stroke-width="3" fill="none"/>' },
    balloons: { g: G.green, p: 'confetti', svg: '<ellipse cx="22" cy="22" rx="10" ry="12" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="42" cy="26" rx="9" ry="11" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 34c2 8-4 12-2 22M42 37c-2 7 3 10 1 19" stroke="#fff" stroke-width="2.5" fill="none"/>' },
    slime: { g: G.teal, p: 'bubble', svg: '<path d="M24 10h16v12l8 16a10 10 0 0 1-9 14H25a10 10 0 0 1-9-14l8-16z" fill="none" stroke="#fff" stroke-width="3"/><path d="M20 34h24M22 10h20" stroke="#fff" stroke-width="3"/><circle cx="28" cy="42" r="3" fill="#fff"/><circle cx="37" cy="46" r="2" fill="#fff"/>' },
    monster: { g: G.violet, p: 'confetti', svg: '<path d="M32 14c11 0 18 8 18 18s-7 18-18 18-18-8-18-18 7-18 18-18z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="26" cy="30" r="3.5" fill="#fff"/><circle cx="39" cy="30" r="3.5" fill="#fff"/><path d="M25 39c4 4 10 4 14 0M32 14V6M18 20l-5-5M46 20l5-5" stroke="#fff" stroke-width="3" fill="none"/>' },
    candle: { g: G.gold, p: 'spark', svg: '<rect x="24" y="26" width="16" height="28" rx="3" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 26V20M32 8c5 6 6 9 6 12a6 6 0 0 1-12 0c0-3 1-6 6-12z" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 36h16" stroke="#fff" stroke-width="2"/>' },
    bag: { g: G.red, p: 'confetti', svg: '<path d="M14 22h36l4 32H10z" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 22v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 36c4 4 12 4 16 0" stroke="#fff" stroke-width="2.5" fill="none"/>' },
    magnet: { g: G.blue, p: 'spark', svg: '<path d="M18 46V30a14 14 0 0 1 28 0v16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M18 46v6M46 46v6" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' },
    bubbles: { g: G.teal, p: 'bubble', svg: '<circle cx="26" cy="28" r="13" fill="none" stroke="#fff" stroke-width="3"/><circle cx="44" cy="40" r="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="45" cy="19" r="5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="21" cy="23" r="3" fill="#fff"/>' },
    cryo: { g: G.ice, p: 'snow', svg: '<path d="M32 8v48M11 20l42 24M53 20L11 44" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 16l-5-5m5 5l5-5m-5 32l-5 5m5-5l5 5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
    science: { g: G.violet, p: 'bubble', svg: '<path d="M26 8h12v16l10 22a8 8 0 0 1-7 12H23a8 8 0 0 1-7-12l10-22z" fill="none" stroke="#fff" stroke-width="3"/><path d="M22 32h20" stroke="#fff" stroke-width="3"/><circle cx="28" cy="44" r="3" fill="#fff"/><circle cx="37" cy="48" r="2" fill="#fff"/><circle cx="33" cy="38" r="2" fill="#fff"/>' },
    tesla: { g: G.night, p: 'spark', svg: '<path d="M36 6L16 34h12l-6 24 22-30H32z" fill="#fff"/><path d="M8 44l6-4M56 20l-6 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
    juggler: { g: G.gold, p: 'confetti', svg: '<circle cx="16" cy="34" r="6" fill="#fff"/><circle cx="32" cy="16" r="6" fill="#fff"/><circle cx="48" cy="34" r="6" fill="#fff"/><path d="M12 48c6-14 34-14 40 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>' }
  };

  var SERVICE_ART = {
    animator: 'mask', quest: 'chest', masterclass: 'palette', sciShow: 'science', bubbles: 'bubbles',
    pinata: 'pinata', qzar: 'blaster', lavaFloor: 'volcano', unlimitedTicket: 'ticket', invite: 'envelope',
    tables: 'table', balloonFountain: 'balloons2', surpriseBalloon: 'gift', serving: 'plate', timeCards: 'hourglass'
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
    '@keyframes pgRise{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:.9}100%{opacity:0;transform:translateY(-80px) scale(1.2)}}' +
    '@keyframes pgFall{0%{opacity:0;transform:translateY(-10px) rotate(0)}20%{opacity:1}100%{opacity:0;transform:translateY(90px) rotate(320deg)}}' +
    '@keyframes pgFlash{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.7)}}' +
    '@keyframes pgGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}' +
    '.extra-card{padding:0 !important;overflow:hidden}' +
    '.ec-cover{position:relative;height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.ec-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 72% 18%,rgba(255,255,255,.28),transparent 62%)}' +
    '.ec-cover svg{width:78px;height:78px;position:relative;z-index:2;transition:transform .35s}' +
    '.extra-card:hover .ec-cover svg{transform:scale(1.14) rotate(-5deg)}' +
    '.ec-body{padding:16px 20px 20px}' +
    '.ec-body h4{font-size:1.05rem;margin-bottom:2px}' +
    '.em-art{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.em-art svg{width:112px;height:112px;position:relative;z-index:2}' +
    '.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:16px}' +
    '.pg-card{position:relative;overflow:hidden;cursor:pointer;background:#fff;border:1px solid rgba(17,26,59,.08);border-radius:18px;padding:0 0 16px;opacity:0;animation:pgIn .5s both;animation-delay:var(--d);box-shadow:0 10px 24px rgba(17,26,59,.08);transition:transform .25s,box-shadow .3s}' +
    '.pg-card:hover{transform:translateY(-6px);box-shadow:0 20px 38px rgba(17,26,59,.16)}' +
    '.pg-cover{position:relative;height:96px;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.pg-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,rgba(255,255,255,.25),transparent 60%)}' +
    '.pg-cover svg{width:64px;height:64px;position:relative;z-index:2;transition:transform .35s}' +
    '.pg-card:hover .pg-cover svg{transform:scale(1.12) rotate(-4deg)}' +
    '.pg-card.open .pg-cover{animation:pgGlow 1.6s ease-in-out infinite}' +
    '.pg-txt{padding:14px 16px 0}' +
    '.pg-name{display:block;font-weight:900;font-size:1rem;color:var(--dark)}' +
    '.pg-meta{display:block;font-size:.78rem;font-weight:700;color:#8a93ab;margin-top:2px}' +
    '.pg-more{display:inline-block;margin-top:10px;font-size:.78rem;font-weight:800;color:var(--blue)}' +
    '.pg-card.open .pg-more{color:var(--red)}' +
    '.pg-body{display:block;max-height:0;overflow:hidden;transition:max-height .5s ease;padding:0 16px}' +
    '.pg-card.open .pg-body{max-height:700px}' +
    '.pg-desc{display:block;font-size:.85rem;font-weight:600;color:#42506e;margin:10px 0 8px}' +
    '.pg-list{list-style:none;margin:0;padding:0}' +
    '.pg-list li{position:relative;font-size:.82rem;font-weight:700;color:#42506e;padding:3px 0 3px 18px;opacity:0}' +
    '.pg-card.open .pg-list li{animation:pgIn .35s forwards;animation-delay:calc(var(--li) * 45ms)}' +
    '.pg-list li:before{content:"";position:absolute;left:2px;top:11px;width:7px;height:7px;border-radius:50%;background:var(--yellow)}' +
    '.pg-fx{position:absolute;pointer-events:none;z-index:3}' +
    '.fx-bubble{border-radius:50%;border:2px solid rgba(255,255,255,.9);animation:pgRise 1.3s ease-out forwards}' +
    '.fx-snow{border-radius:50%;background:#fff;animation:pgFall 1.5s linear forwards}' +
    '.fx-confetti{border-radius:2px;animation:pgFall 1.3s ease-in forwards}' +
    '.fx-spark{border-radius:50%;background:#fff;box-shadow:0 0 12px 4px rgba(255,255,255,.9);animation:pgFlash .75s ease-out forwards}' +
    '.fx-star{border-radius:50%;background:var(--yellow);box-shadow:0 0 10px 3px rgba(255,199,44,.85);animation:pgFlash .9s ease-out forwards}';
  document.head.appendChild(style);

  var PALETTE = ['#e2231a', '#1f5fd6', '#28a745', '#ffc72c'];

  function burst(host, type, amount) {
    if (!host) return;
    var count = amount || ((type === 'spark' || type === 'star') ? 12 : 16);
    for (var i = 0; i < count; i++) {
      var el = document.createElement('span');
      el.className = 'pg-fx fx-' + type;
      var size = type === 'bubble' ? 6 + Math.random() * 16 : 5 + Math.random() * 8;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = Math.random() * 92 + '%';
      el.style.top = (type === 'bubble' ? 70 + Math.random() * 25 : Math.random() * 70) + '%';
      el.style.animationDelay = (Math.random() * 0.45) + 's';
      if (type === 'confetti') el.style.background = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      host.appendChild(el);
      setTimeout(function (node) { return function () { node.remove(); }; }(el), 2200);
    }
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function artOf(id) { return ART[SERVICE_ART[id]] || ART.balloons; }

  function cover(id, cls) {
    var a = artOf(id);
    return '<div class="' + cls + '" style="background:linear-gradient(135deg,' + a.g[0] + ',' + a.g[1] + ')">' +
      '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' + a.svg + '</svg></div>';
  }

  window.renderExtras = function () {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(EXTRAS).forEach(function (id) {
      var ex = EXTRAS[id];
      var card = document.createElement('div');
      card.className = 'extra-card';
      card.onclick = function () { openExtraModal(id); };
      var priceLabel = (ex.priceFrom ? 'от ' : '') + ex.price.toLocaleString('ru-RU') + ' ₽';
      var hint = [ex.duration ? ex.duration + ' мин' : '', ex.upto || ''].filter(Boolean).join(' · ');
      card.innerHTML = cover(id, 'ec-cover') +
        '<div class="ec-body"><h4>' + esc(ex.name) + '</h4>' +
        '<div class="extra-price">' + priceLabel + '</div>' +
        '<div class="extra-hint">' + esc(hint) + '</div></div>';
      grid.appendChild(card);
    });
  };

  window.openExtraModal = function (id) {
    var ex = EXTRAS[id];
    if (!ex) return;
    var a = artOf(id);
    document.getElementById('extraModalTitle').textContent = ex.name;
    var media = document.getElementById('extraModalMedia');
    media.innerHTML = ex.photo
      ? '<img src="' + ex.photo + '" alt="' + esc(ex.name) + '">'
      : cover(id, 'em-art');

    var priceLabel = (ex.priceFrom ? 'от ' : '') + ex.price.toLocaleString('ru-RU') + ' ₽';
    var html = '<p>' + esc(ex.desc) + '</p>';
    var prog = PROGRAMS[id];

    html += '<div class="tier-row"><span>' + (ex.upto ? esc(ex.upto) + (ex.duration ? ' · ' : '') : '') +
      (ex.duration ? ex.duration + ' мин' : '') + '</span><span class="tier-price">' + priceLabel + '</span></div>';

    if (prog) {
      html += '<div class="pg-grid">';
      prog.forEach(function (o, i) {
        var pa = ART[o.art];
        html += '<div class="pg-card" data-fx="' + pa.p + '" style="--d:' + (i * 80) + 'ms">' +
          '<div class="pg-cover" style="background:linear-gradient(135deg,' + pa.g[0] + ',' + pa.g[1] + ')">' +
          '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' + pa.svg + '</svg></div>' +
          '<div class="pg-txt"><span class="pg-name">' + esc(o.name) + '</span>' +
          '<span class="pg-meta">' + esc(o.age) + ' · ' + esc(o.time) + '</span>' +
          '<span class="pg-more">Что внутри →</span></div>' +
          '<span class="pg-body"><span class="pg-desc">' + esc(o.desc) + '</span><ul class="pg-list">' +
          o.list.map(function (li, k) { return '<li style="--li:' + k + '">' + esc(li) + '</li>'; }).join('') +
          '</ul></span></div>';
      });
      html += '</div>';
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
    burst(media.querySelector('.em-art') || media, a.p, 18);
  };

  renderExtras();
})();

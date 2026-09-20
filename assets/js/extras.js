/* Planeta Igr — extras grid rendered from /api/extras
   Falls back to the static EXTRAS object if the API is unavailable. */
(function () {
  'use strict';

  /* ---------- fallback (same data as before) ---------- */
  var FALLBACK = {
    azot:        { title: 'Азот-шоу',        price: 13000, price_from: false, duration_min: 20, upto: null,           emoji: '🧊', photo_url: null,                                      color1: '#e2231a', color2: '#ff8a65', options: null },
    neon:        { title: 'Неоновое шоу',    price: 10000, price_from: false, duration_min: 20, upto: null,           emoji: '💡', photo_url: null,                                      color1: '#1f5fd6', color2: '#63e6ff', options: null },
    bubbles:     { title: 'Мыльные пузыри',  price: 10000, price_from: false, duration_min: 20, upto: null,           emoji: '🫧', photo_url: 'assets/images/extras/extra-bubbles.jpg', color1: '#28a745', color2: '#8fe3a6', options: null },
    challenge:   { title: 'Челлендж-пати',  price:  8500, price_from: false, duration_min: 30, upto: null,           emoji: '🏆', photo_url: null,                                      color1: '#ffc72c', color2: '#ffe27a', options: null },
    pinata:      { title: 'Пинята',          price:  4000, price_from: true,  duration_min: 15, upto: null,           emoji: '🪅', photo_url: null,                                      color1: '#e2231a', color2: '#ffc72c', options: null },
    masterclass: { title: 'Мастер-класс',   price: 10000, price_from: false, duration_min: 40, upto: 'до 10 человек',emoji: '🎨', photo_url: null,                                      color1: '#28a745', color2: '#63e6ff',
      options: [{name:'Слайм-лаборатория',meta:'5+ лет · 30–40 мин'},{name:'Пушистый Монстрик',meta:'4+ лет · 30–40 мин'},{name:'Свеча из вощины',meta:'5+ лет · 25–30 мин'},{name:'Роспись шопера',meta:'6+ лет · 40–60 мин'},{name:'Магнитик на память',meta:'4+ лет · 25–30 мин'}] },
    quest:       { title: 'Квест',           price:  8000, price_from: false, duration_min: 40, upto: 'до 12 человек',emoji: '🗝️',photo_url: null,                                      color1: '#1f5fd6', color2: '#111a3b',
      options: [{name:'Академия Супергероев',meta:'5–8 лет · 40 мин'},{name:'Форт Бойард',meta:'6–10 лет · 45 мин'},{name:'Алиса в Стране Чудес',meta:'5–8 лет · 40 мин'},{name:'Мультиквест',meta:'5–6 лет · 40 мин'}] },
    animator:    { title: 'Аниматор',        price:  8000, price_from: false, duration_min: 60, upto: null,           emoji: '🎭', photo_url: null,                                      color1: '#ffc72c', color2: '#e2231a', options: null },
    magician:    { title: 'Фокусник',        price: 15000, price_from: false, duration_min: 30, upto: null,           emoji: '🎩', photo_url: 'assets/images/extras/extra-magician.jpg', color1: '#111a3b', color2: '#1f5fd6', options: null }
  };

  /* ---------- helpers ---------- */
  function money(n) { return Number(n).toLocaleString('ru-RU') + ' ₽'; }

  function buildCard(slug, ex) {
    var priceLabel = (ex.price_from ? 'от ' : '') + money(ex.price);
    var hint = '~' + ex.duration_min + ' мин' + (ex.upto ? ' · ' + ex.upto : '');
    var card = document.createElement('div');
    card.className = 'extra-card';
    card.dataset.slug = slug;

    if (ex.photo_url) {
      /* карточка с фото */
      card.innerHTML =
        '<div class="extra-card-img"><img loading="lazy" decoding="async" src="' + ex.photo_url + '" alt="' + ex.title + '"></div>' +
        '<div class="extra-card-body">' +
          '<div class="extra-card-emoji">' + ex.emoji + '</div>' +
          '<h4>' + ex.title + '</h4>' +
          '<div class="extra-price">' + priceLabel + '</div>' +
          '<div class="extra-hint">' + hint + '</div>' +
        '</div>';
    } else {
      /* карточка без фото — градиентный фон */
      card.innerHTML =
        '<div class="extra-card-icon" style="background:linear-gradient(135deg,' + ex.color1 + ',' + ex.color2 + ')">' + ex.emoji + '</div>' +
        '<h4>' + ex.title + '</h4>' +
        '<div class="extra-price">' + priceLabel + '</div>' +
        '<div class="extra-hint">' + hint + '</div>';
    }

    card.addEventListener('click', function () {
      if (typeof openExtraModal === 'function') {
        /* передаём полный объект в модалку */
        openExtraModalFromData(slug, ex);
      }
    });
    return card;
  }

  function renderExtras(list) {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return;
    grid.innerHTML = '';

    /* обновляем глобальный EXTRAS чтобы модалки и форма заказа работали */
    if (typeof EXTRAS !== 'undefined') {
      list.forEach(function (ex) {
        EXTRAS[ex.slug] = {
          name: ex.title,
          price: ex.price,
          priceFrom: ex.price_from,
          duration: ex.duration_min,
          upto: ex.upto,
          emoji: ex.emoji,
          photo: ex.photo_url,
          c1: ex.color1,
          c2: ex.color2,
          desc: ex.description,
          options: ex.options
        };
      });
    }

    list.forEach(function (ex) {
      grid.appendChild(buildCard(ex.slug, ex));
    });

    /* сообщаем форме заказа что экстры обновились */
    if (typeof renderOrderOptions === 'function') renderOrderOptions();
  }

  function useFallback() {
    var list = Object.keys(FALLBACK).map(function (slug) {
      var ex = FALLBACK[slug];
      return Object.assign({ slug: slug, title: ex.title, description: '' }, ex);
    });
    renderExtras(list);
  }

  /* ---------- fetch ---------- */
  fetch('/api/extras')
    .then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (data.ok && Array.isArray(data.extras) && data.extras.length) {
        renderExtras(data.extras);
      } else {
        useFallback();
      }
    })
    .catch(function () {
      useFallback();
    });

  /* ---------- openExtraModalFromData (расширяет текущую openExtraModal) ---------- */
  window.openExtraModalFromData = function (id, ex) {
    document.getElementById('extraModalTitle').textContent = ex.title;
    var media = document.getElementById('extraModalMedia');
    if (ex.photo_url) {
      media.innerHTML = '<img loading="lazy" decoding="async" src="' + ex.photo_url + '" alt="' + ex.title + '">';
    } else {
      media.innerHTML = '<div class="icon-block" style="background:linear-gradient(135deg,' + ex.color1 + ',' + ex.color2 + ');">' + ex.emoji + '</div>';
    }
    var body = '<p>' + (ex.description || '') + '</p>';
    if (ex.options && ex.options.length) {
      body += '<div style="margin-top:6px;">';
      ex.options.forEach(function (o) {
        body += '<div class="tier-row"><span>' + o.name + '<br><span style="font-weight:600;color:#8a93ab;font-size:.78rem;">' + o.meta + '</span></span><span class="tier-price">' + Number(ex.price).toLocaleString('ru-RU') + ' ₽</span></div>';
      });
      body += '</div>';
    } else {
      var priceLabel = (ex.price_from ? 'от ' : '') + Number(ex.price).toLocaleString('ru-RU') + ' ₽';
      body += '<div class="tier-row"><span>Стоимость услуги · ~' + ex.duration_min + ' мин</span><span class="tier-price">' + priceLabel + '</span></div>';
    }
    body += '<a href="javascript:void(0)" class="btn btn-primary" style="width:100%;margin-top:16px;text-align:center;" onclick="closeExtraModal();openOrder(null,null,\'' + id + '\')">Заказать праздник</a>';
    document.getElementById('extraModalBody').innerHTML = body;
    document.getElementById('extraModal').classList.add('active');
  };

})();

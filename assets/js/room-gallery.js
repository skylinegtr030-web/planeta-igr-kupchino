/* Rotating photos and concise copy for the two main room cards. */
(function () {
  'use strict';

  var FALLBACK = {
    jungle: ['assets/images/rooms/jungle/room-jungle-1.jpg', 'assets/images/rooms/jungle/room-jungle-2.jpg', 'assets/images/rooms/jungle/f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg', 'assets/images/rooms/jungle/fe0f8752-696e-4f60-9c88-fcea23ef4103.jpeg'],
    loft: ['assets/images/rooms/loft/room-loft-1.jpg', 'assets/images/rooms/loft/room-loft-2.jpg', 'assets/images/rooms/loft/9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg', 'assets/images/rooms/loft/a1f34b81-2c83-43d4-beb4-c847afdeb72c.jpeg']
  };

  var descriptions = [
    'До 12 человек. Яркая комната для детей помладше.',
    'До 20 человек. Стильная комната для детей постарше.'
  ];

  var style = document.createElement('style');
  style.textContent = '#rooms > .section-inner > .activity > img{transition:opacity .6s ease,transform .4s;opacity:1}';
  document.head.appendChild(style);

  function photosFor(key) {
    var content = window.PG_CONTENT;
    var list = content && content.photos && content.photos[key];
    return list && list.length ? list.slice() : FALLBACK[key];
  }

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function noteText() {
    var content = window.PG_CONTENT;
    var rooms = (content && content.rooms) || {};
    var one = rooms.extendOne || 2500;
    var two = rooms.extendTwo || 5000;
    return 'Продление одной комнаты — ' + money(one) + ' / час · продление двух комнат — ' + money(two) + ' / час';
  }

  function rotate(img, photos, delay) {
    if (!img || img.dataset.galleryReady) return;
    img.dataset.galleryReady = '1';
    photos.forEach(function (src) { var pre = new Image(); pre.src = src; });
    var index = 0;
    setTimeout(function () {
      setInterval(function () {
        index = (index + 1) % photos.length;
        img.style.opacity = '0';
        setTimeout(function () {
          img.src = photos[index];
          img.style.opacity = '1';
        }, 600);
      }, 5000);
    }, delay);
  }

  function updateCopy(cards) {
    cards.forEach(function (card, index) {
      var paragraph = card.querySelector('h3 + p');
      if (paragraph) paragraph.textContent = descriptions[index];
    });
    var duoParagraph = document.querySelector('#roomDuo h3 + p');
    if (duoParagraph) duoParagraph.textContent = '«Джунгли» + «Лофт» для большой компании.';
    var note = document.querySelector('#rooms .room-note');
    if (note) note.textContent = noteText();
  }

  var attempts = 0;
  function start() {
    var cards = document.querySelectorAll('#rooms > .section-inner > .activity:not(#roomDuo)');
    if (cards.length < 2) {
      if (attempts++ < 20) setTimeout(start, 300);
      return;
    }
    updateCopy(cards);
    rotate(cards[0].querySelector(':scope > img'), photosFor('jungle'), 0);
    rotate(cards[1].querySelector(':scope > img'), photosFor('loft'), 2500);
  }
  start();

  window.addEventListener('pg:content', function () {
    var note = document.querySelector('#rooms .room-note');
    if (note) note.textContent = noteText();
  });

  ['assets/js/content-apply.js?v=1', 'assets/js/balloon-game.js?v=1', 'assets/js/party-art.js?v=2', 'assets/js/reviews-rotator.js?v=2', 'assets/js/copy-polish.js?v=1', 'assets/js/pack-readability.js?v=1', 'assets/js/extras-fix.js?v=2', 'assets/js/price-tiers.js?v=4', 'assets/js/address-fix.js?v=3', 'assets/js/collage-unique.js?v=2', 'assets/js/ages.js?v=1'].forEach(function (src) {
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  });
})();

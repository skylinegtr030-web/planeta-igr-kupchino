/* Rotating photos and concise copy for the two main room cards. */
(function () {
  'use strict';

  var sets = [
    ['room-jungle-1.jpg', 'room-jungle-2.jpg', 'f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg', 'fe0f8752-696e-4f60-9c88-fcea23ef4103.jpeg'],
    ['room-loft-1.jpg', 'room-loft-2.jpg', '9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg', 'a1f34b81-2c83-43d4-beb4-c847afdeb72c.jpeg']
  ];

  var descriptions = [
    'До 12 человек. Яркая комната для детей помладше.',
    'До 20 человек. Стильная комната для детей постарше.'
  ];

  var style = document.createElement('style');
  style.textContent = '#rooms > .section-inner > .activity > img{transition:opacity .6s ease,transform .4s;opacity:1}';
  document.head.appendChild(style);

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
    if (note) note.textContent = 'Продление одной комнаты — 2 500 ₽ / час · продление двух комнат — 5 000 ₽ / час';
  }

  var attempts = 0;
  function start() {
    var cards = document.querySelectorAll('#rooms > .section-inner > .activity:not(#roomDuo)');
    if (cards.length < 2) {
      if (attempts++ < 20) setTimeout(start, 300);
      return;
    }
    updateCopy(cards);
    rotate(cards[0].querySelector(':scope > img'), sets[0], 0);
    rotate(cards[1].querySelector(':scope > img'), sets[1], 2500);
  }
  start();

  ['balloon-game.js?v=1', 'party-art.js?v=2', 'reviews-rotator.js?v=2', 'copy-polish.js?v=1', 'pack-readability.js?v=1', 'extras-fix.js?v=2', 'price-tiers.js?v=3', 'address-fix.js?v=1'].forEach(function (src) {
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  });
})();

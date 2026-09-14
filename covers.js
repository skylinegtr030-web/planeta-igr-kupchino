/* Planeta Igr — photo covers for service cards + rotating duo-room collage. */
(function () {
  'use strict';

  var PHOTO = {
    animator: 'generated-image%20(13).jpg',
    quest: 'generated-image%20(8).jpg',
    masterclass: 'generated-image%20(9).jpg',
    sciShow: 'generated-image%20(1).jpg',
    bubbles: 'generated-image%20(10).jpg',
    pinata: 'generated-image%20(7).jpg',
    qzar: 'generated-image%20(14).jpg',
    lavaFloor: 'generated-image%20(12).jpg',
    unlimitedTicket: 'generated-image%20(6).jpg',
    invite: 'generated-image.jpg',
    tables: 'generated-image%20(5).jpg',
    balloonFountain: 'generated-image%20(4).jpg',
    surpriseBalloon: 'generated-image%20(3).jpg',
    serving: 'generated-image%20(2).jpg',
    timeCards: 'generated-image%20(11).jpg'
  };

  var DUO_FALLBACK = [
    [
      'room-jungle-1.jpg',
      'room-jungle-2.jpg',
      'f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg',
      'fe0f8752-696e-4f60-9c88-fcea23ef4103.jpeg'
    ],
    [
      'room-loft-1.jpg',
      'room-loft-2.jpg',
      '9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg',
      'a1f34b81-2c83-43d4-beb4-c847afdeb72c.jpeg'
    ]
  ];
  function duoLists() {
    var photos = (window.PG_CONTENT && window.PG_CONTENT.photos) || {};
    var left = photos.jungle && photos.jungle.length ? photos.jungle : DUO_FALLBACK[0];
    var right = photos.loft && photos.loft.length ? photos.loft : DUO_FALLBACK[1];
    return [left.slice(), right.slice()];
  }

  var st = document.createElement('style');
  st.textContent =
    '.ec-cover img.pi-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;transition:transform .45s}' +
    '.extra-card:hover .ec-cover img.pi-photo{transform:scale(1.06)}' +
    '.extra-price{font-size:1.25rem;letter-spacing:-.02em}' +
    '.extra-modal-media{height:210px}' +
    '.em-art img.pi-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}' +
    '.extra-modal-media:after{z-index:1;height:88%;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.92) 55%,#fff 82%)}' +
    '.extra-modal-body{position:relative;z-index:2;margin-top:-46px}' +
    '.extra-modal-body p{color:#111a3b;font-weight:700}' +
    '.extra-modal-body .tier-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:6px 0 2px;padding:0 0 12px;background:none;border:0;border-bottom:1px solid rgba(17,26,59,.1);border-radius:0;font-size:1rem;font-weight:700;color:#42506e}' +
    '.extra-modal-body .tier-price{flex:none;background:none;box-shadow:none;padding:0;border-radius:0;font-size:1.15rem;font-weight:900;color:#e2231a;white-space:nowrap}' +
    '.rm-duo img{opacity:1;transition:opacity .6s ease,transform .4s}';
  document.head.appendChild(st);

  function put(host, src, alt) {
    if (!host || host.querySelector('img.pi-photo')) return;
    var svg = host.querySelector('svg');
    if (svg) svg.style.display = 'none';
    var img = document.createElement('img');
    img.className = 'pi-photo';
    img.src = src;
    img.alt = alt || '';
    img.loading = 'lazy';
    host.appendChild(img);
  }

  function decorate() {
    if (typeof EXTRAS === 'undefined' || !EXTRAS) return;
    var keys = Object.keys(EXTRAS);
    var cards = document.querySelectorAll('#extrasGrid .extra-card');
    for (var i = 0; i < cards.length && i < keys.length; i++) {
      var ph = PHOTO[keys[i]];
      if (ph) put(cards[i].querySelector('.ec-cover'), ph, EXTRAS[keys[i]].name);
    }
  }

  function rotate(img, list, offset) {
    if (!img || list.length < 2) return;
    list.forEach(function (src) { var pre = new Image(); pre.src = src; });
    var i = 0;
    setTimeout(function () {
      setInterval(function () {
        i = (i + 1) % list.length;
        var next = list[i];
        img.style.opacity = '0';
        setTimeout(function () {
          img.src = next;
          img.style.opacity = '1';
        }, 600);
      }, 5000);
    }, offset);
  }

  var tries = 0;
  function startDuo() {
    var imgs = document.querySelectorAll('#roomDuo .rm-duo img');
    if (imgs.length < 2) {
      if (tries++ < 20) setTimeout(startDuo, 400);
      return;
    }
    if (imgs[0].dataset.piRotate) return;
    imgs[0].dataset.piRotate = '1';
    imgs[1].dataset.piRotate = '1';
    var duo = duoLists();
    rotate(imgs[0], duo[0], 0);
    rotate(imgs[1], duo[1], 2500);
  }
  startDuo();

  var origRender = window.renderExtras;
  window.renderExtras = function () {
    if (origRender) origRender.apply(this, arguments);
    decorate();
  };
  decorate();

  var origOpen = window.openExtraModal;
  window.openExtraModal = function (id) {
    if (origOpen) origOpen.apply(this, arguments);

    var row = document.querySelector('#extraModalBody .tier-row');
    if (row && row.firstElementChild && !row.firstElementChild.textContent.trim()) {
      row.firstElementChild.textContent = 'Стоимость услуги';
    }

    var ph = PHOTO[id];
    var media = document.getElementById('extraModalMedia');
    if (!ph || !media) return;
    var art = media.querySelector('.em-art');
    if (art) {
      put(art, ph, id);
    } else {
      var img = media.querySelector('img');
      if (img) img.src = ph;
    }
  };
})();

/* Planeta Igr — photo covers for service cards. Loaded after programs.js. */
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
    '.extra-modal-body .tier-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 2px;padding:12px 16px;border-bottom:0;background:#f4f6fb;border:1px solid rgba(17,26,59,.08);border-radius:16px;font-size:.85rem;color:#42506e}' +
    '.extra-modal-body .tier-price{flex:none;font-size:1.3rem;font-weight:900;color:#e2231a;background:#fff;border-radius:12px;padding:6px 14px;box-shadow:0 6px 16px rgba(226,35,26,.18)}';
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

  var origRender = window.renderExtras;
  window.renderExtras = function () {
    if (origRender) origRender.apply(this, arguments);
    decorate();
  };
  decorate();

  var origOpen = window.openExtraModal;
  window.openExtraModal = function (id) {
    if (origOpen) origOpen.apply(this, arguments);
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

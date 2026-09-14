/* Hero collage: four tiles that never show the same photo at the same time. */
(function () {
  'use strict';

  var FALLBACK = [
    'hero-collage-1.jpg',
    'hero-collage-2.jpg',
    'hero-collage-3.jpg',
    'hero-collage-4.jpg',
    'hero-collage-5.jpg',
    'hero-collage-6.jpg',
    'room-jungle-1.jpg',
    'room-jungle-2.jpg',
    'room-loft-1.jpg',
    'room-loft-2.jpg',
    'lava-pol-real-1.jpg',
    'lava-pol-real-2.jpg',
    'lava-pol-real-3.jpg',
    'kuzar-real-arena-1.jpg',
    'kuzar-real-arena-2.jpg',
    'kuzar-real-arena-3.jpg'
  ];

  var ALT = 'Детский праздник в «Планете игр»';
  var SWAP_MS = 4500;
  var FADE_MS = 900;

  var style = document.createElement('style');
  style.textContent = '.collage-slot img{animation:none!important;opacity:1;transition:opacity ' + FADE_MS + 'ms ease}.collage-slot img.pg-out{opacity:0}';
  document.head.appendChild(style);

  var pool = FALLBACK.slice();
  var slots = [];
  var shown = [];
  var cursor = 0;
  var timer = null;

  function readPool() {
    var content = window.PG_CONTENT;
    var list = content && content.photos && content.photos.collage;
    if (list && list.length >= 4) return list.slice();
    return FALLBACK.slice();
  }

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function makeImage(src) {
    var img = document.createElement('img');
    img.src = src;
    img.alt = ALT;
    img.decoding = 'async';
    return img;
  }

  function swap() {
    // Учитываем и уходящие кадры во время затухания, чтобы повтор не мелькал даже на миг.
    var visible = Array.prototype.map.call(
      document.querySelectorAll('.collage .collage-slot img'),
      function (img) { return img.getAttribute('src'); }
    );
    var free = pool.filter(function (src) { return visible.indexOf(src) === -1; });
    if (!free.length) return;
    var index = cursor % slots.length;
    cursor++;
    var src = free[Math.floor(Math.random() * free.length)];
    var slot = slots[index];
    var previous = slot.querySelector('img');
    var next = makeImage(src);
    next.style.opacity = '0';
    slot.appendChild(next);
    shown[index] = src;
    requestAnimationFrame(function () {
      next.style.opacity = '1';
      if (previous) previous.classList.add('pg-out');
    });
    setTimeout(function () {
      if (previous && previous.parentNode) previous.parentNode.removeChild(previous);
    }, FADE_MS + 120);
  }

  function init() {
    var found = document.querySelectorAll('.collage .collage-slot');
    if (found.length < 2) return false;

    pool = readPool();
    slots = Array.prototype.slice.call(found);
    var picks = shuffled(pool).slice(0, slots.length);
    shown = [];

    slots.forEach(function (slot, index) {
      slot.innerHTML = '';
      slot.appendChild(makeImage(picks[index]));
      shown[index] = picks[index];
    });

    pool.forEach(function (src) {
      var pre = new Image();
      pre.src = src;
    });

    if (timer) clearInterval(timer);
    timer = setInterval(swap, SWAP_MS);
    return true;
  }

  var attempts = 0;
  function boot() {
    if (init()) return;
    if (attempts++ < 30) setTimeout(boot, 300);
  }

  boot();
  window.addEventListener('pg:content', function () { init(); });
  window.addEventListener('load', function () {
    if (!slots.length) {
      attempts = 0;
      boot();
    }
  });
})();

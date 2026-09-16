/* Age limits for the activity blocks (laser tag and LED floor). */
(function () {
  'use strict';

  var DEFAULTS = { kuzar: 7, lavaFloor: 4 };

  function ages() {
    var source = (window.PG_CONTENT && window.PG_CONTENT.ages) || {};
    return {
      kuzar: source.kuzar || DEFAULTS.kuzar,
      lavaFloor: source.lavaFloor || DEFAULTS.lavaFloor
    };
  }

  var style = document.createElement('style');
  style.textContent = '.pg-age{display:inline-flex;align-items:center;margin-top:14px;padding:8px 18px;border-radius:999px;background:rgba(31,95,214,.1);color:#1f5fd6;font-weight:900;font-size:.88rem}';
  document.head.appendChild(style);

  function label(value) {
    return 'Для детей от ' + value + ' лет';
  }

  function ageFor(src, values) {
    if (/kuzar|кузар/i.test(src)) return values.kuzar;
    if (/lava|лава|лаава/i.test(src)) return values.lavaFloor;
    return null;
  }

  function apply() {
    var values = ages();
    var cards = document.querySelectorAll('#activities .activity');
    if (!cards.length) return false;
    var touched = false;

    Array.prototype.forEach.call(cards, function (card) {
      var img = card.querySelector('img');
      if (!img) return;
      var src = decodeURIComponent(img.getAttribute('src') || '');
      var value = ageFor(src, values);
      if (!value) return;

      var text = label(value);
      var badge = card.querySelector('.pg-age');
      if (badge) {
        if (badge.textContent !== text) badge.textContent = text;
        touched = true;
        return;
      }

      badge = document.createElement('div');
      badge.className = 'pg-age';
      badge.textContent = text;

      var paragraph = card.querySelector('h3 + p');
      if (paragraph && paragraph.parentNode) {
        paragraph.parentNode.insertBefore(badge, paragraph.nextSibling);
      } else {
        var column = card.querySelector('div');
        (column || card).appendChild(badge);
      }
      touched = true;
    });

    return touched;
  }

  var attempts = 0;
  function loop() {
    apply();
    if (attempts++ < 25) setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('pg:content', apply);
  window.addEventListener('load', apply);
})();

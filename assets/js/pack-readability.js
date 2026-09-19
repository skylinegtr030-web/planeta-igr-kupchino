/* Keeps package card text readable on any card background. */
(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '#prices .pack{padding:24px 22px 26px}',
    '#prices .pack h3{font-size:1.55rem;line-height:1.2;margin:10px 0 6px}',
    '#prices .pack .guests{font-size:.92rem;font-weight:800;opacity:.95}',
    '#prices .pack .pack-tag{background:#fff;color:#111a3b;box-shadow:0 6px 16px rgba(17,26,59,.22);letter-spacing:.4px;font-size:.72rem;padding:6px 13px}',
    '#prices .pack .badge{background:rgba(255,255,255,.96);color:#111a3b}',
    '#prices .pack.pg-dark{color:#fff}',
    '#prices .pack.pg-dark h3,#prices .pack.pg-dark .guests,#prices .pack.pg-dark li,#prices .pack.pg-dark p,#prices .pack.pg-dark span:not(.pack-tag):not(.badge){color:#fff}',
    '#prices .pack.pg-dark h3{text-shadow:0 2px 10px rgba(0,0,0,.28)}',
    '#prices .pack.pg-dark .guests{color:rgba(255,255,255,.94)}',
    '#prices .pack.pg-light{color:#111a3b}',
    '#prices .pack.pg-light .pk-head h3,#prices .pack.pg-dark .pk-head h3{color:#fff !important;text-shadow:0 2px 12px rgba(0,0,0,.5) !important}',
    '#prices .pack.pg-light .pk-head .pk-guests,#prices .pack.pg-dark .pk-head .pk-guests{color:#fff !important}',
    '#prices .pack .price,#prices .pack .pk-price,#prices .pack .rm-price{color:#111a3b!important;text-shadow:none!important}',
    '#prices .pack .pg-chip{background:#fff;border-radius:16px;padding:12px 16px;box-shadow:0 8px 20px rgba(17,26,59,.16)}',
    '#prices .pack .pg-chip b,#prices .pack .pg-chip small{color:#5b6580!important;font-size:.7rem;letter-spacing:.6px;text-transform:uppercase;display:block;margin-bottom:2px;text-shadow:none}',
    '#prices .pack .pg-chip strong,#prices .pack .pg-chip span{color:#111a3b!important;font-size:1.32rem;font-weight:900;text-shadow:none}',
    '@media(max-width:600px){#prices .pack h3{font-size:1.35rem}}'
  ].join('');
  document.head.appendChild(style);

  function luminance(color) {
    var parts = (color || '').match(/\d+(\.\d+)?/g);
    if (!parts || parts.length < 3) return null;
    if (parts.length > 3 && parseFloat(parts[3]) === 0) return null;
    var channels = parts.slice(0, 3).map(function (value) {
      var channel = parseFloat(value) / 255;
      return channel <= .03928 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
    });
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }

  function cardTone(card) {
    var computed = window.getComputedStyle(card);
    var value = luminance(computed.backgroundColor);
    var image = computed.backgroundImage || '';
    if (image && image !== 'none') {
      var stops = image.match(/rgba?\([^)]+\)/g) || [];
      var values = stops.map(luminance).filter(function (item) { return item !== null; });
      if (values.length) {
        value = values.reduce(function (sum, item) { return sum + item; }, 0) / values.length;
      }
    }
    if (value === null) return 'pg-light';
    return value < .55 ? 'pg-dark' : 'pg-light';
  }

  function apply() {
    document.querySelectorAll('#prices .pack').forEach(function (card) {
      card.classList.remove('pg-dark', 'pg-light');
      card.classList.add(cardTone(card));
    });
  }

  apply();
  var attempts = 0;
  var timer = setInterval(function () {
    apply();
    if (++attempts >= 12) clearInterval(timer);
  }, 500);
  window.addEventListener('load', apply);
})();

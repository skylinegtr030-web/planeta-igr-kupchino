/* Grid layout, spacing and render safety net for the services block. */
(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '#extrasGrid.extras{columns:auto!important;column-gap:normal!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:34px 30px;align-items:stretch;margin-top:8px}',
    '#extrasGrid .extra-card{break-inside:auto!important;margin-bottom:0!important;display:flex;flex-direction:column;opacity:1!important;visibility:visible!important;transform:none;border-radius:20px;overflow:hidden}',
    '#extrasGrid .extra-card .ec-body{flex:1;padding:20px 22px 24px!important}',
    '#extrasGrid .extra-card h4{font-size:1.02rem;line-height:1.35;margin:0 0 10px!important}',
    '#extrasGrid .extra-card .extra-price{font-size:1.28rem;margin-top:0!important;margin-bottom:6px}',
    '#extrasGrid .extra-card .extra-hint{margin-top:0!important;line-height:1.5}',
    '#extras .section-inner{opacity:1!important;transform:none!important}',
    '#extras .extras-cta{margin-top:38px}',
    '@media(max-width:900px){#extrasGrid.extras{gap:28px 22px}}',
    '@media(max-width:520px){#extrasGrid.extras{grid-template-columns:1fr;gap:22px}}'
  ].join('');
  document.head.appendChild(style);

  var attempts = 0;

  function ensure() {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return false;
    grid.classList.remove('fade-up');
    if (!grid.children.length && typeof window.renderExtras === 'function') {
      try { window.renderExtras(); } catch (error) {}
    }
    if (!grid.children.length && typeof EXTRAS !== 'undefined') {
      Object.keys(EXTRAS).forEach(function (id) {
        var extra = EXTRAS[id];
        var card = document.createElement('div');
        card.className = 'extra-card';
        card.onclick = function () {
          if (typeof window.openExtraModal === 'function') window.openExtraModal(id);
        };
        var price = (extra.priceFrom ? 'от ' : '') + extra.price.toLocaleString('ru-RU') + ' ₽';
        var hint = [extra.duration ? extra.duration + ' мин' : '', extra.upto || ''].filter(Boolean).join(' · ');
        var body = document.createElement('div');
        body.className = 'ec-body';
        var title = document.createElement('h4');
        title.textContent = extra.name;
        var cost = document.createElement('div');
        cost.className = 'extra-price';
        cost.textContent = price;
        var meta = document.createElement('div');
        meta.className = 'extra-hint';
        meta.textContent = hint;
        body.appendChild(title);
        body.appendChild(cost);
        body.appendChild(meta);
        card.appendChild(body);
        grid.appendChild(card);
      });
    }
    return grid.children.length > 0;
  }

  function loop() {
    if (ensure() || attempts++ > 24) return;
    setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('load', function () { attempts = 0; loop(); });
})();

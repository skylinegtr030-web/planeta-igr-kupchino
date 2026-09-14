/* Grid layout and render safety net for the services block. */
(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '#extrasGrid.extras{columns:auto!important;column-gap:normal!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;align-items:stretch}',
    '#extrasGrid .extra-card{break-inside:auto!important;margin-bottom:0!important;display:flex;flex-direction:column;opacity:1!important;visibility:visible!important;transform:none}',
    '#extrasGrid .extra-card .ec-body{flex:1}',
    '#extras .section-inner{opacity:1!important;transform:none!important}',
    '@media(max-width:520px){#extrasGrid.extras{grid-template-columns:1fr}}'
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

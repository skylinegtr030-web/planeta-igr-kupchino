/* Time-card pricing tiers: 30 and 60 minutes. */
(function () {
  'use strict';

  var TIERS = [
    { label: '30 минут', price: 1290 },
    { label: '60 минут', price: 2190 }
  ];

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function patchCatalog() {
    if (typeof EXTRAS === 'undefined' || !EXTRAS.timeCards) return false;
    var card = EXTRAS.timeCards;
    card.name = 'Тайм-карты на автоматы';
    card.price = TIERS[0].price;
    card.priceFrom = true;
    card.duration = 30;
    card.desc = 'Тайм-карта на игровые автоматы. Два варианта на выбор: 30 или 60 минут.';
    card.tiers = TIERS;
    return true;
  }

  function renderTiers(body) {
    var rows = body.querySelectorAll('.tier-row');
    var anchor = rows.length ? rows[0] : null;
    Array.prototype.forEach.call(rows, function (row) { row.remove(); });
    var box = document.createElement('div');
    box.className = 'pg-tier-box';
    TIERS.forEach(function (tier) {
      var row = document.createElement('div');
      row.className = 'tier-row';
      var name = document.createElement('span');
      name.textContent = tier.label;
      var price = document.createElement('span');
      price.className = 'tier-price';
      price.textContent = money(tier.price);
      row.appendChild(name);
      row.appendChild(price);
      box.appendChild(row);
    });
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(box, anchor.nextSibling);
    } else {
      var paragraph = body.querySelector('p');
      if (paragraph && paragraph.parentNode) {
        paragraph.parentNode.insertBefore(box, paragraph.nextSibling);
      } else {
        body.insertBefore(box, body.firstChild);
      }
    }
  }

  function wrapModal() {
    if (typeof window.openExtraModal !== 'function' || window.openExtraModal.pgTiered) return false;
    var original = window.openExtraModal;
    var wrapped = function (id) {
      original(id);
      if (id !== 'timeCards') return;
      var body = document.getElementById('extraModalBody');
      if (body) renderTiers(body);
    };
    wrapped.pgTiered = true;
    window.openExtraModal = wrapped;
    return true;
  }

  function refreshGrid() {
    if (typeof window.renderExtras === 'function') {
      try { window.renderExtras(); } catch (error) {}
    }
    if (typeof window.renderOrderOptions === 'function') {
      try { window.renderOrderOptions(); } catch (error) {}
    }
    if (typeof window.recalc === 'function') {
      try { window.recalc(); } catch (error) {}
    }
  }

  var style = document.createElement('style');
  style.textContent = '.pg-tier-box{margin:10px 0 4px}.pg-tier-box .tier-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px dashed #e4e7f0;font-weight:800;font-size:.92rem}.pg-tier-box .tier-row:last-child{border-bottom:none}.pg-tier-box .tier-price{color:#e2231a;font-weight:900;white-space:nowrap}';
  document.head.appendChild(style);

  var attempts = 0;
  var patched = false;
  var wrappedOnce = false;

  function loop() {
    if (!patched && patchCatalog()) {
      patched = true;
      refreshGrid();
    }
    if (!wrappedOnce && wrapModal()) wrappedOnce = true;
    if ((patched && wrappedOnce) || attempts++ > 30) return;
    setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('load', function () {
    attempts = 0;
    patched = false;
    wrappedOnce = window.openExtraModal && window.openExtraModal.pgTiered ? true : false;
    loop();
  });
})();

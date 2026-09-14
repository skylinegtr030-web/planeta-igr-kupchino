/* Time-card tiers: pick 30 or 60 minutes straight from the card. */
(function () {
  'use strict';

  var NOTE = 'Между играми нужно выждать 50 секунд.';
  var HIDDEN_NAME = 'Тайм-карта 60 минут';
  var TIERS = [
    { id: 'timeCards', label: '30 минут', price: 1290 },
    { id: 'timeCards60', label: '60 минут', price: 2190 }
  ];

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function patchCatalog() {
    if (typeof EXTRAS === 'undefined' || !EXTRAS.timeCards) return false;
    EXTRAS.timeCards.name = 'Тайм-карты на автоматы';
    EXTRAS.timeCards.price = 1290;
    EXTRAS.timeCards.priceFrom = true;
    EXTRAS.timeCards.duration = 30;
    EXTRAS.timeCards.desc = 'Тайм-карта на игровые автоматы: 30 или 60 минут. ' + NOTE;
    if (!EXTRAS.timeCards60) {
      EXTRAS.timeCards60 = {
        name: HIDDEN_NAME,
        price: 2190,
        duration: 60,
        emoji: '⏳',
        c1: '#7b2fd6',
        c2: '#ffc72c',
        desc: 'Тайм-карта на игровые автоматы на 60 минут. ' + NOTE
      };
    }
    return true;
  }

  function hideVariantCard() {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.extra-card'), function (card) {
      var title = card.querySelector('h4');
      if (title && title.textContent.trim() === HIDDEN_NAME) card.style.display = 'none';
    });
  }

  function renderPicker(body) {
    Array.prototype.forEach.call(body.querySelectorAll('.tier-row'), function (row) { row.remove(); });
    var oldButton = body.querySelector('a.btn');
    if (oldButton) oldButton.remove();

    var box = document.createElement('div');
    box.className = 'pg-tier-box';
    TIERS.forEach(function (tier) {
      var row = document.createElement('div');
      row.className = 'pg-tier';
      var text = document.createElement('div');
      text.className = 'pg-tier-text';
      var label = document.createElement('strong');
      label.textContent = tier.label;
      var price = document.createElement('span');
      price.textContent = money(tier.price);
      text.appendChild(label);
      text.appendChild(price);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pg-tier-btn';
      button.textContent = 'Выбрать';
      button.onclick = function () {
        if (typeof window.closeExtraModal === 'function') window.closeExtraModal();
        if (typeof window.openOrder === 'function') window.openOrder(null, null, tier.id);
      };
      row.appendChild(text);
      row.appendChild(button);
      box.appendChild(row);
    });

    var note = document.createElement('p');
    note.className = 'pg-tier-note';
    note.textContent = NOTE;
    box.appendChild(note);

    var paragraph = body.querySelector('p');
    if (paragraph) paragraph.textContent = 'Тайм-карта на игровые автоматы. Выберите подходящий вариант:';
    if (paragraph && paragraph.parentNode) {
      paragraph.parentNode.insertBefore(box, paragraph.nextSibling);
    } else {
      body.appendChild(box);
    }
  }

  function wrapModal() {
    if (typeof window.openExtraModal !== 'function' || window.openExtraModal.pgTiered) return false;
    var original = window.openExtraModal;
    var wrapped = function (id) {
      original(id);
      if (id !== 'timeCards') return;
      var body = document.getElementById('extraModalBody');
      if (body) renderPicker(body);
    };
    wrapped.pgTiered = true;
    window.openExtraModal = wrapped;
    return true;
  }

  function refreshAll() {
    if (typeof window.renderExtras === 'function') {
      try { window.renderExtras(); } catch (error) {}
    }
    if (typeof window.renderOrderOptions === 'function') {
      try { window.renderOrderOptions(); } catch (error) {}
    }
    if (typeof window.recalc === 'function') {
      try { window.recalc(); } catch (error) {}
    }
    hideVariantCard();
  }

  var style = document.createElement('style');
  style.textContent = '.pg-tier-box{margin:12px 0 4px}.pg-tier{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;margin-bottom:10px;border:2px solid #eef0f6;border-radius:14px;transition:border-color .2s,box-shadow .2s}.pg-tier:hover{border-color:#1f5fd6;box-shadow:0 10px 22px rgba(17,26,59,.1)}.pg-tier-text strong{display:block;font-size:1rem;color:#111a3b}.pg-tier-text span{font-size:1.12rem;font-weight:900;color:#e2231a}.pg-tier-btn{border:0;border-radius:999px;padding:11px 20px;background:#e2231a;color:#fff;font:900 .88rem inherit;cursor:pointer;white-space:nowrap;transition:transform .2s}.pg-tier-btn:hover{transform:translateY(-2px)}.pg-tier-note{margin:8px 0 0!important;font-size:.82rem;font-weight:800;color:#8a93ab}';
  document.head.appendChild(style);

  var attempts = 0;
  var patched = false;
  var wrappedOnce = false;

  function loop() {
    if (!patched && patchCatalog()) {
      patched = true;
      refreshAll();
    }
    if (!wrappedOnce && wrapModal()) wrappedOnce = true;
    hideVariantCard();
    if ((patched && wrappedOnce && attempts > 6) || attempts++ > 30) return;
    setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('load', function () {
    attempts = 0;
    patched = false;
    wrappedOnce = !!(window.openExtraModal && window.openExtraModal.pgTiered);
    loop();
  });
})();

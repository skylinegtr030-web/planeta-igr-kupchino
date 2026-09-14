/* Time-card tiers: artwork plus 30/60 minute picker inside the service modal. */
(function () {
  'use strict';

  var NOTE = 'Между играми нужно выждать 50 секунд.';
  var MAIN_NAME = 'Тайм-карты на автоматы';
  var HIDDEN_NAME = 'Тайм-карта 60 минут';
  var ART = 'time-cards.svg?v=1';
  var TIERS = [
    { id: 'timeCards', label: '30 минут', price: 1290 },
    { id: 'timeCards60', label: '60 минут', price: 2190 }
  ];

  var style = document.createElement('style');
  style.textContent = '.pg-tier-box{margin:14px 0 4px}.pg-tier{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;margin-bottom:10px;border:2px solid #eef0f6;border-radius:14px;transition:border-color .2s,box-shadow .2s}.pg-tier:hover{border-color:#1f5fd6;box-shadow:0 10px 22px rgba(17,26,59,.1)}.pg-tier-text strong{display:block;font-size:1rem;color:#111a3b}.pg-tier-text span{font-size:1.14rem;font-weight:900;color:#e2231a}.pg-tier-btn{border:0;border-radius:999px;padding:12px 22px;background:#e2231a;color:#fff;font:900 .9rem inherit;cursor:pointer;white-space:nowrap;transition:transform .2s}.pg-tier-btn:hover{transform:translateY(-2px)}.pg-tier-note{margin:10px 0 0!important;font-size:.82rem;font-weight:800;color:#8a93ab}.pg-art{width:100%;height:100%;object-fit:cover;display:block}';
  document.head.appendChild(style);

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function patchCatalog() {
    if (typeof EXTRAS === 'undefined' || !EXTRAS.timeCards) return false;
    EXTRAS.timeCards.name = MAIN_NAME;
    EXTRAS.timeCards.price = 1290;
    EXTRAS.timeCards.priceFrom = true;
    EXTRAS.timeCards.duration = 30;
    EXTRAS.timeCards.photo = ART;
    EXTRAS.timeCards.desc = 'Тайм-карта на игровые автоматы. Выберите подходящий вариант:';
    if (!EXTRAS.timeCards60) {
      EXTRAS.timeCards60 = {
        name: HIDDEN_NAME,
        price: 2190,
        duration: 60,
        emoji: '⏳',
        c1: '#7b2fd6',
        c2: '#ffc72c',
        photo: ART,
        desc: 'Тайм-карта на игровые автоматы на 60 минут. ' + NOTE
      };
    }
    return true;
  }

  function fixGridCard() {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.extra-card'), function (card) {
      var title = card.querySelector('h4');
      if (!title) return;
      var name = title.textContent.trim();
      if (name === HIDDEN_NAME) {
        card.style.display = 'none';
        return;
      }
      if (name !== MAIN_NAME || card.dataset.pgArt) return;
      var cover = card.querySelector('.ec-cover');
      if (!cover) return;
      card.dataset.pgArt = '1';
      cover.innerHTML = '<img class="pg-art" src="' + ART + '" alt="Тайм-карты на игровые автоматы" loading="lazy" decoding="async">';
    });
  }

  function injectPicker() {
    var titleNode = document.getElementById('extraModalTitle');
    var body = document.getElementById('extraModalBody');
    var media = document.getElementById('extraModalMedia');
    if (!titleNode || !body) return;
    if (titleNode.textContent.trim() !== MAIN_NAME) return;

    if (media && !media.querySelector('.pg-art')) {
      media.innerHTML = '<img class="pg-art" src="' + ART + '" alt="Тайм-карты на игровые автоматы" decoding="async">';
    }
    if (body.querySelector('.pg-tier-box')) return;

    Array.prototype.forEach.call(body.querySelectorAll('.tier-row'), function (row) { row.remove(); });

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
      button.textContent = 'Добавить в заявку';
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
    if (paragraph) {
      paragraph.textContent = 'Тайм-карта на игровые автоматы. Выберите подходящий вариант:';
      paragraph.parentNode.insertBefore(box, paragraph.nextSibling);
    } else {
      body.insertBefore(box, body.firstChild);
    }

    var generic = body.querySelector('a.btn');
    if (generic) generic.remove();
  }

  function watchModal() {
    var modal = document.getElementById('extraModal');
    if (!modal || modal.dataset.pgTierWatch) return;
    modal.dataset.pgTierWatch = '1';
    var observer = new MutationObserver(function () {
      if (modal.classList.contains('active')) setTimeout(injectPicker, 0);
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    if (modal.classList.contains('active')) injectPicker();
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
    fixGridCard();
  }

  var attempts = 0;
  function loop() {
    if (patchCatalog()) refreshAll();
    watchModal();
    fixGridCard();
    if (attempts++ < 40) setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('load', function () {
    attempts = 0;
    loop();
  });
})();

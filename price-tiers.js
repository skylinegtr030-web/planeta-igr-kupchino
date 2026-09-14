/* Tiered services: time cards and the unlimited entry ticket. */
(function () {
  'use strict';

  var ART = 'time-cards.svg?v=1';
  var DEFAULT_TIERS = {
    timeCards30: 1290,
    timeCards60: 2190,
    unlimitedWeekday: 1500,
    unlimitedWeekend: 1800
  };

  function tierValues() {
    var content = window.PG_CONTENT;
    var source = (content && content.tiers) || {};
    return {
      timeCards30: source.timeCards30 || DEFAULT_TIERS.timeCards30,
      timeCards60: source.timeCards60 || DEFAULT_TIERS.timeCards60,
      unlimitedWeekday: source.unlimitedWeekday || DEFAULT_TIERS.unlimitedWeekday,
      unlimitedWeekend: source.unlimitedWeekend || DEFAULT_TIERS.unlimitedWeekend
    };
  }

  function makeGroups() {
    var t = tierValues();
    return [
      {
        key: 'timeCards',
        name: 'Тайм-карты на автоматы',
        intro: 'Тайм-карта на игровые автоматы. Выберите подходящий вариант:',
        note: 'Между играми нужно выждать 50 секунд.',
        photo: ART,
        duration: 30,
        hiddenName: 'Тайм-карта 60 минут',
        variant: {
          id: 'timeCards60',
          name: 'Тайм-карта 60 минут',
          price: t.timeCards60,
          duration: 60,
          emoji: '⏳',
          c1: '#7b2fd6',
          c2: '#ffc72c',
          photo: ART,
          desc: 'Тайм-карта на игровые автоматы на 60 минут.'
        },
        tiers: [
          { id: 'timeCards', label: '30 минут', price: t.timeCards30 },
          { id: 'timeCards60', label: '60 минут', price: t.timeCards60 }
        ]
      },
      {
        key: 'unlimitedTicket',
        name: 'Входной билет «Безлимит»',
        intro: 'Безлимитный вход в игровую зону на весь день. Выберите день посещения:',
        note: 'Цена за одного ребёнка.',
        duration: 0,
        hiddenName: 'Безлимит в выходные',
        variant: {
          id: 'unlimitedTicketWeekend',
          name: 'Безлимит в выходные',
          price: t.unlimitedWeekend,
          duration: 0,
          emoji: '🎫',
          c1: '#1f5fd6',
          c2: '#28a745',
          desc: 'Безлимитный входной билет в выходные и праздничные дни.'
        },
        tiers: [
          { id: 'unlimitedTicket', label: 'Будни', price: t.unlimitedWeekday },
          { id: 'unlimitedTicketWeekend', label: 'Выходные', price: t.unlimitedWeekend }
        ]
      }
    ];
  }

  var GROUPS = makeGroups();

  var style = document.createElement('style');
  style.textContent = '.pg-tier-box{margin:14px 0 4px}.pg-tier{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;margin-bottom:10px;border:2px solid #eef0f6;border-radius:14px;transition:border-color .2s,box-shadow .2s}.pg-tier:hover{border-color:#1f5fd6;box-shadow:0 10px 22px rgba(17,26,59,.1)}.pg-tier-text strong{display:block;font-size:1rem;color:#111a3b}.pg-tier-text span{font-size:1.14rem;font-weight:900;color:#e2231a}.pg-tier-btn{border:0;border-radius:999px;padding:12px 22px;background:#e2231a;color:#fff;font:900 .9rem inherit;cursor:pointer;white-space:nowrap;transition:transform .2s}.pg-tier-btn:hover{transform:translateY(-2px)}.pg-tier-note{margin:10px 0 0!important;font-size:.82rem;font-weight:800;color:#8a93ab}.pg-art{width:100%;height:100%;object-fit:cover;display:block}';
  document.head.appendChild(style);

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function patchCatalog() {
    if (typeof EXTRAS === 'undefined') return false;
    var done = false;
    GROUPS.forEach(function (group) {
      var base = EXTRAS[group.key];
      if (!base) return;
      base.name = group.name;
      base.price = group.tiers[0].price;
      base.priceFrom = true;
      base.duration = group.duration;
      base.desc = group.intro;
      if (group.photo) base.photo = group.photo;
      if (group.variant) {
        EXTRAS[group.variant.id] = EXTRAS[group.variant.id] || {};
        var slot = EXTRAS[group.variant.id];
        slot.name = group.variant.name;
        slot.price = group.variant.price;
        slot.duration = group.variant.duration;
        slot.emoji = group.variant.emoji;
        slot.c1 = group.variant.c1;
        slot.c2 = group.variant.c2;
        slot.desc = group.variant.desc + (group.note ? ' ' + group.note : '');
        if (group.variant.photo) slot.photo = group.variant.photo;
      }
      done = true;
    });
    return done;
  }

  function groupByName(name) {
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].name === name) return GROUPS[i];
    }
    return null;
  }

  function fixGridCards() {
    var grid = document.getElementById('extrasGrid');
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.extra-card'), function (card) {
      var title = card.querySelector('h4');
      if (!title) return;
      var name = title.textContent.trim();
      var hidden = GROUPS.some(function (group) { return group.hiddenName === name; });
      if (hidden) {
        card.style.display = 'none';
        return;
      }
      var group = groupByName(name);
      if (!group || !group.photo || card.dataset.pgArt) return;
      var cover = card.querySelector('.ec-cover');
      if (!cover) return;
      card.dataset.pgArt = '1';
      cover.innerHTML = '<img class="pg-art" src="' + group.photo + '" alt="' + group.name + '" loading="lazy" decoding="async">';
    });
  }

  function injectPicker() {
    var titleNode = document.getElementById('extraModalTitle');
    var body = document.getElementById('extraModalBody');
    var media = document.getElementById('extraModalMedia');
    if (!titleNode || !body) return;
    var group = groupByName(titleNode.textContent.trim());
    if (!group) return;

    if (group.photo && media && !media.querySelector('.pg-art')) {
      media.innerHTML = '<img class="pg-art" src="' + group.photo + '" alt="' + group.name + '" decoding="async">';
    }
    if (body.querySelector('.pg-tier-box')) return;

    Array.prototype.forEach.call(body.querySelectorAll('.tier-row'), function (row) { row.remove(); });

    var box = document.createElement('div');
    box.className = 'pg-tier-box';
    group.tiers.forEach(function (tier) {
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

    if (group.note) {
      var note = document.createElement('p');
      note.className = 'pg-tier-note';
      note.textContent = group.note;
      box.appendChild(note);
    }

    var paragraph = body.querySelector('p');
    if (paragraph) {
      paragraph.textContent = group.intro;
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
    ['renderExtras', 'renderOrderOptions', 'recalc'].forEach(function (fn) {
      if (typeof window[fn] === 'function') {
        try { window[fn](); } catch (error) {}
      }
    });
    fixGridCards();
  }

  var attempts = 0;
  function loop() {
    if (patchCatalog()) refreshAll();
    watchModal();
    fixGridCards();
    if (attempts++ < 40) setTimeout(loop, 400);
  }

  loop();
  window.addEventListener('pg:content', function () {
    GROUPS = makeGroups();
    if (patchCatalog()) refreshAll();
  });
  window.addEventListener('load', function () {
    attempts = 0;
    loop();
  });
})();

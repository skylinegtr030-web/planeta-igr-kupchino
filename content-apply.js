/* Loads content.json and pushes prices into the live catalog.
   Supports pack objects {weekday, weekend} and picks the right price by eventDate. */
(function () {
  'use strict';

  var TIER_MAP = {
    timeCards: 'timeCards30',
    timeCards60: 'timeCards60',
    unlimitedTicket: 'unlimitedWeekday',
    unlimitedTicketWeekend: 'unlimitedWeekend'
  };

  function isWeekend() {
    var input = document.getElementById('eventDate');
    if (!input || !input.value) return false;
    var day = new Date(input.value + 'T12:00:00').getDay();
    return day === 0 || day === 6;
  }

  function refresh() {
    ['renderExtras', 'renderOrderOptions', 'recalc'].forEach(function (fn) {
      if (typeof window[fn] === 'function') {
        try { window[fn](); } catch (error) {}
      }
    });
  }

  function patch() {
    var content = window.PG_CONTENT;
    if (!content) return false;
    var touched = false;
    var weekend = isWeekend();

    if (typeof PACKS !== 'undefined' && content.packs) {
      Object.keys(content.packs).forEach(function (id) {
        if (!PACKS[id]) return;
        var value = content.packs[id];
        if (value && typeof value === 'object') {
          PACKS[id].weekday = value.weekday;
          PACKS[id].weekend = value.weekend;
          PACKS[id].price = weekend ? value.weekend : value.weekday;
        } else {
          PACKS[id].price = value;
          PACKS[id].weekday = value;
          PACKS[id].weekend = value;
        }
        touched = true;
      });
    }

    if (typeof EXTRAS !== 'undefined') {
      if (content.extras) {
        Object.keys(content.extras).forEach(function (id) {
          if (EXTRAS[id]) { EXTRAS[id].price = content.extras[id]; touched = true; }
        });
      }
      var tiers = content.tiers || {};
      Object.keys(TIER_MAP).forEach(function (id) {
        var value = tiers[TIER_MAP[id]];
        if (EXTRAS[id] && value) { EXTRAS[id].price = value; touched = true; }
      });
    }

    if (touched) refresh();
    return touched;
  }

  function announce() {
    [0, 700, 1800, 3500].forEach(function (delay) {
      setTimeout(function () {
        patch();
        window.dispatchEvent(new CustomEvent('pg:content', { detail: window.PG_CONTENT }));
      }, delay);
    });
  }

  var date = document.getElementById('eventDate');
  if (date) date.addEventListener('change', patch);

  fetch('content.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) {
      if (!data) return;
      window.PG_CONTENT = data;
      announce();
    })
    .catch(function () {});
})();

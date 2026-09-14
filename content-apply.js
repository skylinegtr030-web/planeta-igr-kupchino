/* Loads content.json and pushes prices into the live catalog. */
(function () {
  'use strict';

  var TIER_MAP = {
    timeCards: 'timeCards30',
    timeCards60: 'timeCards60',
    unlimitedTicket: 'unlimitedWeekday',
    unlimitedTicketWeekend: 'unlimitedWeekend'
  };

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

    if (typeof PACKS !== 'undefined' && content.packs) {
      Object.keys(content.packs).forEach(function (id) {
        if (PACKS[id]) { PACKS[id].price = content.packs[id]; touched = true; }
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

  fetch('content.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) {
      if (!data) return;
      window.PG_CONTENT = data;
      announce();
    })
    .catch(function () {});
})();

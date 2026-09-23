/* Planeta Igr — цены и услуги из /api/catalog. Без API остаются встроенные значения. */
(function () {
  'use strict';
  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(v); return isFinite(n) ? n : null;
  }
  function pic(it) {
    if (!it) return null;
    var c = it.cover, p = typeof c === 'string' ? c : (c && (c.path || c.url));
    if (!p && it.gallery && it.gallery[0]) p = it.gallery[0].path;
    return p ? '/' + String(p).replace(/^\//, '') : null;
  }
  function weekend() {
    var f = document.getElementById('orderForm');
    var v = f && f.eventDate && f.eventDate.value;
    if (!v) return false;
    var d = new Date(v + 'T12:00:00').getDay();
    return d === 0 || d === 6;
  }
  function extra(it, par) {
    var p = par || {}, wd = num(it.price_weekday), we = num(it.price_weekend);
    var e = { name: par ? p.title + ' — ' + it.title : it.title,
      priceWeekday: wd || 0, priceWeekend: we || wd || 0, priceFrom: !!it.price_from,
      duration: it.duration_min || 0, emoji: it.emoji || p.emoji || '🎉',
      c1: it.color1 || p.color1 || '#28a745', c2: it.color2 || p.color2 || '#8fe3a6',
      photo: pic(it) || pic(par), desc: it.description || it.short_desc || p.description || '',
      qty: it.qty_mode === 'quantity', maxQty: it.max_qty || 1 };
    if (it.capacity) e.upto = it.capacity;
    e.price = e.priceWeekday;
    return e;
  }
  function build(c) {
    var cats = {}, packs = {}, rooms = {}, extras = {};
    (c.categories || []).forEach(function (k) { cats[k.slug] = k.items || []; });
    (cats.packs || []).forEach(function (it) {
      var wd = num(it.price_weekday);
      packs[it.slug] = { weekday: wd, weekend: num(it.price_weekend) || wd };
    });
    (cats.rooms || []).forEach(function (it) {
      var a = it.attrs || {}, pr = num(it.price_weekday), ex = num(a.extendPerHour);
      if (it.slug === 'duo-room') { rooms.duoBase = pr; rooms.duoExtend = ex; }
      else if (rooms.roomBase == null) { rooms.roomBase = pr; rooms.roomExtend = ex; }
    });
    ['services', 'addons', 'activities', 'tickets'].forEach(function (s) {
      (cats[s] || []).forEach(function (it) {
        if (it.bookable === false) return;
        var vs = it.variants || [];
        var priced = vs.filter(function (v) { return num(v.price_weekday) != null && v.bookable !== false; });
        var wdv = priced.filter(function (v) { return v.day_type === 'weekday'; })[0];
        var wev = priced.filter(function (v) { return v.day_type === 'weekend'; })[0];
        if (wdv && wev && priced.length === 2) {
          var t = extra(wdv, it); t.name = it.title;
          t.priceWeekend = num(wev.price_weekday) || t.priceWeekday;
          extras[wdv.slug] = t; return;
        }
        if (priced.length) {
          priced.forEach(function (v) { extras[v.slug] = extra(v, it); });
          return;
        }
        var e = extra(it);
        if (vs.length) e.options = vs.map(function (v) {
          return { name: v.title, meta: v.short_desc || '' };
        });
        extras[it.slug] = e;
      });
    });
    return { packs: packs, rooms: rooms, extras: extras, catalog: c };
  }
  function applyDay() {
    if (typeof EXTRAS === 'undefined') return;
    var w = weekend();
    Object.keys(EXTRAS).forEach(function (id) {
      var e = EXTRAS[id];
      if (e && e.priceWeekday != null) e.price = w ? e.priceWeekend : e.priceWeekday;
    });
  }
  function apply(pg) {
    if (typeof EXTRAS !== 'undefined') {
      Object.keys(EXTRAS).forEach(function (k) { delete EXTRAS[k]; });
      Object.assign(EXTRAS, pg.extras);
    }
    if (typeof QTY_EXTRAS !== 'undefined' && Array.isArray(QTY_EXTRAS)) {
      QTY_EXTRAS.length = 0;
      Object.keys(pg.extras).forEach(function (k) { if (pg.extras[k].qty) QTY_EXTRAS.push(k); });
    }
    window.PG_CONTENT = pg;
    applyDay();
    if (typeof renderOrderOptions === 'function') renderOrderOptions();
    window.dispatchEvent(new CustomEvent('pg:content', { detail: pg }));
    if (typeof window.recalc === 'function') window.recalc();
  }
  var ready = new Promise(function (r) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r);
    else r();
  });
  var data = fetch('/api/catalog', { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw Error('HTTP ' + r.status);
    return r.json();
  });
  Promise.all([data, ready]).then(function (x) {
    if (!x[0] || !x[0].ok) throw Error('bad catalog');
    apply(build(x[0]));
    var f = document.getElementById('orderForm');
    if (f && f.eventDate) f.eventDate.addEventListener('change', function () {
      applyDay();
      if (typeof window.recalc === 'function') window.recalc();
    });
  }).catch(function (e) { console.warn('catalog: остаются встроенные цены', e); });
})();

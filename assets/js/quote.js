(function () {
  'use strict';
  var form = document.getElementById('orderForm');
  if (!form || typeof window.recalc !== 'function') return;
  function selection() {
    var extras = [];
    form.querySelectorAll('input[name="extra"]:checked').forEach(function (c) { extras.push({ slug: c.value, qty: 1 }); });
    form.querySelectorAll('[data-extra-qty]').forEach(function (r) {
      var n = parseInt(r.dataset.count || '0', 10);
      if (n > 0) extras.push({ slug: r.dataset.extraQty, qty: n });
    });
    var pack = form.querySelector('input[name="pack"]:checked');
    var room = form.querySelector('input[name="room"]:checked');
    return { pack: pack ? pack.value : '', room: room ? room.value : '', extras: extras };
  }
  window.pgSelection = selection;
  var base = window.recalc, timer = null, seq = 0;
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU') + ' \u20bd'; }
  window.recalc = function () {
    var res = base.apply(this, arguments);
    clearTimeout(timer);
    timer = setTimeout(function () {
      var sel = selection();
      if (!sel.pack && !sel.room && !sel.extras.length) return;
      sel.date = form.eventDate ? form.eventDate.value : '';
      sel.promo = form.promo ? form.promo.value : '';
      var my = ++seq;
      fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sel) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (q) {
          if (!q || !q.ok || my !== seq) return;
          var text = fmt(q.total) + (q.discount ? ' (скидка ' + fmt(q.discount) + ')' : '');
          var el = document.getElementById('sumPrice'), h = document.getElementById('hPriceText');
          if (el) el.textContent = text;
          if (h) h.value = text;
        }).catch(function () {});
    }, 250);
    return res;
  };
  window.recalc();
})();

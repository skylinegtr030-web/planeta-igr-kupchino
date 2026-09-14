/* Contacts (address, phone, hours) driven by content.json. */
(function () {
  'use strict';

  var DEFAULTS = {
    addressShort: 'Балканская пл., 17',
    addressFull: 'Балканская площадь, 17',
    phone: '+7 981 818-01-34',
    hours: '10:00–22:00'
  };

  function contacts() {
    var source = (window.PG_CONTENT && window.PG_CONTENT.contacts) || {};
    return {
      addressShort: source.addressShort || DEFAULTS.addressShort,
      addressFull: source.addressFull || DEFAULTS.addressFull,
      phone: source.phone || DEFAULTS.phone,
      hours: source.hours || DEFAULTS.hours
    };
  }

  function rules() {
    var c = contacts();
    return [
      { from: /Балканская\s+пл\.,\s*д?\.?\s*\d+[а-яА-Я]?/g, to: c.addressShort },
      { from: /Балканская\s+площадь,\s*(д\.\s*)?\d+[а-яА-Я]?(,\s*литера\s*Ю)?/g, to: c.addressFull },
      { from: /ул\.\s*Балканская,\s*д\.\s*\d+[а-яА-Я]?/g, to: c.addressFull },
      { from: /\+?7[\s(]*9\d{2}[\s)]*\d{3}[-\s]?\d{2}[-\s]?\d{2}/g, to: c.phone },
      { from: /\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/g, to: c.hours }
    ];
  }

  function applyRules(text, list) {
    var updated = text;
    list.forEach(function (rule) {
      updated = updated.replace(rule.from, rule.to);
    });
    return updated;
  }

  function walkText(list) {
    if (!document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || !/Балканск|\d{1,2}:\d{2}|\d{3}-\d{2}-\d{2}/.test(value)) continue;
      var parent = node.parentNode;
      if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) continue;
      var updated = applyRules(value, list);
      if (updated !== value) node.nodeValue = updated;
    }
  }

  function fixMeta(list) {
    ['meta[name="description"]', 'meta[property="og:description"]'].forEach(function (selector) {
      var meta = document.querySelector(selector);
      if (!meta || !meta.content) return;
      meta.content = applyRules(meta.content, list);
    });

    var c = contacts();
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        var data = JSON.parse(ld.textContent);
        if (data.address) data.address.streetAddress = c.addressFull + ', ТРК «Балкания Nova»';
        data.telephone = c.phone.replace(/[^\d+]/g, '');
        var hours = c.hours.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/);
        if (hours) data.openingHours = 'Mo-Su ' + hours[1] + '-' + hours[2];
        ld.textContent = JSON.stringify(data);
      } catch (error) {}
    }
  }

  function fixLinks() {
    var c = contacts();
    var digits = c.phone.replace(/[^\d]/g, '');
    if (digits.length >= 11) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (link) {
        link.href = 'tel:+' + digits;
      });
    }
  }

  function fixMap() {
    var frame = document.querySelector('iframe.map-frame');
    if (!frame) return;
    var c = contacts();
    var target = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Санкт-Петербург, ' + c.addressFull) + '&z=17';
    if (frame.dataset.pgMap === target) return;
    frame.dataset.pgMap = target;
    frame.src = target;
    frame.title = 'Карта: ' + c.addressFull;
  }

  function removeRoute() {
    var block = document.getElementById('routeBlock');
    if (block) block.remove();
  }

  function apply() {
    var list = rules();
    removeRoute();
    walkText(list);
    fixMeta(list);
    fixLinks();
    fixMap();
  }

  apply();
  var attempts = 0;
  var timer = setInterval(function () {
    apply();
    if (++attempts >= 20) clearInterval(timer);
  }, 500);
  window.addEventListener('pg:content', apply);
  window.addEventListener('load', apply);
})();

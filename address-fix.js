/* Single source of truth for the venue address. */
(function () {
  'use strict';

  var SHORT = 'Балканская пл., 17';
  var FULL = 'Балканская площадь, 17';
  var MAP = 'https://yandex.ru/map-widget/v1/?text=Санкт-Петербург%2C%20Балканская%20площадь%2C%2017&z=17';

  var PATTERNS = [
    { from: /Балканская\s+пл\.,\s*5[а-яА-Я]?/g, to: SHORT },
    { from: /Балканская\s+площадь,\s*(д\.\s*)?5[а-яА-Я]?(,\s*литера\s*Ю)?/g, to: FULL },
    { from: /ул\.\s*Балканская,\s*д\.\s*5[а-яА-Я]?/g, to: 'ул. Балканская, д. 17' }
  ];

  function walkText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || value.indexOf('Балканск') === -1) continue;
      var updated = value;
      PATTERNS.forEach(function (rule) {
        updated = updated.replace(rule.from, rule.to);
      });
      if (updated !== value) node.nodeValue = updated;
    }
  }

  function fixMeta() {
    ['meta[name="description"]', 'meta[property="og:description"]'].forEach(function (selector) {
      var meta = document.querySelector(selector);
      if (!meta || !meta.content) return;
      var updated = meta.content;
      PATTERNS.forEach(function (rule) { updated = updated.replace(rule.from, rule.to); });
      meta.content = updated;
    });

    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld && ld.textContent.indexOf('Балканск') !== -1) {
      try {
        var data = JSON.parse(ld.textContent);
        if (data.address) data.address.streetAddress = 'Балканская площадь, 17, ТРК «Балкания Nova»';
        ld.textContent = JSON.stringify(data);
      } catch (error) {}
    }
  }

  function fixMap() {
    var frame = document.querySelector('iframe.map-frame');
    if (!frame) return;
    if (frame.dataset.pgAddress) return;
    frame.dataset.pgAddress = '1';
    frame.src = MAP;
    frame.title = 'Карта: Балканская площадь, 17';
  }

  function removeRoute() {
    var block = document.getElementById('routeBlock');
    if (block) block.remove();
  }

  function apply() {
    removeRoute();
    walkText(document.body);
    fixMeta();
    fixMap();
  }

  apply();
  var attempts = 0;
  var timer = setInterval(function () {
    apply();
    if (++attempts >= 20) clearInterval(timer);
  }, 500);
  window.addEventListener('load', apply);
})();

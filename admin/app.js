/* Планета Игр — админ-панель. Заявки, статистика и контент. */
(function () {
  'use strict';

  var OWNER = 'skylinegtr030-web';
  var REPO = 'planeta-igr-kupchino';
  var BRANCH = 'main';
  var FILE = 'content.json';
  var KEY = 'pg-admin-token';

  var TIERS = [
    ['timeCards30', 'Тайм-карта 30 минут'],
    ['timeCards60', 'Тайм-карта 60 минут'],
    ['unlimitedWeekday', 'Безлимит, будни'],
    ['unlimitedWeekend', 'Безлимит, выходные']
  ];
  var ROOMS_LIST = [
    ['extendOne', 'Продление одной комнаты, час'],
    ['extendTwo', 'Продление двух комнат, час']
  ];
  var PACKS_LIST = [
    ['malysh', 'Пакет «Малыш JO»'],
    ['jungle', 'Пакет «Гости в джунглях»'],
    ['king', 'Пакет «Король саванны»'],
    ['cyber', 'Пакет «Кибер Пати»']
  ];
  var EXTRAS_LIST = [
    ['animator', 'Анимационная программа'],
    ['quest', 'Квест'],
    ['masterclass', 'Мастер-класс'],
    ['sciShow', 'Научное / Тесла / Жонглёр-шоу'],
    ['bubbles', 'Мыльные пузыри / Крио-шоу'],
    ['pinata', 'Пиньята'],
    ['qzar', 'Лазертаг Q-ZAR'],
    ['lavaFloor', 'Лава-пол (30 минут)'],
    ['invite', 'Именное пригласительное'],
    ['tables', 'Аренда столика (час)'],
    ['balloonFountain', 'Фонтан из 10 шаров'],
    ['surpriseBalloon', 'Шар-сюрприз'],
    ['serving', 'Доп. сервировка (гость)']
  ];

  var state = { data: null, sha: null, orders: [] };
  var el = function (id) { return document.getElementById(id); };
  function setStatus(node, message, ok) {
    node.textContent = message;
    node.className = 'status ' + (ok === undefined ? '' : (ok ? 'ok' : 'err'));
  }
  function token() { return el('token').value.trim(); }

  function ghApi(path, options) {
    options = options || {};
    var headers = {
      Authorization: 'Bearer ' + token(),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (options.body) headers['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (response) {
      return response.text().then(function (text) {
        var body = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(body.message || ('HTTP ' + response.status));
        return body;
      });
    });
  }

  function apiOrders(path, options) {
    options = options || {};
    var headers = { Authorization: 'Bearer ' + token() };
    if (options.body) headers['Content-Type'] = 'application/json';
    return fetch(path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (response) {
      return response.text().then(function (text) {
        var body = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(body.error || ('HTTP ' + response.status));
        return body;
      });
    });
  }

  function decode(base64) {
    var clean = base64.replace(/\n/g, '');
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function encode(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // ---------- Контент ----------
  function numberFields(container, spec, values) {
    container.innerHTML = '';
    spec.forEach(function (pair) {
      var id = container.id + '-' + pair[0];
      var box = document.createElement('div');
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = pair[1] + ', ₽';
      var input = document.createElement('input');
      input.id = id;
      input.type = 'number';
      input.min = '0';
      input.step = '10';
      input.dataset.key = pair[0];
      input.value = values && values[pair[0]] !== undefined ? values[pair[0]] : '';
      box.appendChild(label);
      box.appendChild(input);
      container.appendChild(box);
    });
  }
  function collectNumbers(container) {
    var result = {};
    Array.prototype.forEach.call(container.querySelectorAll('input'), function (input) {
      var value = parseInt(input.value, 10);
      if (!isNaN(value)) result[input.dataset.key] = value;
    });
    return result;
  }
  function packFields(values) {
    var container = el('packFields');
    container.innerHTML = '';
    PACKS_LIST.forEach(function (pair) {
      var current = (values && values[pair[0]]) || {};
      if (typeof current === 'number') current = { weekday: current, weekend: current };
      var wrap = document.createElement('div');
      wrap.className = 'pack-row';
      var title = document.createElement('div');
      title.className = 'pack-title';
      title.textContent = pair[1];
      wrap.appendChild(title);
      ['weekday', 'weekend'].forEach(function (kind) {
        var box = document.createElement('div');
        var label = document.createElement('label');
        label.textContent = (kind === 'weekday' ? 'Будни' : 'Выходные') + ', ₽';
        var input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '100';
        input.dataset.pack = pair[0];
        input.dataset.kind = kind;
        input.value = current[kind] !== undefined ? current[kind] : '';
        box.appendChild(label);
        box.appendChild(input);
        wrap.appendChild(box);
      });
      container.appendChild(wrap);
    });
  }
  function collectPacks() {
    var result = {};
    Array.prototype.forEach.call(el('packFields').querySelectorAll('input'), function (input) {
      var id = input.dataset.pack;
      var kind = input.dataset.kind;
      var value = parseInt(input.value, 10);
      if (isNaN(value)) return;
      if (!result[id]) result[id] = {};
      result[id][kind] = value;
    });
    Object.keys(result).forEach(function (id) {
      if (result[id].weekday === undefined) result[id].weekday = result[id].weekend;
      if (result[id].weekend === undefined) result[id].weekend = result[id].weekday;
    });
    return result;
  }
  function listToText(list) { return (list || []).join('\n'); }
  function textToList(v) { return v.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); }
  function renderThumbs() {
    var box = el('collageThumbs');
    box.innerHTML = '';
    textToList(el('collagePhotos').value).slice(0, 12).forEach(function (src) {
      var img = document.createElement('img');
      img.src = '../' + src;
      img.alt = src;
      box.appendChild(img);
    });
  }
  function fillContent(data) {
    var contacts = data.contacts || {};
    el('addressShort').value = contacts.addressShort || '';
    el('addressFull').value = contacts.addressFull || '';
    el('phone').value = contacts.phone || '';
    el('hours').value = contacts.hours || '';
    numberFields(el('tierFields'), TIERS, data.tiers);
    numberFields(el('roomFields'), ROOMS_LIST, data.rooms);
    packFields(data.packs);
    numberFields(el('extraFields'), EXTRAS_LIST, data.extras);
    var photos = data.photos || {};
    el('collagePhotos').value = listToText(photos.collage);
    el('junglePhotos').value = listToText(photos.jungle);
    el('loftPhotos').value = listToText(photos.loft);
    renderThumbs();
  }
  function collectContent() {
    var base = state.data || {};
    return {
      version: base.version || 2,
      contacts: {
        addressShort: el('addressShort').value.trim(),
        addressFull: el('addressFull').value.trim(),
        phone: el('phone').value.trim(),
        hours: el('hours').value.trim()
      },
      tiers: collectNumbers(el('tierFields')),
      rooms: collectNumbers(el('roomFields')),
      packs: collectPacks(),
      extras: collectNumbers(el('extraFields')),
      photos: {
        collage: textToList(el('collagePhotos').value),
        jungle: textToList(el('junglePhotos').value),
        loft: textToList(el('loftPhotos').value)
      }
    };
  }

  // ---------- Заявки ----------
  var STATUS_CLASSES = { 'Новая': 'st-new', 'В работе': 'st-work', 'Подтверждена': 'st-ok', 'Отклонена': 'st-cancel' };
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function fmtEventDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }
  function escape(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function digits(phone) { return String(phone || '').replace(/\D/g, ''); }

  function renderOrders() {
    var listNode = el('ordersList');
    var status = el('filterStatus').value;
    var query = el('filterQuery').value.trim().toLowerCase();
    var filtered = state.orders.filter(function (o) {
      if (status && o.status !== status) return false;
      if (!query) return true;
      var hay = [o.fio, o.phone, o.childName, o.comment, o.packName, o.roomName, (o.extraNames || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(query) !== -1;
    });
    if (!filtered.length) {
      listNode.innerHTML = '<div class="empty">Заявок нет.</div>';
      return;
    }
    listNode.innerHTML = filtered.map(function (o) {
      var cls = STATUS_CLASSES[o.status] || 'st-cancel';
      var extras = (o.extraNames && o.extraNames.length) ? o.extraNames.join(', ') : '—';
      var telHref = digits(o.phone) ? '+' + digits(o.phone) : '';
      var promo = o.promo ? ' · Промокод: <b>' + escape(o.promo) + '</b>' : '';
      var updated = o.updatedAt ? ' · обновлено ' + escape(fmtDate(o.updatedAt)) : '';
      return '<div class="order" data-path="' + escape(o.__path) + '">' +
        '<div class="order-head">' +
          '<div><div class="order-title">' + escape(o.fio) + ' · праздник ' + escape(fmtEventDate(o.eventDate)) + ' в ' + escape(o.eventTime || '') + '</div>' +
          '<div class="order-meta">Заявка от ' + escape(fmtDate(o.createdAt)) + updated + '</div></div>' +
          '<span class="order-status ' + cls + '">' + escape(o.status || 'Новая') + '</span>' +
        '</div>' +
        '<div class="order-body">' +
          '<b>Именинник:</b> ' + escape(o.childName) + ' · д.р. ' + escape(fmtEventDate(o.childBday)) + '<br>' +
          '<b>Телефон:</b> ' + escape(o.phone) + '<br>' +
          '<b>Пакет:</b> ' + escape(o.packName || '—') + ' · <b>Комната:</b> ' + escape(o.roomName || '—') + '<br>' +
          '<b>Услуги:</b> ' + escape(extras) + '<br>' +
          '<b>Длительность:</b> ' + escape(o.durationText || '—') + ' · <b>Окончание:</b> ' + escape(o.endTimeText || '—') + ' · <b>Стоимость:</b> ' + escape(o.priceText || '—') + promo +
          (o.comment ? '<br><b>Комментарий:</b> ' + escape(o.comment) : '') +
        '</div>' +
        '<div class="order-actions">' +
          (telHref ? '<a class="tel-link" href="tel:' + escape(telHref) + '">Позвонить</a>' : '') +
          '<label style="margin:0">Статус:</label>' +
          '<select data-status="' + escape(o.__path) + '">' +
            Object.keys(STATUS_CLASSES).map(function (s) {
              return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function loadOrders() {
    setStatus(el('ordersStatus'), 'Загружаю заявки…');
    var months = el('filterMonths').value;
    return apiOrders('/api/orders?months=' + encodeURIComponent(months))
      .then(function (body) {
        state.orders = body.orders || [];
        renderOrders();
        renderStats();
        setStatus(el('ordersStatus'), 'Заявок загружено: ' + state.orders.length + '.', true);
      })
      .catch(function (err) {
        setStatus(el('ordersStatus'), 'Не получилось: ' + err.message, false);
      });
  }

  function changeStatus(path, status) {
    setStatus(el('ordersStatus'), 'Обновляю статус…');
    return apiOrders('/api/orders', { method: 'PATCH', body: { path: path, status: status } })
      .then(function () {
        var idx = state.orders.findIndex(function (o) { return o.__path === path; });
        if (idx !== -1) { state.orders[idx].status = status; state.orders[idx].updatedAt = new Date().toISOString(); }
        renderOrders();
        renderStats();
        setStatus(el('ordersStatus'), 'Статус обновлён.', true);
      })
      .catch(function (err) {
        setStatus(el('ordersStatus'), 'Не получилось: ' + err.message, false);
        loadOrders();
      });
  }

  function exportCsv() {
    var rows = [['Создано','Статус','ФИО','Телефон','Именинник','ДР','Дата','Время','Пакет','Комната','Услуги','Длительность','Окончание','Стоимость','Промокод','Комментарий']];
    state.orders.forEach(function (o) {
      rows.push([
        fmtDate(o.createdAt), o.status || '', o.fio || '', o.phone || '', o.childName || '', o.childBday || '',
        o.eventDate || '', o.eventTime || '', o.packName || '', o.roomName || '',
        (o.extraNames || []).join(', '), o.durationText || '', o.endTimeText || '', o.priceText || '', o.promo || '', o.comment || ''
      ]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (v) {
        var s = String(v == null ? '' : v);
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(';');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'planeta-orders-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); document.body.removeChild(a); }, 0);
  }

  // ---------- Статистика ----------
  function periodStart(period) {
    var now = new Date();
    if (period === 'all') return 0;
    var days = { week: 7, month: 30, quarter: 90, year: 365 }[period] || 30;
    return now.getTime() - days * 86400000;
  }
  function renderStats() {
    var period = el('statsPeriod').value;
    var from = periodStart(period);
    var subset = state.orders.filter(function (o) {
      if (!o.createdAt) return false;
      return new Date(o.createdAt).getTime() >= from;
    });
    var counts = { total: subset.length, confirmed: 0, rejected: 0, priceSum: 0, priceCount: 0 };
    var packMap = {}, extraMap = {}, statusMap = {};
    subset.forEach(function (o) {
      statusMap[o.status || 'Новая'] = (statusMap[o.status || 'Новая'] || 0) + 1;
      if (o.status === 'Подтверждена') counts.confirmed++;
      if (o.status === 'Отклонена') counts.rejected++;
      if (o.packName) packMap[o.packName] = (packMap[o.packName] || 0) + 1;
      (o.extraNames || []).forEach(function (name) { extraMap[name] = (extraMap[name] || 0) + 1; });
      var priceNum = parseInt(String(o.priceText || '').replace(/\D/g, ''), 10);
      if (Number.isFinite(priceNum) && priceNum > 0) { counts.priceSum += priceNum; counts.priceCount++; }
    });
    var avg = counts.priceCount ? Math.round(counts.priceSum / counts.priceCount) : 0;
    var conversion = counts.total ? Math.round(counts.confirmed / counts.total * 100) : 0;
    el('statsSummary').innerHTML =
      stat('Всего заявок', counts.total) +
      stat('Подтверждено', counts.confirmed) +
      stat('Отклонено', counts.rejected) +
      stat('Конверсия', conversion + ' %') +
      stat('Средний чек', avg ? avg.toLocaleString('ru-RU') + ' ₽' : '—') +
      stat('Сумма заявок', counts.priceSum ? counts.priceSum.toLocaleString('ru-RU') + ' ₽' : '—');
    el('statsPacks').innerHTML = breakdown(packMap) || '<div class="empty">Нет данных.</div>';
    el('statsExtras').innerHTML = breakdown(extraMap) || '<div class="empty">Нет данных.</div>';
    el('statsStatuses').innerHTML = breakdown(statusMap) || '<div class="empty">Нет данных.</div>';
  }
  function stat(label, value) {
    return '<div class="stat"><div class="stat-value">' + escape(String(value)) + '</div><div class="stat-label">' + escape(label) + '</div></div>';
  }
  function breakdown(map) {
    var entries = Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (!entries.length) return '';
    return entries.map(function (e) { return '<div class="breakdown-row"><span>' + escape(e[0]) + '</span><b>' + e[1] + '</b></div>'; }).join('');
  }

  // ---------- Загрузка данных ----------
  function loadContent() {
    return ghApi('/contents/' + FILE + '?ref=' + BRANCH)
      .then(function (body) {
        state.sha = body.sha;
        state.data = JSON.parse(decode(body.content));
        fillContent(state.data);
      });
  }

  function login() {
    if (!token()) { setStatus(el('authStatus'), 'Вставьте токен.', false); return; }
    localStorage.setItem(KEY, token());
    setStatus(el('authStatus'), 'Проверяю доступ…');
    Promise.all([loadContent(), loadOrders()])
      .then(function () {
        el('editor').hidden = false;
        setStatus(el('authStatus'), 'Данные загружены.', true);
      })
      .catch(function (err) {
        setStatus(el('authStatus'), 'Не получилось: ' + err.message, false);
      });
  }

  function save() {
    var data = collectContent();
    if (data.photos.collage.length < 5) { setStatus(el('saveStatus'), 'В коллаже нужно минимум 5 фотографий.', false); return; }
    el('save').disabled = true;
    setStatus(el('saveStatus'), 'Сохраняю…');
    ghApi('/contents/' + FILE, {
      method: 'PUT',
      body: {
        message: 'content: обновление через панель',
        content: encode(JSON.stringify(data, null, 2) + '\n'),
        sha: state.sha,
        branch: BRANCH
      }
    })
      .then(function (body) {
        state.sha = body.content.sha;
        state.data = data;
        setStatus(el('saveStatus'), 'Сохранено. Сайт обновится через 1–2 минуты.', true);
      })
      .catch(function (err) {
        setStatus(el('saveStatus'), 'Ошибка: ' + err.message, false);
      })
      .then(function () { el('save').disabled = false; });
  }

  function uploadFiles(files) {
    var target = el('uploadTarget').value;
    var queue = Array.prototype.slice.call(files);
    var uploaded = [];
    function next() {
      if (!queue.length) {
        if (target && uploaded.length) {
          var field = el(target === 'collage' ? 'collagePhotos' : (target === 'jungle' ? 'junglePhotos' : 'loftPhotos'));
          field.value = (field.value.trim() ? field.value.trim() + '\n' : '') + uploaded.join('\n');
          renderThumbs();
        }
        setStatus(el('uploadStatus'), 'Загружено файлов: ' + uploaded.length + '. Не забудьте сохранить.', true);
        return;
      }
      var file = queue.shift();
      var name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      setStatus(el('uploadStatus'), 'Загружаю ' + name + '…');
      var reader = new FileReader();
      reader.onload = function () {
        var base64 = String(reader.result).split(',')[1];
        ghApi('/contents/' + encodeURIComponent(name), {
          method: 'PUT',
          body: { message: 'media: ' + name, content: base64, branch: BRANCH }
        }).then(function () { uploaded.push(name); next(); })
          .catch(function (err) { setStatus(el('uploadStatus'), 'Файл ' + name + ': ' + err.message, false); });
      };
      reader.readAsDataURL(file);
    }
    next();
  }

  // ---------- Табы и события ----------
  function switchTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-panel'), function (p) {
      p.hidden = p.dataset.panel !== name;
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
    b.addEventListener('click', function () { switchTab(b.dataset.tab); });
  });

  el('load').onclick = login;
  el('save').onclick = save;
  el('forget').onclick = function () {
    localStorage.removeItem(KEY);
    el('token').value = '';
    el('editor').hidden = true;
    setStatus(el('authStatus'), 'Токен удалён из браузера.', true);
  };
  el('collagePhotos').addEventListener('input', renderThumbs);
  el('upload').addEventListener('change', function (event) {
    if (event.target.files && event.target.files.length) uploadFiles(event.target.files);
    event.target.value = '';
  });
  el('ordersRefresh').addEventListener('click', loadOrders);
  el('ordersExport').addEventListener('click', exportCsv);
  el('filterStatus').addEventListener('change', renderOrders);
  el('filterQuery').addEventListener('input', renderOrders);
  el('filterMonths').addEventListener('change', loadOrders);
  el('statsPeriod').addEventListener('change', renderStats);
  el('ordersList').addEventListener('change', function (event) {
    var target = event.target;
    if (target.tagName === 'SELECT' && target.dataset.status) {
      changeStatus(target.dataset.status, target.value);
    }
  });

  var saved = localStorage.getItem(KEY);
  if (saved) { el('token').value = saved; login(); }
})();

/* Connected after the page's catalogue and shared rules. */
(function () {
  'use strict';
  const form = document.getElementById('orderForm');
  const fields = ['fio', 'phone', 'childName', 'childBday', 'eventDate', 'eventTime', 'comment', 'promo'];
  const catalog = { packs: PACKS, rooms: ROOMS, extras: EXTRAS };
  const touched = new Set();
  let attempted = false, busy = false, requestId = '', lastPayload = '';
  const status = document.getElementById('orderSentMsg');
  const button = form.querySelector('[type=submit]');
  function values() {
    const data = {};
    new FormData(form).forEach((v, k) => { if (k !== 'extra') data[k] = v; });
    data.extra = [...form.querySelectorAll('[name=extra]:checked')].map(c => c.value);
    return data;
  }
  function render(errors, all) {
    fields.forEach(name => {
      const el = form.elements.namedItem(name);
      const message = (all || touched.has(name)) ? errors[name] || '' : '';
      el.setAttribute('aria-invalid', message ? 'true' : 'false');
      document.getElementById('error-' + name).textContent = message;
    });
    document.getElementById('error-selection').textContent = all ? errors.selection || errors.pack || errors.room || errors.extra || '' : '';
  }
  function result() {
    const today = OrderRules.clock().date;
    form.eventDate.min = today;
    form.childBday.max = today;
    return OrderRules.validate(values(), catalog);
  }
  function showStatus(text, error) {
    status.textContent = text;
    status.style.display = text ? 'block' : 'none';
    status.style.color = error ? '#a91616' : '#24633a';
  }
  fields.forEach(name => {
    const el = form.elements.namedItem(name);
    el.addEventListener('blur', () => {
      touched.add(name);
      if (name === 'phone') {
        const p = OrderRules.phone(el.value);
        if (p) el.value = `${p.slice(0, 2)} (${p.slice(2, 5)}) ${p.slice(5, 8)}-${p.slice(8, 10)}-${p.slice(10)}`;
      }
      render(result().errors, attempted);
    });
  });
  form.addEventListener('input', () => {
    recalc();
    render(result().errors, attempted);
    if (!busy) showStatus('', false);
  });
  form.addEventListener('change', () => { recalc(); render(result().errors, attempted); });
  function focusError() {
    const first = form.querySelector('[aria-invalid=true]');
    if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    else document.getElementById('error-selection').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  window.submitOrder = async function (e) {
    e.preventDefault();
    if (busy) return;
    attempted = true;
    const checked = result();
    render(checked.errors, true);
    if (!checked.ok) { showStatus('Проверьте отмеченные поля. Заявка ещё не отправлена.', true); focusError(); return; }
    recalc();
    const payload = { ...checked.data, website: form.website.value };
    const signature = JSON.stringify(payload);
    if (signature !== lastPayload || !requestId) {
      requestId = crypto.randomUUID();
      lastPayload = signature;
    }
    payload.requestId = requestId;
    busy = true; button.disabled = true; button.textContent = 'Отправляем…';
    form.setAttribute('aria-busy', 'true');
    showStatus('', false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      if (!SHEET_WEBHOOK_URL) throw new Error('unconfigured');
      const response = await fetch(SHEET_WEBHOOK_URL, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('http');
      const reply = await response.json();
      if (reply.status === 'invalid') {
        render(reply.errors || {}, true);
        showStatus('Проверьте отмеченные поля. Заявка не отправлена.', true);
        focusError(); return;
      }
      if (reply.status !== 'ok') throw new Error('server');
      showStatus('Заявка записана. Мы свяжемся с вами для подтверждения праздника.', false);
      form.reset(); touched.clear(); attempted = false; requestId = ''; lastPayload = '';
      renderOrderOptions(); recalc(); render({}, true);
    } catch (err) {
      showStatus('Не удалось подтвердить запись заявки. Данные сохранены в форме. Проверьте интернет и повторите отправку; если проблема останется, позвоните нам.', true);
    } finally {
      clearTimeout(timer); busy = false; button.disabled = false;
      button.textContent = 'Отправить заявку'; form.removeAttribute('aria-busy');
    }
  };
  // No native English tooltips: all validation messages are inline, in Russian.
  form.noValidate = true;
  result();
})();

/**
 * Планета Игр — Купчино
 * Валидация формы заявки (#orderForm).
 *
 * Как подключить (один раз, 10 секунд):
 * 1. Откройте index.html на GitHub в режиме редактирования (карандаш).
 * 2. Найдите строку "</body>" в самом конце файла.
 * 3. Прямо ПЕРЕД ней вставьте одну строку:
 *      <script src="validation.js" defer></script>
 * 4. Сохраните (Commit changes).
 * Всё — правила заработают сразу, ничего больше не нужно менять.
 */
(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    var form = document.getElementById('orderForm');
    if (!form) return;

    var fioInput = form.querySelector('[name="fio"]');
    var phoneInput = form.querySelector('[name="phone"]');
    var childNameInput = form.querySelector('[name="childName"]');
    var childBdayInput = form.querySelector('[name="childBday"]');
    var eventDateInput = form.querySelector('[name="eventDate"]');
    var eventTimeInput = form.querySelector('[name="eventTime"]');

    var OPEN_HOUR = 10;
    var CLOSE_HOUR = 22;

    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10);
    if (eventDateInput) eventDateInput.min = todayStr;
    if (childBdayInput) childBdayInput.max = todayStr;

    function formatPhone(value) {
      var digits = value.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7')) digits = '7' + digits;
      digits = digits.slice(0, 11);
      var d = digits.slice(1);
      var out = '+7';
      if (d.length > 0) out += ' (' + d.slice(0, 3);
      if (d.length >= 3) out += ')';
      if (d.length > 3) out += ' ' + d.slice(3, 6);
      if (d.length > 6) out += '-' + d.slice(6, 8);
      if (d.length > 8) out += '-' + d.slice(8, 10);
      return out;
    }
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var pos = phoneInput.selectionStart;
        var before = phoneInput.value.length;
        phoneInput.value = formatPhone(phoneInput.value);
        var after = phoneInput.value.length;
        try { phoneInput.setSelectionRange(pos + (after - before), pos + (after - before)); } catch (e) {}
        clearError(phoneInput);
      });
    }

    function showError(input, message) {
      if (!input) return;
      input.style.borderColor = '#e2231a';
      var next = input.nextElementSibling;
      if (!(next && next.classList && next.classList.contains('field-error'))) {
        var span = document.createElement('div');
        span.className = 'field-error';
        span.style.cssText = 'color:#e2231a;font-size:.78rem;font-weight:700;margin:-10px 0 8px;';
        input.insertAdjacentElement('afterend', span);
        next = span;
      }
      next.textContent = message;
    }
    function clearError(input) {
      if (!input) return;
      input.style.borderColor = '';
      var next = input.nextElementSibling;
      if (next && next.classList && next.classList.contains('field-error')) {
        next.remove();
      }
    }
    [fioInput, phoneInput, childNameInput, eventDateInput, eventTimeInput].forEach(function (el) {
      if (el) el.addEventListener('input', function () { clearError(el); });
    });

    var NAME_RE = /^[A-Za-zА-Яа-яЁё\s-]+$/;
    var PHONE_DIGITS_RE = /^7\d{10}$/;

    function validateOrder() {
      var ok = true;

      var fio = (fioInput.value || '').trim();
      if (fio.length < 5 || fio.split(/\s+/).length < 2) {
        showError(fioInput, 'Введите фамилию и имя полностью');
        ok = false;
      } else if (!NAME_RE.test(fio)) {
        showError(fioInput, 'ФИО может содержать только буквы, пробел и дефис');
        ok = false;
      }

      var phoneDigits = (phoneInput.value || '').replace(/\D/g, '');
      if (phoneDigits.startsWith('8')) phoneDigits = '7' + phoneDigits.slice(1);
      if (!PHONE_DIGITS_RE.test(phoneDigits)) {
        showError(phoneInput, 'Введите номер телефона полностью, например +7 (900) 123-45-67');
        ok = false;
      }

      var childName = (childNameInput.value || '').trim();
      if (childName.length < 2) {
        showError(childNameInput, 'Укажите имя именинника');
        ok = false;
      } else if (!NAME_RE.test(childName)) {
        showError(childNameInput, 'Имя может содержать только буквы, пробел и дефис');
        ok = false;
      }

      if (childBdayInput.value) {
        var bday = new Date(childBdayInput.value);
        var minBday = new Date();
        minBday.setFullYear(minBday.getFullYear() - 100);
        if (bday > today) {
          showError(childBdayInput, 'Дата рождения не может быть в будущем');
          ok = false;
        } else if (bday < minBday) {
          showError(childBdayInput, 'Проверьте дату рождения');
          ok = false;
        }
      }

      if (!eventDateInput.value) {
        showError(eventDateInput, 'Укажите желаемую дату праздника');
        ok = false;
      } else {
        var eDate = new Date(eventDateInput.value + 'T00:00:00');
        var todayZero = new Date(todayStr + 'T00:00:00');
        if (eDate < todayZero) {
          showError(eventDateInput, 'Дата праздника не может быть в прошлом');
          ok = false;
        }
      }

      if (!eventTimeInput.value) {
        showError(eventTimeInput, 'Укажите время начала праздника');
        ok = false;
      } else {
        var parts = eventTimeInput.value.split(':').map(Number);
        var h = parts[0], m = parts[1];
        var mins = h * 60 + m;
        if (mins < OPEN_HOUR * 60 || mins > (CLOSE_HOUR - 1) * 60) {
          showError(eventTimeInput, 'Мы работаем с ' + OPEN_HOUR + ':00 до ' + CLOSE_HOUR + ':00 — выберите время в этом диапазоне');
          ok = false;
        }
      }

      return ok;
    }

    var originalSubmitOrder = window.submitOrder;
    window.submitOrder = function (e) {
      if (!validateOrder()) {
        e.preventDefault();
        var firstError = form.querySelector('.field-error');
        if (firstError) firstError.previousElementSibling.focus();
        return false;
      }
      return originalSubmitOrder(e);
    };
  });
})();

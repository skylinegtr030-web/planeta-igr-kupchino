/* form-ux.js — phone mask, comment counter, promo visual feedback, autofocus, details animation */
(function () {
  'use strict';

  /* ── 1. Phone mask ──────────────────────────────────────────────── */
  function applyPhoneMask(el) {
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (digits.startsWith('7') && digits.length > 1) {
        var d = digits.slice(1, 11);
        var out = '+7';
        if (d.length > 0) out += ' (' + d.slice(0, 3);
        if (d.length >= 3) out += ') ';
        if (d.length > 3) out += d.slice(3, 6);
        if (d.length >= 6) out += '-';
        if (d.length > 6) out += d.slice(6, 8);
        if (d.length >= 8) out += '-';
        if (d.length > 8) out += d.slice(8, 10);
        el.value = out;
      } else if (digits.length === 0) {
        el.value = '';
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && el.value === '+7 (') {
        el.value = '';
        e.preventDefault();
      }
    });
    el.addEventListener('focus', function () {
      if (el.value === '') el.value = '+7 (';
      setTimeout(function () { el.setSelectionRange(el.value.length, el.value.length); }, 0);
    });
    el.addEventListener('blur', function () {
      if (el.value === '+7 (') el.value = '';
    });
  }

  /* ── 2. Comment counter ─────────────────────────────────────────── */
  function attachCommentCounter(textarea) {
    var max = parseInt(textarea.getAttribute('maxlength') || '1000', 10);
    var counter = document.createElement('div');
    counter.id = 'comment-counter';
    counter.style.cssText = 'font-size:.75rem;font-weight:700;color:#8a93ab;text-align:right;margin-top:-10px;margin-bottom:8px';
    counter.textContent = '0 / ' + max;
    textarea.parentNode.insertBefore(counter, textarea.nextSibling);
    textarea.addEventListener('input', function () {
      var len = textarea.value.length;
      counter.textContent = len + ' / ' + max;
      counter.style.color = len > max * 0.9 ? '#e2231a' : '#8a93ab';
    });
  }

  /* ── 3. Promo visual feedback ───────────────────────────────────── */
  function attachPromoFeedback(input) {
    var wrap = input.parentNode;
    var badge = document.createElement('span');
    badge.id = 'promo-badge';
    badge.style.cssText = 'display:none;margin-left:8px;font-weight:900;font-size:.85rem';
    input.style.display = 'inline-block';
    input.style.width = 'calc(100% - 80px)';
    input.insertAdjacentElement('afterend', badge);

    function check() {
      var val = (input.value || '').trim().toUpperCase();
      if (!val) { badge.style.display = 'none'; return; }
      if (val === 'PLANETA10') {
        badge.textContent = '✓ −10%';
        badge.style.color = '#28a745';
      } else {
        badge.textContent = '✗ Не найден';
        badge.style.color = '#e2231a';
      }
      badge.style.display = 'inline';
    }
    input.addEventListener('input', check);
    input.addEventListener('blur', check);
  }

  /* ── 4. Autofocus on modal open ─────────────────────────────────── */
  function attachAutofocus() {
    var modal = document.getElementById('orderModal');
    if (!modal) return;
    var observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'class' && modal.classList.contains('active')) {
          setTimeout(function () {
            var first = modal.querySelector('input:not([type=hidden]):not([tabindex="-1"])');
            if (first) first.focus();
          }, 120);
        }
      });
    });
    observer.observe(modal, { attributes: true });
  }

  /* ── 5. Details smooth animation ───────────────────────────────── */
  function animateDetails() {
    var style = document.createElement('style');
    style.textContent =
      '.form-rules summary{cursor:pointer;font-weight:800;font-size:.82rem;color:var(--blue);margin-bottom:6px;user-select:none}' +
      '.form-rules[open] summary{color:var(--red)}' +
      '.form-rules ul{margin:8px 0 0 18px;font-size:.8rem;font-weight:600;color:#42506e;line-height:1.9;' +
      'animation:rulesIn .3s ease both}' +
      '@keyframes rulesIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}';
    document.head.appendChild(style);
  }

  /* ── Init ───────────────────────────────────────────────────────── */
  function init() {
    var phoneEl = document.getElementById('orderPhone');
    if (phoneEl) applyPhoneMask(phoneEl);

    var commentEl = document.getElementById('orderComment');
    if (commentEl) attachCommentCounter(commentEl);

    var promoEl = document.getElementById('promoInput');
    if (promoEl) attachPromoFeedback(promoEl);

    attachAutofocus();
    animateDetails();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Automatic review carousel: one review every 10 seconds. */
(function () {
  'use strict';
  var section = document.getElementById('reviews');
  if (!section) return;
  var grid = section.querySelector('.review-grid');
  if (!grid || grid.dataset.rotatorReady) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.review'));
  if (cards.length < 2) return;
  grid.dataset.rotatorReady = '1';

  var style = document.createElement('style');
  style.textContent = '.pg-review-slider{display:block!important;position:relative;max-width:820px;margin:24px auto 0!important;min-height:230px}.pg-review-slider .review{display:none;margin:0;min-height:190px;padding:34px 40px;border-radius:28px;background:rgba(255,255,255,.94);box-shadow:0 18px 50px rgba(17,26,59,.13);text-align:center;align-content:center}.pg-review-slider .review.pg-review-active{display:block;animation:pgReviewIn .65s cubic-bezier(.2,.8,.2,1)}.pg-review-slider .review p{font-size:1.13rem;line-height:1.65;max-width:680px;margin:8px auto 16px}.pg-review-slider .stars{font-size:1.35rem}.pg-review-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px}.pg-review-arrow{width:40px;height:40px;border:0;border-radius:50%;background:#fff;color:#1f5fd6;font-size:22px;font-weight:900;cursor:pointer;box-shadow:0 7px 20px rgba(17,26,59,.13);transition:transform .2s,background .2s}.pg-review-arrow:hover{transform:scale(1.08);background:#eef2ff}.pg-review-dots{display:flex;gap:8px}.pg-review-dot{width:10px;height:10px;border:0;border-radius:50%;padding:0;background:#cfd8ea;cursor:pointer;transition:width .25s,background .25s}.pg-review-dot.active{width:28px;border-radius:10px;background:#e2231a}.pg-review-progress{position:absolute;left:20px;right:20px;bottom:0;height:4px;border-radius:4px;overflow:hidden;background:#eef2ff}.pg-review-progress span{display:block;width:0;height:100%;background:linear-gradient(90deg,#e2231a,#ffc72c,#28a745);border-radius:4px}.pg-review-progress span.run{animation:pgReviewProgress 10s linear forwards}@keyframes pgReviewIn{from{opacity:0;transform:translateX(35px) scale(.97)}to{opacity:1;transform:none}}@keyframes pgReviewProgress{from{width:0}to{width:100%}}@media(max-width:600px){.pg-review-slider{min-height:260px}.pg-review-slider .review{min-height:220px;padding:28px 22px}.pg-review-slider .review p{font-size:1rem}}@media(prefers-reduced-motion:reduce){.pg-review-slider .review.pg-review-active,.pg-review-progress span.run{animation:none}}';
  document.head.appendChild(style);

  grid.classList.add('pg-review-slider');
  var nav = document.createElement('div');
  nav.className = 'pg-review-nav';
  nav.innerHTML = '<button class="pg-review-arrow pg-prev" type="button" aria-label="Предыдущий отзыв">‹</button><div class="pg-review-dots" aria-label="Выбор отзыва"></div><button class="pg-review-arrow pg-next" type="button" aria-label="Следующий отзыв">›</button>';
  grid.parentNode.insertBefore(nav, grid.nextSibling);
  var progress = document.createElement('div');
  progress.className = 'pg-review-progress';
  progress.innerHTML = '<span></span>';
  grid.appendChild(progress);
  var progressBar = progress.querySelector('span');
  var dotsBox = nav.querySelector('.pg-review-dots');
  var current = 0;
  var interval = null;
  var paused = false;

  cards.forEach(function (card, index) {
    card.setAttribute('aria-hidden', index ? 'true' : 'false');
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'pg-review-dot';
    dot.setAttribute('aria-label', 'Показать отзыв ' + (index + 1));
    dot.onclick = function () { show(index); restart(); };
    dotsBox.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsBox.children);

  function restartProgress() {
    progressBar.classList.remove('run');
    void progressBar.offsetWidth;
    if (!paused && !document.hidden) progressBar.classList.add('run');
  }

  function show(index) {
    current = (index + cards.length) % cards.length;
    cards.forEach(function (card, i) {
      card.classList.toggle('pg-review-active', i === current);
      card.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach(function (dot, i) { dot.classList.toggle('active', i === current); });
    restartProgress();
  }

  function restart() {
    clearInterval(interval);
    if (!paused && !document.hidden) interval = setInterval(function () { show(current + 1); }, 10000);
  }

  nav.querySelector('.pg-prev').onclick = function () { show(current - 1); restart(); };
  nav.querySelector('.pg-next').onclick = function () { show(current + 1); restart(); };
  [grid, nav].forEach(function (element) {
    element.addEventListener('mouseenter', function () { paused = true; clearInterval(interval); progressBar.classList.remove('run'); });
    element.addEventListener('mouseleave', function () { paused = false; restart(); restartProgress(); });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(interval);
      progressBar.classList.remove('run');
    } else {
      restart();
      restartProgress();
    }
  });

  show(0);
  restart();
})();

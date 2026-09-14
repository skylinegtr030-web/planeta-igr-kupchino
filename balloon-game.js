/* Interactive balloon challenge for the hero section. */
(function () {
  'use strict';

  var hero = document.getElementById('hero');
  var scoreBox = document.getElementById('balloonScore');
  if (!hero || !scoreBox) return;

  document.querySelectorAll('#hero .balloon').forEach(function (item) { item.remove(); });

  var target = 15;
  var duration = 30;
  var score = 0;
  var timeLeft = duration;
  var active = false;
  var timer = null;
  var spawner = null;
  var audio = null;

  var style = document.createElement('style');
  style.textContent = [
    '#balloonScore{cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s;white-space:nowrap}',
    '#balloonScore:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(17,26,59,.22)}',
    '#balloonScore:focus-visible{outline:3px solid #ffc72c;outline-offset:3px}',
    '#balloonScore.pg-active{background:#111a3b;color:#fff}',
    '.pg-balloon{position:absolute;z-index:7;width:54px;height:66px;border:0;border-radius:52% 48% 48% 52%;background:var(--c);box-shadow:inset -9px -8px 0 rgba(0,0,0,.12),inset 8px 8px 0 rgba(255,255,255,.28),0 10px 20px rgba(17,26,59,.2);cursor:crosshair;display:grid;place-items:center;color:#fff;font-size:24px;line-height:1;animation:pgBalloonFly var(--speed) linear forwards;touch-action:manipulation}',
    '.pg-balloon:before{content:"";position:absolute;left:24px;bottom:-8px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:9px solid var(--c)}',
    '.pg-balloon:after{content:"";position:absolute;left:27px;top:64px;width:1px;height:34px;background:rgba(17,26,59,.35)}',
    '.pg-balloon:hover{filter:brightness(1.1);transform:scale(1.08)}',
    '.pg-balloon.pg-gold{background:linear-gradient(135deg,#ffd84d,#ff9f1c);--c:#ffb21c;box-shadow:0 0 0 5px rgba(255,199,44,.22),0 12px 25px rgba(255,159,28,.35)}',
    '.pg-balloon.pg-time{background:linear-gradient(135deg,#63e6ff,#1f5fd6);--c:#1f5fd6}',
    '.pg-balloon.pg-pop{animation:pgPop .28s ease-out forwards!important;pointer-events:none}',
    '.pg-points{position:fixed;z-index:1002;font-weight:1000;font-size:22px;color:#e2231a;pointer-events:none;animation:pgPoints .8s ease-out forwards;text-shadow:0 2px 0 #fff}',
    '.pg-game-modal{position:fixed;inset:0;z-index:2000;background:rgba(17,26,59,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px;opacity:0;transition:opacity .25s}',
    '.pg-game-modal.show{opacity:1}',
    '.pg-game-card{width:min(470px,100%);background:#fff;border-radius:32px;padding:34px 26px;text-align:center;box-shadow:0 28px 80px rgba(0,0,0,.3);transform:scale(.75) rotate(-3deg);transition:transform .45s cubic-bezier(.2,1.5,.4,1);position:relative;overflow:hidden}',
    '.pg-game-modal.show .pg-game-card{transform:scale(1) rotate(0)}',
    '.pg-game-card:before{content:"";position:absolute;width:230px;height:230px;border-radius:50%;background:#fff1b8;right:-90px;top:-110px}',
    '.pg-trophy{font-size:74px;display:block;animation:pgTrophy 1.1s ease-in-out infinite}',
    '.pg-game-card h2{font-size:clamp(1.8rem,6vw,2.7rem);margin:5px 0 10px;color:#111a3b;position:relative}',
    '.pg-game-card p{font-size:1.05rem;font-weight:700;color:#42506e;margin:0 auto 22px;position:relative}',
    '.pg-game-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative}',
    '.pg-game-actions button,.pg-game-actions a{border:0;border-radius:999px;padding:13px 20px;font:800 15px inherit;cursor:pointer;text-decoration:none}',
    '.pg-replay{background:#e2231a;color:#fff}',
    '.pg-programs{background:#eef2ff;color:#1f5fd6}',
    '@keyframes pgBalloonFly{0%{transform:translate(0,40px) rotate(-5deg);opacity:0}8%{opacity:1}50%{transform:translate(var(--drift),-90px) rotate(6deg)}100%{transform:translate(calc(var(--drift) * -0.4),-260px) rotate(-5deg);opacity:.2}}',
    '@keyframes pgPop{to{transform:scale(1.8);opacity:0;filter:brightness(1.8)}}',
    '@keyframes pgPoints{to{transform:translateY(-70px) scale(1.25);opacity:0}}',
    '@keyframes pgTrophy{50%{transform:translateY(-8px) rotate(5deg)}}',
    '@media(max-width:600px){#balloonScore{top:8px;right:8px;font-size:.78rem;padding:7px 11px}.pg-balloon{width:46px;height:56px;font-size:20px}.pg-balloon:after{top:54px;left:23px}.pg-balloon:before{left:20px;bottom:-7px}}',
    '@media(prefers-reduced-motion:reduce){.pg-trophy{animation:none}.pg-game-card{transition:none}}'
  ].join('');
  document.head.appendChild(style);

  scoreBox.setAttribute('role', 'button');
  scoreBox.setAttribute('tabindex', '0');
  scoreBox.setAttribute('aria-label', 'Начать игру с шариками');
  scoreBox.textContent = '🎈 Начать мини-игру';

  function sound(frequency, length) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + length);
    } catch (e) {}
  }

  function confetti(x, y, count) {
    var colors = ['#e2231a','#ffc72c','#28a745','#1f5fd6','#7b2fd6'];
    for (var i = 0; i < count; i++) {
      var piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.style.left = x + 'px';
      piece.style.top = y + 'px';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--dx', ((Math.random() - .5) * 320) + 'px');
      piece.style.setProperty('--dy', (Math.random() * 260 + 60) + 'px');
      piece.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      piece.style.animation = 'confetti-fall 1.1s ease-out forwards';
      document.body.appendChild(piece);
      setTimeout(function (el) { el.remove(); }, 1150, piece);
    }
  }

  function updateScore() {
    scoreBox.textContent = '🎯 ' + score + '/' + target + '  ·  ⏱ ' + timeLeft + ' сек';
  }

  function floatingPoints(balloon, text) {
    var rect = balloon.getBoundingClientRect();
    var label = document.createElement('span');
    label.className = 'pg-points';
    label.textContent = text;
    label.style.left = (rect.left + rect.width / 2) + 'px';
    label.style.top = rect.top + 'px';
    document.body.appendChild(label);
    setTimeout(function () { label.remove(); }, 850);
  }

  function spawn() {
    if (!active) return;
    var balloon = document.createElement('button');
    var chance = Math.random();
    var points = 1;
    balloon.type = 'button';
    balloon.className = 'balloon pg-balloon';
    balloon.style.setProperty('--c', ['#e2231a','#28a745','#7b2fd6','#ff6b9d'][Math.floor(Math.random() * 4)]);
    balloon.style.setProperty('--speed', (3.4 + Math.random() * 1.8) + 's');
    balloon.style.setProperty('--drift', ((Math.random() - .5) * 100) + 'px');
    balloon.style.left = (8 + Math.random() * 84) + '%';
    balloon.style.top = (38 + Math.random() * 45) + '%';
    balloon.setAttribute('aria-label', 'Лопнуть шарик');

    if (chance < .16) {
      points = 3;
      balloon.classList.add('pg-gold');
      balloon.textContent = '★';
      balloon.setAttribute('aria-label', 'Золотой шарик, три очка');
    } else if (chance < .27) {
      balloon.classList.add('pg-time');
      balloon.textContent = '⏱';
      balloon.setAttribute('aria-label', 'Шарик времени, плюс три секунды');
    }

    balloon.addEventListener('click', function () {
      if (!active || balloon.classList.contains('pg-pop')) return;
      var rect = balloon.getBoundingClientRect();
      balloon.classList.add('pg-pop');
      if (balloon.classList.contains('pg-time')) {
        timeLeft += 3;
        floatingPoints(balloon, '+3 сек');
        sound(740, .16);
      } else {
        score += points;
        floatingPoints(balloon, '+' + points);
        sound(points === 3 ? 880 : 520, .12);
      }
      confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, points === 3 ? 18 : 8);
      updateScore();
      setTimeout(function () { balloon.remove(); }, 300);
      if (score >= target) finish(true);
    });

    balloon.addEventListener('animationend', function () { balloon.remove(); });
    hero.appendChild(balloon);
  }

  function clearGame() {
    clearInterval(timer);
    clearInterval(spawner);
    document.querySelectorAll('#hero .pg-balloon').forEach(function (item) { item.remove(); });
  }

  function finish(won) {
    if (!active) return;
    active = false;
    clearGame();
    scoreBox.classList.remove('pg-active');
    scoreBox.textContent = won ? '🏆 Победа!' : '🎈 Попробовать ещё';
    showResult(won);
  }

  function showResult(won) {
    var modal = document.createElement('div');
    modal.className = 'pg-game-modal';
    modal.innerHTML = '<div class="pg-game-card" role="dialog" aria-modal="true" aria-label="Результат игры">' +
      '<span class="pg-trophy">' + (won ? '🏆' : '🎈') + '</span>' +
      '<h2>' + (won ? 'Ты — чемпион Планеты Игр!' : 'Почти получилось!') + '</h2>' +
      '<p>' + (won ? 'Все планеты празднуют твою победу!' : 'Набрано ' + score + ' из ' + target + ' очков. Ещё одна попытка?') + '</p>' +
      '<div class="pg-game-actions"><button class="pg-replay" type="button">Сыграть ещё</button><a class="pg-programs" href="#prices">Выбрать праздник</a></div></div>';
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('show'); });
    if (won) {
      sound(660, .25);
      setTimeout(function () { sound(880, .35); }, 180);
      for (var i = 0; i < 5; i++) {
        setTimeout(function () { confetti(Math.random() * window.innerWidth, 30, 34); }, i * 280);
      }
    }
    modal.querySelector('.pg-replay').onclick = function () { modal.remove(); start(); };
    modal.querySelector('.pg-programs').onclick = function () { modal.remove(); };
  }

  function start() {
    if (active) return;
    clearGame();
    score = 0;
    timeLeft = duration;
    active = true;
    scoreBox.classList.add('pg-active');
    scoreBox.setAttribute('aria-label', 'Счёт и оставшееся время');
    updateScore();
    spawn();
    spawner = setInterval(spawn, 650);
    timer = setInterval(function () {
      timeLeft--;
      updateScore();
      if (timeLeft <= 0) finish(score >= target);
    }, 1000);
  }

  scoreBox.addEventListener('click', start);
  scoreBox.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      start();
    }
  });
})();

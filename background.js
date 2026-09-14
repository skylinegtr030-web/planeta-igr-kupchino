/* Planeta Igr — interactive aurora, cursor glow and lightweight party particles. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 700px)').matches;

  var style = document.createElement('style');
  style.textContent =
    'body{isolation:isolate;background:#f8f9ff}' +
    '.party-aurora{position:fixed;inset:-18%;z-index:-1;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 12% 16%,rgba(255,74,104,.34),transparent 28%),radial-gradient(circle at 86% 12%,rgba(67,123,255,.32),transparent 30%),radial-gradient(circle at 12% 72%,rgba(255,205,44,.28),transparent 30%),radial-gradient(circle at 88% 78%,rgba(40,196,111,.25),transparent 28%),linear-gradient(135deg,#fff7fb 0%,#f5f7ff 48%,#f8fff9 100%);filter:saturate(1.22);animation:auroraMove 18s ease-in-out infinite alternate}' +
    '.party-aurora:before,.party-aurora:after{content:"";position:absolute;border-radius:45%;filter:blur(12px);opacity:.55;mix-blend-mode:multiply}' +
    '.party-aurora:before{width:55vw;height:55vw;left:8%;top:4%;background:conic-gradient(from 30deg,rgba(226,35,26,.20),rgba(255,199,44,.16),rgba(31,95,214,.18),rgba(226,35,26,.20));animation:auroraSpin 28s linear infinite}' +
    '.party-aurora:after{width:50vw;height:50vw;right:3%;bottom:2%;background:conic-gradient(from 120deg,rgba(31,95,214,.20),rgba(40,167,69,.16),rgba(123,47,214,.17),rgba(31,95,214,.20));animation:auroraSpin 34s linear infinite reverse}' +
    '.party-glow{position:fixed;width:360px;height:360px;left:0;top:0;z-index:0;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.72) 0%,rgba(99,230,255,.15) 30%,transparent 68%);transform:translate(-50%,-50%);mix-blend-mode:screen;transition:opacity .3s;opacity:0}' +
    '#partyCanvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}' +
    'body>section,body>footer{position:relative;z-index:1}' +
    '.section-inner{backdrop-filter:saturate(1.04)}' +
    '@keyframes auroraMove{0%{transform:translate3d(-2%,-1%,0) scale(1)}50%{transform:translate3d(2%,2%,0) scale(1.05)}100%{transform:translate3d(-1%,3%,0) scale(1.02)}}' +
    '@keyframes auroraSpin{to{transform:rotate(360deg)}}' +
    '@media(prefers-reduced-motion:reduce){.party-aurora,.party-aurora:before,.party-aurora:after{animation:none}.party-glow{display:none}}' +
    '@media(max-width:700px){.party-glow{display:none}.party-aurora{filter:saturate(1.1)}}';
  document.head.appendChild(style);

  var aurora = document.createElement('div');
  aurora.className = 'party-aurora';
  document.body.prepend(aurora);

  var glow = document.createElement('div');
  glow.className = 'party-glow';
  document.body.appendChild(glow);

  var canvas = document.createElement('canvas');
  canvas.id = 'partyCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, mouse = { x: 0, y: 0, active: false };
  var colors = ['#e2231a', '#1f5fd6', '#28a745', '#ffc72c', '#7b2fd6'];
  var parts = [];

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function particle(burst, x, y) {
    return {
      x: burst ? x : Math.random() * w,
      y: burst ? y : Math.random() * h,
      vx: burst ? (Math.random() - .5) * 5 : (Math.random() - .5) * .22,
      vy: burst ? (Math.random() - .7) * 5 : -.12 - Math.random() * .25,
      size: burst ? 4 + Math.random() * 6 : 2 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .05,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: burst ? .9 : .18 + Math.random() * .25,
      life: burst ? 80 + Math.random() * 35 : 9999,
      shape: Math.random() > .45 ? 'rect' : 'dot'
    };
  }
  function seed() {
    parts = [];
    var count = mobile ? 18 : 42;
    for (var i = 0; i < count; i++) parts.push(particle(false));
  }
  function draw(p) {
    ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha); ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      if (mouse.active && p.life > 500) {
        p.x += (mouse.x - w / 2) * .00004 * p.size;
        p.y += (mouse.y - h / 2) * .00003 * p.size;
      }
      p.x += p.vx; p.y += p.vy; p.rot += p.spin;
      if (p.life < 500) { p.vy += .045; p.vx *= .99; p.alpha -= .009; p.life--; }
      if (p.y < -20 && p.life > 500) p.y = h + 20;
      if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
      if (p.life <= 0 || p.alpha <= 0) parts.splice(i, 1); else draw(p);
    }
    requestAnimationFrame(frame);
  }

  resize(); seed();
  window.addEventListener('resize', function () { resize(); seed(); });
  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; glow.style.opacity = '1';
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { mouse.active = false; glow.style.opacity = '0'; });
  window.addEventListener('pointerdown', function (e) {
    if (reduce || e.target.closest('input,textarea,select')) return;
    for (var i = 0; i < (mobile ? 8 : 15); i++) parts.push(particle(true, e.clientX, e.clientY));
  }, { passive: true });
  if (!reduce) frame();
})();

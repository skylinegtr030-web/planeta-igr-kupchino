/* Planeta Igr — branded interactive space background. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var style = document.createElement('style');
  style.textContent =
    'body{isolation:isolate;background:#f7f8fc}' +
    '.pi-space{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:radial-gradient(circle at 50% 0%,#fff 0,#f7f8fc 58%,#eef2ff 100%)}' +
    '.pi-space:before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(17,26,59,.11) 1.2px,transparent 1.3px);background-size:34px 34px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 92%)}' +
    '.pi-orbit{position:absolute;border:2px dashed rgba(31,95,214,.10);border-radius:50%;transform:rotate(var(--r))}' +
    '.pi-orbit.o1{width:72vw;height:34vw;left:-24vw;top:8vh;--r:-18deg}' +
    '.pi-orbit.o2{width:68vw;height:30vw;right:-28vw;top:40vh;--r:20deg}' +
    '.pi-orbit.o3{width:48vw;height:20vw;left:28vw;bottom:-14vw;--r:-5deg}' +
    '.pi-planet{position:absolute;width:var(--s);height:var(--s);left:var(--x);top:var(--y);border-radius:50%;background:var(--c);box-shadow:inset -16px -16px 28px rgba(17,26,59,.16),inset 10px 10px 18px rgba(255,255,255,.42),0 14px 34px rgba(17,26,59,.14);transform:translate3d(var(--mx,0),var(--my,0),0);transition:transform .18s ease-out}' +
    '.pi-planet:before{content:"";position:absolute;left:16%;top:15%;width:24%;height:18%;border-radius:50%;background:rgba(255,255,255,.42);transform:rotate(-22deg)}' +
    '.pi-planet.ring:after{content:"";position:absolute;left:-28%;top:34%;width:150%;height:32%;border:5px solid var(--ring);border-radius:50%;transform:rotate(-18deg);box-shadow:0 3px 9px rgba(17,26,59,.12)}' +
    '.pi-star{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);background:var(--c);clip-path:polygon(50% 0,61% 36%,100% 50%,61% 64%,50% 100%,39% 64%,0 50%,39% 36%);opacity:.75;animation:piTwinkle var(--t) ease-in-out infinite alternate}' +
    '.pi-confetti{position:absolute;left:var(--x);top:var(--y);width:8px;height:18px;border-radius:4px;background:var(--c);opacity:.4;transform:rotate(var(--r));animation:piFloat var(--t) ease-in-out infinite alternate}' +
    '.pi-comet{position:fixed;width:11px;height:11px;border-radius:50%;z-index:2;pointer-events:none;background:var(--c);box-shadow:0 0 0 5px rgba(255,255,255,.8),0 0 24px var(--c);animation:piComet .85s ease-out forwards}' +
    '.pi-comet:after{content:"";position:absolute;right:7px;top:4px;width:55px;height:3px;border-radius:4px;background:linear-gradient(90deg,transparent,var(--c))}' +
    '@keyframes piTwinkle{from{transform:scale(.65) rotate(0);opacity:.28}to{transform:scale(1.18) rotate(22deg);opacity:.9}}' +
    '@keyframes piFloat{from{transform:translateY(-8px) rotate(var(--r))}to{transform:translateY(14px) rotate(calc(var(--r) + 35deg))}}' +
    '@keyframes piComet{to{transform:translate(110px,-90px) scale(.15);opacity:0}}' +
    '@media(max-width:700px){.pi-planet{transform:scale(.72) translate3d(var(--mx,0),var(--my,0),0)}.pi-orbit{opacity:.55}.pi-confetti:nth-of-type(2n){display:none}}' +
    '@media(prefers-reduced-motion:reduce){.pi-star,.pi-confetti,.pi-comet{animation:none}.pi-planet{transition:none}}';
  document.head.appendChild(style);

  var scene = document.createElement('div');
  scene.className = 'pi-space';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = '<i class="pi-orbit o1"></i><i class="pi-orbit o2"></i><i class="pi-orbit o3"></i>';
  document.body.prepend(scene);

  var colors = ['#e2231a','#1f5fd6','#28a745','#ffc72c','#7b2fd6'];
  var planets = [
    {x:'2%',y:'10%',s:'82px',c:'#ffc72c',ring:true,d:1.15},
    {x:'91%',y:'13%',s:'108px',c:'#1f5fd6',ring:true,d:.9},
    {x:'-2%',y:'43%',s:'96px',c:'#e2231a',ring:false,d:.75},
    {x:'94%',y:'58%',s:'88px',c:'#28a745',ring:false,d:1.25},
    {x:'7%',y:'78%',s:'58px',c:'#7b2fd6',ring:true,d:1.5},
    {x:'88%',y:'88%',s:'68px',c:'#ffc72c',ring:false,d:1.05}
  ];
  planets.forEach(function (p) {
    var el = document.createElement('i');
    el.className = 'pi-planet' + (p.ring ? ' ring' : '');
    el.style.cssText = '--x:'+p.x+';--y:'+p.y+';--s:'+p.s+';--c:'+p.c+';--ring:'+p.c+'88';
    el.dataset.depth = p.d;
    scene.appendChild(el);
  });

  for (var i = 0; i < 24; i++) {
    var star = document.createElement('i');
    star.className = 'pi-star';
    star.style.cssText = '--x:'+(3+Math.random()*94)+'%;--y:'+(4+Math.random()*92)+'%;--s:'+(7+Math.random()*10)+'px;--c:'+colors[i%colors.length]+';--t:'+(2.5+Math.random()*3)+'s';
    scene.appendChild(star);
  }
  for (var j = 0; j < 18; j++) {
    var bit = document.createElement('i');
    bit.className = 'pi-confetti';
    bit.style.cssText = '--x:'+(2+Math.random()*96)+'%;--y:'+(4+Math.random()*92)+'%;--c:'+colors[j%colors.length]+';--r:'+(Math.random()*180)+'deg;--t:'+(3+Math.random()*4)+'s';
    scene.appendChild(bit);
  }

  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      var nx = e.clientX / innerWidth - .5;
      var ny = e.clientY / innerHeight - .5;
      scene.querySelectorAll('.pi-planet').forEach(function (p) {
        var d = Number(p.dataset.depth || 1);
        p.style.setProperty('--mx', (-nx * 22 * d) + 'px');
        p.style.setProperty('--my', (-ny * 18 * d) + 'px');
      });
    }, {passive:true});
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest('input,textarea,select')) return;
      for (var k = 0; k < 4; k++) {
        var comet = document.createElement('i');
        comet.className = 'pi-comet';
        comet.style.left = (e.clientX + (Math.random()-.5)*26) + 'px';
        comet.style.top = (e.clientY + (Math.random()-.5)*26) + 'px';
        comet.style.setProperty('--c', colors[(k + Math.floor(Math.random()*colors.length)) % colors.length]);
        document.body.appendChild(comet);
        setTimeout(function (node) { return function () { node.remove(); }; }(comet), 950);
      }
    }, {passive:true});
  }
})();

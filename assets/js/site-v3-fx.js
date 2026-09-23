(function(){'use strict';
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches,MOB=matchMedia('(max-width: 760px)').matches;
var COL=['#e2231a','#1f5fd6','#ffc72c','#28a745','#ff5fa2','#8b5cf6'];
function burst(x,y,n){if(RM)return;for(var i=0;i<n;i++){var p=document.createElement('i'),a=Math.random()*6.283,d=40+Math.random()*110;p.className='spark';p.style.left=x+'px';p.style.top=y+'px';p.style.background=COL[i%COL.length];p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');document.body.appendChild(p);setTimeout(p.remove.bind(p),850)}}
function fit(c,x){var d=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);return[w,h]}
function loop(el,draw){var on=true,run=false;function f(ms){if(!on){run=false;return}draw(ms/1000);if(RM){run=false;return}requestAnimationFrame(f)}function kick(){if(!run){run=true;requestAnimationFrame(f)}}if('IntersectionObserver'in window)new IntersectionObserver(function(e){on=e[0].isIntersecting;if(on)kick()}).observe(el);kick();document.addEventListener('visibilitychange',function(){on=!document.hidden;if(on)kick()})}
function space(){var c=$('#space');if(!c)return;var x=c.getContext('2d'),s=fit(c,x),st=[];addEventListener('resize',function(){s=fit(c,x)});
for(var i=0;i<(MOB?70:160);i++)st.push({x:Math.random(),y:Math.random(),z:Math.random(),c:COL[i%4]});
loop(c,function(t){var w=s[0],h=s[1];x.clearRect(0,0,w,h);st.forEach(function(p){var py=((p.y*h-scrollY*p.z*.35-t*6*p.z)%h+h)%h;x.globalAlpha=.3+.7*Math.abs(Math.sin(t*.8+p.x*40));x.fillStyle=p.z>.82?p.c:'#fff';x.beginPath();x.arc(p.x*w,py,.5+p.z*1.8,0,7);x.fill()});x.globalAlpha=1})}
function planet(){var c=$('#planet');if(!c)return;var x=c.getContext('2d'),s=fit(c,x),mx=0,my=0,tx=0,ty=0,pulse=0,spinBoost=0;addEventListener('resize',function(){s=fit(c,x)});
var land=[];for(var i=0;i<16;i++)land.push({lon:Math.random()*6.283,lat:(Math.random()-.5)*2,r:.14+Math.random()*.2,c:['#2fbf55','#28a745','#ffc72c','#e2231a','#2fbf55'][i%5]});
var ic=['🎮','🔫','💡','🎈','🍭','🎂','🏆','🎁'];
addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5},{passive:true});
c.addEventListener('click',function(e){pulse=1;spinBoost=3;burst(e.clientX,e.clientY,30)});
function orbit(t,R,cx,cy,front){x.textAlign='center';x.textBaseline='middle';ic.forEach(function(e,i){var a=t*.4+i*6.283/ic.length,z=Math.sin(a);if((z>=0)!==front)return;var ox=Math.cos(a)*R*1.78,oy=z*R*.44,ro=-.3,px=cx+ox*Math.cos(ro)-oy*Math.sin(ro),py=cy+ox*Math.sin(ro)+oy*Math.cos(ro)+Math.sin(t*2+i)*5;x.globalAlpha=.5+.5*(z+1)/2;x.font=Math.round(R*(.2+.09*z))+'px serif';x.fillText(e,px,py)});x.globalAlpha=1}
function ring(R,cx,cy,back){x.save();x.translate(cx,cy);x.rotate(-.3);var a0=back?Math.PI:0,a1=back?2*Math.PI:Math.PI,g=x.createLinearGradient(-R*1.6,0,R*1.6,0);g.addColorStop(0,'rgba(255,199,44,.15)');g.addColorStop(.5,'rgba(255,199,44,.95)');g.addColorStop(1,'rgba(226,35,26,.3)');x.strokeStyle=g;x.lineWidth=R*.08;x.beginPath();x.ellipse(0,0,R*1.52,R*.36,0,a0,a1);x.stroke();x.lineWidth=R*.018;x.strokeStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(0,0,R*1.7,R*.41,0,a0,a1);x.stroke();x.restore()}
var spin=0,last=0;
loop(c,function(t){var w=s[0],h=s[1],dt=Math.min(.05,t-last||0);last=t;mx+=(tx-mx)*.05;my+=(ty-my)*.05;pulse*=.93;spinBoost*=.96;spin+=dt*(.25+spinBoost);
x.clearRect(0,0,w,h);var R=Math.min(w,h)*.27*(1+pulse*.1),cx=w/2+mx*30,cy=h/2+my*20+Math.sin(t)*6;
var gl=x.createRadialGradient(cx,cy,R*.85,cx,cy,R*1.7);gl.addColorStop(0,'rgba(90,160,255,'+(.45+pulse*.4)+')');gl.addColorStop(1,'rgba(90,160,255,0)');x.fillStyle=gl;x.beginPath();x.arc(cx,cy,R*1.7,0,7);x.fill();
orbit(t,R,cx,cy,false);ring(R,cx,cy,true);
x.save();x.beginPath();x.arc(cx,cy,R,0,7);x.clip();var sg=x.createRadialGradient(cx-R*.3,cy-R*.3,R*.1,cx,cy,R);sg.addColorStop(0,'#5fa6ff');sg.addColorStop(1,'#123a9c');x.fillStyle=sg;x.fillRect(cx-R,cy-R,2*R,2*R);
var sp=spin+mx*1.4;land.forEach(function(l){var lo=l.lon+sp,cz=Math.cos(lo);if(cz<-.15)return;var la=l.lat*.72+my*.3,px=cx+R*Math.sin(lo)*Math.cos(la),py=cy-R*Math.sin(la);x.fillStyle=l.c;x.globalAlpha=.92;x.beginPath();x.ellipse(px,py,l.r*R*Math.max(.1,cz)*Math.cos(la),l.r*R*.72,0,0,7);x.fill()});
x.globalAlpha=1;x.fillStyle='rgba(255,255,255,.4)';for(var k=0;k<5;k++){var lo2=k*1.3+sp*1.5,cz2=Math.cos(lo2);if(cz2>0){x.beginPath();x.ellipse(cx+R*Math.sin(lo2)*.92,cy+(k-2)*R*.33,R*.24*cz2,R*.05,0,0,7);x.fill()}}
var sh=x.createRadialGradient(cx-R*.45,cy-R*.5,R*.05,cx,cy,R*1.05);sh.addColorStop(0,'rgba(255,255,255,.55)');sh.addColorStop(.35,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,40,.6)');x.fillStyle=sh;x.fillRect(cx-R,cy-R,2*R,2*R);x.restore();
ring(R,cx,cy,false);orbit(t,R,cx,cy,true)})}
function balloons(){var layer=$('#balloons'),sc=$('#score'),n=0,goal=6,max=MOB?3:5;if(!layer||!sc)return;if(RM){sc.hidden=true;return}
function spawn(){if(document.hidden||layer.children.length>=max)return;var b=document.createElement('button');b.type='button';b.className='bl';b.setAttribute('aria-label','Лопнуть шарик');b.style.setProperty('--c',COL[Math.random()*COL.length|0]);b.style.left=(3+Math.random()*90)+'vw';var sz=.8+Math.random()*.5;b.style.width=60*sz+'px';b.style.height=76*sz+'px';b.style.animationDuration=(11+Math.random()*8)+'s,'+(2.4+Math.random()*2)+'s';
b.addEventListener('animationend',function(e){if(e.animationName==='rise')b.remove()});
b.addEventListener('click',function(){var r=b.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,20);b.remove();n++;sc.querySelector('b').textContent=Math.min(n,goal);sc.classList.add('bump');setTimeout(function(){sc.classList.remove('bump')},250);if(n===goal)win()});layer.appendChild(b)}
setInterval(spawn,2300);setTimeout(spawn,900)}
function win(){$('#winToast').hidden=false;for(var i=0;i<5;i++)setTimeout(function(){burst(Math.random()*innerWidth,innerHeight*(.2+Math.random()*.4),34)},i*180)}
function counters(){if(!('IntersectionObserver'in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var el=e.target,to=+el.dataset.count,t0=performance.now();(function st(now){var p=Math.min(1,(now-t0)/1500);el.textContent=Math.round(to*(1-Math.pow(1-p,3))).toLocaleString('ru-RU');if(p<1)requestAnimationFrame(st)})(t0)})});$$('[data-count]').forEach(function(el){if(RM)el.textContent=(+el.dataset.count).toLocaleString('ru-RU');else io.observe(el)})}
function lava(){var g=$('#lava');if(!g)return;var cols=MOB?8:12,cells=[];for(var i=0;i<cols*7;i++){var d=document.createElement('i');g.appendChild(d);cells.push(d)}g.style.setProperty('--cols',cols);
function light(d){d.style.setProperty('--c',COL[Math.random()*4|0]);d.classList.remove('on');void d.offsetWidth;d.classList.add('on')}
if(!RM)setInterval(function(){if(!document.hidden)light(cells[Math.random()*cells.length|0])},160);
g.closest('.zone').addEventListener('pointermove',function(e){var r=g.getBoundingClientRect(),cx=Math.floor((e.clientX-r.left)/r.width*cols),cy=Math.floor((e.clientY-r.top)/r.height*7),d=cells[cy*cols+cx];if(d&&!d.classList.contains('on'))light(d)})}
var THEMES={'#28a745':['jungle',['🌿','🦒','🐒']],'#ffc72c':['savanna',['🦁','☀️','🐘']],'#1f5fd6':['cyber',['🤖','⚡','🎮']],'#e2231a':['berry',['🎈','🧸','🍭']]};
function levels(){var g=$('#packGrid');if(!g)return;function apply(){$$('.card',g).forEach(function(c,i){if(c.dataset.lvl)return;c.dataset.lvl='1';var col=(c.style.getPropertyValue('--c')||'').trim().toLowerCase(),th=THEMES[col]||THEMES['#e2231a'];c.classList.add('lvl-'+th[0]);var d=document.createElement('div');d.className='deco';d.setAttribute('aria-hidden','true');d.innerHTML=th[1].map(function(e){return'<span>'+e+'</span>'}).join('');c.insertBefore(d,c.firstChild);var l=document.createElement('span');l.className='lvl';l.textContent='Уровень '+(i+1);c.appendChild(l)})}
new MutationObserver(apply).observe(g,{childList:true});apply()}
function rocket(){var c=$('#cart');if(!c)return;new MutationObserver(function(){if(!c.hidden){c.classList.remove('boost');void c.offsetWidth;c.classList.add('boost')}}).observe(c,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true})}
function fixTel(){$$('a[href^="tel:"]').forEach(function(a){var h=a.getAttribute('href').slice(4);if(/e\+/i.test(h)){var n=Number(h.replace(/^\+/,''));if(n)a.setAttribute('href','tel:+'+Math.round(n))}})}
function header(){var t=$('.top');if(!t)return;var f=function(){t.classList.toggle('scrolled',scrollY>40)};addEventListener('scroll',f,{passive:true});f()}
document.addEventListener('click',function(e){if(e.target.closest('[data-close-toast]'))$('#winToast').hidden=true;var p=e.target.closest('.pick');if(p){var r=p.getBoundingClientRect();burst(r.left+r.width/2,r.top,16)}});
document.addEventListener('DOMContentLoaded',function(){header();space();planet();balloons();counters();lava();levels();rocket();[600,1500,3500].forEach(function(ms){setTimeout(fixTel,ms)})});
})();

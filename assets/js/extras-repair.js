(function(){
'use strict';
function money(n){return Number(n).toLocaleString('ru-RU')+' ₽'}
function start(){
 var grid=document.getElementById('extrasGrid'); if(!grid)return;
 var st=document.createElement('style');
 st.textContent='#extrasGrid.extras{columns:auto!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important;gap:40px!important}#extrasGrid .extra-card{display:flex!important;flex-direction:column!important;margin:0!important;opacity:1!important;visibility:visible!important;transform:none!important;border-radius:20px!important;overflow:hidden!important;background:#fff!important}#extrasGrid .ec-media{display:block!important;width:100%!important;aspect-ratio:3/2!important;overflow:hidden!important;background:#eee!important}#extrasGrid .ec-media img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important}#extrasGrid .ec-body{display:block!important;flex:1!important;padding:20px 22px 24px!important;text-align:center!important}#extrasGrid .extra-price{font-size:1.28rem!important;font-weight:800!important;margin:8px 0!important}#extrasGrid .extra-hint{opacity:.65!important}#extras .section-inner{opacity:1!important;transform:none!important}@media(max-width:520px){#extrasGrid.extras{grid-template-columns:1fr!important;gap:22px!important}}';
 document.head.appendChild(st);
 fetch('/api/extras',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error(r.status);return r.json()}).then(function(d){
  if(!d.ok||!Array.isArray(d.extras))throw Error('bad data');
  grid.innerHTML=''; grid.classList.remove('fade-up');
  d.extras.forEach(function(e){
   var c=document.createElement('article');c.className='extra-card';c.dataset.slug=e.slug;
   var media=document.createElement('div');media.className='ec-media';
   var img=document.createElement('img');img.src='/'+String(e.photo_url||'').replace(/^\//,'');img.alt=e.title;img.loading='lazy';
   img.onerror=function(){media.innerHTML='<div style="height:100%;display:grid;place-items:center;font-size:56px;background:linear-gradient(135deg,'+(e.color1||'#28a745')+','+(e.color2||'#8fe3a6')+')">'+(e.emoji||'🎉')+'</div>'};
   media.appendChild(img);
   var body=document.createElement('div');body.className='ec-body';
   var h=document.createElement('h4');h.textContent=e.title;
   var p=document.createElement('div');p.className='extra-price';p.textContent=(e.price_from?'от ':'')+money(e.price);
   var m=document.createElement('div');m.className='extra-hint';m.textContent=(e.duration_min?e.duration_min+' мин':'')+(e.upto?' · '+e.upto:'');
   body.append(h,p,m);c.append(media,body);
   c.addEventListener('click',function(){if(typeof window.openExtraModalFromData==='function')window.openExtraModalFromData(e.slug,e);else if(typeof window.openExtraModal==='function')window.openExtraModal(e.slug)});
   grid.appendChild(c);
  });
 }).catch(function(err){console.error('extras repair',err)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

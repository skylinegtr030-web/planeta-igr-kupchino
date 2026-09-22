(function(){
'use strict';
function kill(){
 var q=document.getElementById('quest'); if(q&&q.parentNode)q.parentNode.removeChild(q);
 var links=document.querySelectorAll('a[href="#quest"]');
 for(var i=0;i<links.length;i++){if(links[i].parentNode)links[i].parentNode.removeChild(links[i]);}
 var sc=document.getElementById('balloonScore'); if(sc&&sc.parentNode)sc.parentNode.removeChild(sc);
 var bs=document.querySelectorAll('.balloon');
 for(var j=0;j<bs.length;j++){if(bs[j].parentNode)bs[j].parentNode.removeChild(bs[j]);}
 var p=document.getElementById('promoInput');
 if(p&&p.type!=='hidden'){
  var lab=document.querySelector('label[for="promoInput"]'); if(lab&&lab.parentNode)lab.parentNode.removeChild(lab);
  var err=document.getElementById('error-promo'); if(err&&err.parentNode)err.parentNode.removeChild(err);
  p.value=''; p.type='hidden';
 }
}
var st=document.createElement('style');
st.textContent='#quest,.balloon,.balloon-score,a[href="#quest"],label[for="promoInput"],#error-promo{display:none!important}';
document.head.appendChild(st);
function start(){[0,200,600,1200,2500,4000].forEach(function(t){setTimeout(kill,t);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.addEventListener('load',start);
})();

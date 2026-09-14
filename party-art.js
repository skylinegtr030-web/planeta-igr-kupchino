/* Static illustrated birthday motifs behind the page content. */
(function () {
  'use strict';
  var space = document.querySelector('.pi-space');
  if (!space || space.querySelector('.pi-art-layer')) return;
  if (window.innerWidth < 760) return;

  var style = document.createElement('style');
  style.textContent = '.pi-art-layer{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:url("party-art.svg?v=1");background-repeat:repeat-y;background-position:center top;background-size:1000px 1200px;opacity:.34;contain:paint}.pi-planet,.pi-orbit,.pi-confetti,.pi-sparkle{z-index:1}';
  document.head.appendChild(style);

  var layer = document.createElement('div');
  layer.className = 'pi-art-layer';
  layer.setAttribute('aria-hidden', 'true');
  space.insertBefore(layer, space.firstChild);
})();

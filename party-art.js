/* Large illustrated birthday motifs behind the page content. */
(function () {
  'use strict';
  var space = document.querySelector('.pi-space');
  if (!space || space.querySelector('.pi-art-layer')) return;
  var style = document.createElement('style');
  style.textContent = '.pi-art-layer{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:url("party-art.svg?v=1");background-repeat:repeat-y;background-position:center top;background-size:1000px 1200px;opacity:.42;mix-blend-mode:multiply;animation:piArtFloat 14s ease-in-out infinite alternate}.pi-planet,.pi-orbit,.pi-confetti,.pi-sparkle{z-index:1}@keyframes piArtFloat{from{background-position:center 0}to{background-position:center 28px}}@media(max-width:700px){.pi-art-layer{background-size:700px 840px;opacity:.3}}@media(prefers-reduced-motion:reduce){.pi-art-layer{animation:none}}';
  document.head.appendChild(style);
  var layer = document.createElement('div');
  layer.className = 'pi-art-layer';
  layer.setAttribute('aria-hidden', 'true');
  space.insertBefore(layer, space.firstChild);
})();

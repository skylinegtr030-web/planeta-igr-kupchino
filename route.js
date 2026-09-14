/* Detailed directions block inside the contacts section. */
(function () {
  'use strict';
  var contact = document.getElementById('contact');
  if (!contact || document.getElementById('routeBlock')) return;
  var inner = contact.querySelector('.section-inner');
  if (!inner) return;

  var style = document.createElement('style');
  style.textContent = '#routeBlock{margin-top:30px;background:rgba(255,255,255,.95);border-radius:22px;padding:28px 30px;box-shadow:0 12px 30px rgba(17,26,59,.09)}#routeBlock h3{font-size:1.35rem;margin-bottom:6px}#routeBlock .rt-address{font-weight:800;color:#42506e;margin-bottom:18px;font-size:1rem}#routeBlock .rt-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-bottom:22px}#routeBlock .rt-fact{background:#f7f8fc;border-radius:14px;padding:13px 15px}#routeBlock .rt-fact b{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.5px;color:#8a93ab;margin-bottom:3px}#routeBlock .rt-fact span{font-weight:800;color:#111a3b;font-size:.95rem}#routeBlock h4{font-size:1rem;margin:18px 0 8px}#routeBlock ol,#routeBlock ul{margin:0;padding-left:20px}#routeBlock li{font-weight:700;color:#42506e;font-size:.92rem;line-height:1.65;margin-bottom:4px}#routeBlock .rt-transport{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px 24px}#routeBlock .rt-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}#routeBlock .rt-links a{padding:12px 18px;border-radius:12px;background:#eef2ff;color:#1f5fd6;font-weight:900;font-size:.9rem;text-decoration:none;transition:transform .2s,background .2s}#routeBlock .rt-links a:hover{transform:translateY(-2px);background:#e1e8ff}@media(max-width:600px){#routeBlock{padding:22px 18px}}';
  document.head.appendChild(style);

  var block = document.createElement('div');
  block.id = 'routeBlock';
  block.innerHTML =
    '<h3>Как нас найти</h3>' +
    '<p class="rt-address">Санкт-Петербург, Балканская площадь, д. 5, литера Ю — ТРК «Балкания NOVA», 3-й этаж</p>' +
    '<div class="rt-facts">' +
      '<div class="rt-fact"><b>Этаж</b><span>3-й, за катком</span></div>' +
      '<div class="rt-fact"><b>Ориентир</b><span>Каток и кинотеатр</span></div>' +
      '<div class="rt-fact"><b>От метро</b><span>Купчино, 5–7 минут</span></div>' +
      '<div class="rt-fact"><b>Режим работы</b><span>Ежедневно 10:00–22:00</span></div>' +
    '</div>' +
    '<h4>Пешком от метро «Купчино»</h4>' +
    '<ol>' +
      '<li>Выход из метро общий с железнодорожной станцией «Купчино».</li>' +
      '<li>Из вестибюля поверните направо в сторону Балканской площади.</li>' +
      '<li>Пройдите около 200 метров до торгового комплекса.</li>' +
      '<li>Зайдите в корпус «Балкания NOVA» (литера Ю) через главный вход со стороны площади.</li>' +
      '<li>Поднимитесь на 3-й этаж на эскалаторе или лифте.</li>' +
      '<li>Идите на звук игровой зоны: «Планета Игр» находится рядом с катком.</li>' +
    '</ol>' +
    '<h4>На наземном транспорте</h4>' +
    '<div class="rt-transport">' +
      '<ul><li>Автобусы: 50, 53, 54, 56, 74, 96, 157, 159, 326</li><li>Троллейбусы: 39, 47</li></ul>' +
      '<ul><li>Трамваи: 25, 43, 45, 62</li><li>Остановка — конечная на Балканской площади</li></ul>' +
    '</div>' +
    '<h4>На машине и на электричке</h4>' +
    '<ul>' +
      '<li>У комплекса есть большая бесплатная парковка.</li>' +
      '<li>Со стороны Витебского проспекта к площади ведёт подземный переход.</li>' +
      '<li>С южных пригородов удобно приехать электричкой до станции «Купчино».</li>' +
    '</ul>' +
    '<div class="rt-links">' +
      '<a href="https://yandex.ru/maps/?rtext=~59.827415%2C30.379199&rtt=mt" target="_blank" rel="noopener noreferrer">Маршрут в Яндекс Картах</a>' +
      '<a href="https://2gis.ru/spb/firm/5348552839303655" target="_blank" rel="noopener noreferrer">Открыть в 2ГИС</a>' +
      '<a href="tel:+79818180134">Позвонить нам</a>' +
    '</div>';

  inner.appendChild(block);
})();

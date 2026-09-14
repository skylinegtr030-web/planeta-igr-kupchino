/* Concise, natural copy for the public-facing page. */
(function () {
  'use strict';

  function text(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function polish() {
    document.title = 'Детский день рождения в Купчино | Планета Игр';
    var description = document.querySelector('meta[name="description"]');
    if (description) description.content = 'Детские праздники в Купчино: банкетные комнаты, аниматоры, шоу, квесты, Кузар и Лава-пол.';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = 'Детский день рождения в Купчино | Планета Игр';
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = 'Комнаты для праздника, аниматоры, шоу, квесты, Кузар и Лава-пол в ТРК «Балкания Nova».';

    var heroTitle = document.querySelector('#hero h1');
    if (heroTitle) heroTitle.innerHTML = 'Детский день рождения <span>в Купчино</span>';
    text('#hero .hero-grid > div:first-child > p', 'Комнаты «Джунгли» и «Лофт», аниматоры, шоу, Кузар и Лава-пол — всё на одной площадке.');
    var gameHint = document.querySelector('#hero .hero-grid > div:first-child > p[style*="margin-top"]');
    if (gameHint) gameHint.style.display = 'none';

    text('#rooms .section-inner > p:not(.room-note)', 'Две комнаты на выбор: «Джунгли» для малышей и «Лофт» для детей постарше.');
    text('#prices h2', 'Пакеты для дня рождения');
    text('#prices .section-inner > p', 'Выберите готовый пакет или соберите праздник из отдельных услуг.');

    var activities = document.querySelectorAll('#activities .activity p');
    if (activities[0]) activities[0].textContent = 'Командный лазертаг в неоновом лабиринте. Для детей от 8 лет.';
    if (activities[1]) activities[1].textContent = 'Интерактивный светящийся пол с играми на скорость и реакцию.';

    text('#extras .section-inner > p', 'Аниматоры, квесты, шоу и мастер-классы — добавьте то, что понравится ребёнку.');
    text('#quest h2', 'Три вопроса — скидка 10%');
    text('#quest .section-inner > p', 'Ответьте на три вопроса и получите промокод для заявки.');

    var contactText = document.querySelectorAll('#contact .form-box > p');
    if (contactText[0]) contactText[0].textContent = 'Есть вопросы?';
    if (contactText[1]) contactText[1].textContent = 'Оставьте заявку — перезвоним, поможем выбрать программу и посчитаем стоимость.';
    text('#orderModal .order-box > p', 'Мы позвоним, чтобы подтвердить дату, время и состав программы.');

    text('#reviews h2', 'Отзывы гостей · 4,8 ★ в 2ГИС');
    document.querySelectorAll('.pg-review-source').forEach(function (node) {
      node.textContent = 'Отзыв в 2ГИС';
    });

    try {
      if (typeof EXTRAS !== 'undefined') {
        var extraCopy = {
          animator:'Аниматор проведёт игры и конкурсы. Продолжительность — 1 час.',
          quest:'Четыре сюжета на выбор. Продолжительность — около 40 минут.',
          masterclass:'Пять творческих мастер-классов для детей от 4 лет.',
          sciShow:'Научное шоу на выбор: крио, эксперименты или Тесла-шоу.',
          bubbles:'Шоу мыльных пузырей с участием детей.',
          pinata:'Пиньята со сладостями внутри.',
          qzar:'Командная игра в лазертаг.',
          lavaFloor:'Игра на интерактивном светящемся полу.',
          unlimitedTicket:'Безлимитный билет в игровую зону на весь день.',
          invite:'Печатные приглашения для гостей.',
          tables:'Дополнительный стол для большой компании.',
          balloonFountain:'Фонтан из десяти воздушных шаров.',
          surpriseBalloon:'Большой шар с маленькими шарами внутри.',
          serving:'Одноразовая праздничная сервировка стола.'
        };
        Object.keys(extraCopy).forEach(function (key) {
          if (EXTRAS[key]) EXTRAS[key].desc = extraCopy[key];
        });
      }
    } catch (error) {}
  }

  polish();
  var attempts = 0;
  var timer = setInterval(function () {
    polish();
    attempts++;
    if (attempts >= 12) clearInterval(timer);
  }, 500);
})();

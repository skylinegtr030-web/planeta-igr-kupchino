window.PLANETA_CONFIG = {
  sheetWebhookUrl:
    'https://script.google.com/macros/s/AKfycbxyNdqz_-U_DDZRGyIF-2y_sITJwBbsH7Q5CHRtBs2e8lMFGB532Ne10q99xbeRi4m9Vw/exec'
};

var siteUiFixes = document.createElement('style');
siteUiFixes.textContent =
  '#prices .pack{opacity:1!important;width:auto!important}' +
  'header .logo{gap:11px;text-decoration:none;color:#111a3b}' +
  'header .logo-img{width:46px;height:46px;display:block;border-radius:50%;object-fit:cover;background:#fff;border:2px solid #fff;box-shadow:0 5px 16px rgba(17,26,59,.18);transition:transform .25s,box-shadow .25s}' +
  'header .logo:hover .logo-img{transform:scale(1.06) rotate(-2deg);box-shadow:0 8px 22px rgba(17,26,59,.24)}' +
  '@media(max-width:600px){header .logo-img{width:40px;height:40px}header .logo{font-size:1.1rem}}';
document.head.appendChild(siteUiFixes);

document.addEventListener('DOMContentLoaded', function () {
  var logo = document.querySelector('header .logo');
  if (logo) {
    var link = document.createElement('a');
    link.className = 'logo';
    link.href = '#hero';
    link.setAttribute('aria-label', 'Планета Игр — к началу страницы');
    link.innerHTML = '<img class="logo-img" src="ff3b350d-00e4-4dfe-83cb-491fb9e1f366.jpeg" alt="Логотип Планета Игр"><span>Планета Игр</span>';
    logo.replaceWith(link);
  }
  var bg = document.createElement('script');
  bg.src = 'background.js?v=1';
  document.head.appendChild(bg);
});

window.addEventListener('load', function () {
  var s = document.createElement('script');
  s.src = 'programs.js?v=1';
  s.onload = function () {
    var c = document.createElement('script');
    c.src = 'covers.js?v=3';
    c.onload = function () {
      var p = document.createElement('script');
      p.src = 'packages.js?v=3';
      p.onload = function () {
        document.querySelectorAll('#prices .pack').forEach(function (card) {
          card.classList.add('show');
          card.style.opacity = '1';
          card.style.width = 'auto';
        });
      };
      document.head.appendChild(p);
    };
    document.head.appendChild(c);
  };
  document.head.appendChild(s);
});

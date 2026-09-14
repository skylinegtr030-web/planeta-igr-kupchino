window.PLANETA_CONFIG = {
  sheetWebhookUrl:
    'https://script.google.com/macros/s/AKfycbxyNdqz_-U_DDZRGyIF-2y_sITJwBbsH7Q5CHRtBs2e8lMFGB532Ne10q99xbeRi4m9Vw/exec'
};

/* New package cards are created after the original IntersectionObserver runs. */
var packageVisibilityFix = document.createElement('style');
packageVisibilityFix.textContent = '#prices .pack{opacity:1!important;width:auto!important}';
document.head.appendChild(packageVisibilityFix);

window.addEventListener('load', function () {
  var s = document.createElement('script');
  s.src = 'programs.js?v=1';
  s.onload = function () {
    var c = document.createElement('script');
    c.src = 'covers.js?v=3';
    c.onload = function () {
      var p = document.createElement('script');
      p.src = 'packages.js?v=2';
      document.head.appendChild(p);
    };
    document.head.appendChild(c);
  };
  document.head.appendChild(s);
});

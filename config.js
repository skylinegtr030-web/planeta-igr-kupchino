window.PLANETA_CONFIG = {
  sheetWebhookUrl:
    'https://script.google.com/macros/s/AKfycbxyNdqz_-U_DDZRGyIF-2y_sITJwBbsH7Q5CHRtBs2e8lMFGB532Ne10q99xbeRi4m9Vw/exec'
};

/* Programme cards module: SVG covers and themed effects.
   Loaded after window.load so it overrides the basic renderer from validation.js.
   covers.js runs right after and swaps the SVG covers for real artwork. */
window.addEventListener('load', function () {
  var s = document.createElement('script');
  s.src = 'programs.js?v=1';
  s.onload = function () {
    var c = document.createElement('script');
    c.src = 'covers.js?v=1';
    document.head.appendChild(c);
  };
  document.head.appendChild(s);
});

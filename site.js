/* Fills the pages from config.js. */
(function () {
  var C = window.HIREBEE || {};
  var bot = (C.botUsername || '').replace(/^@/, '');
  var botUrl = bot ? 'https://t.me/' + bot : '';
  document.querySelectorAll('[data-bot]').forEach(function (a) {
    var start = a.getAttribute('data-bot');
    if (botUrl) a.href = botUrl + (start ? '?start=' + encodeURIComponent(start) : '');
    else a.setAttribute('aria-disabled', 'true');
  });
  document.querySelectorAll('[data-bot-name]').forEach(function (el) { el.textContent = bot ? '@' + bot : 'the HireBee bot'; });
  document.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = '$' + (C.prices || {})[el.getAttribute('data-price')]; });
  document.querySelectorAll('[data-stars]').forEach(function (el) { el.textContent = (C.stars || {})[el.getAttribute('data-stars')]; });
  document.querySelectorAll('[data-days]').forEach(function (el) { el.textContent = C.days || 30; });
  document.querySelectorAll('[data-owner]').forEach(function (el) { el.textContent = C.owner || ''; });
  document.querySelectorAll('[data-updated]').forEach(function (el) { el.textContent = C.updated || ''; });
  document.querySelectorAll('[data-email]').forEach(function (el) {
    if (!C.contactEmail) { el.textContent = '(email coming soon)'; return; }
    el.textContent = C.contactEmail;
    if (el.tagName === 'A') el.href = 'mailto:' + C.contactEmail;
  });
  document.querySelectorAll('[data-phone]').forEach(function (el) {
    if (!C.contactPhone) { (el.closest('[data-phone-row]') || el).remove(); return; }
    el.textContent = C.contactPhone;
    if (el.tagName === 'A') el.href = 'tel:' + C.contactPhone.replace(/[^+\d]/g, '');
  });
  document.querySelectorAll('[data-if]').forEach(function (el) { if (!C[el.getAttribute('data-if')]) el.remove(); });
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  // Reminder for you while setting up (only shows if something important is missing)
  var missing = [];
  if (!bot) missing.push('botUsername');
  if (!C.contactEmail) missing.push('contactEmail');
  if (missing.length) {
    var b = document.createElement('div');
    b.className = 'setup';
    b.textContent = 'Setup: fill in ' + missing.join(' and ') + ' in config.js before sharing this site.';
    document.body.insertBefore(b, document.body.firstChild);
  }
})();

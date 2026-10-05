/* Cookie consent banner for Google Consent Mode v2.
   The default (denied) state is set by the small inline script that sits before the
   GTM snippet in every page <head>. This file shows the banner, stores the choice in
   localStorage ("lime_consent") and sends the update to GTM. */
(function () {
  'use strict';
  var KEY = 'lime_consent';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function gpc() { return navigator.globalPrivacyControl === true; }

  function push(c) {
    var a = c.analytics ? 'granted' : 'denied';
    var m = (c.marketing && !gpc()) ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m
    });
    window.dataLayer.push({ event: 'lime_consent_update', consent_analytics: a, consent_marketing: m });
  }

  function save(c) {
    c.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    push(c);
  }

  var css = '' +
    '#limeCookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;max-width:760px;margin:0 auto;' +
    'background:#0b0f16;color:#f3f4f6;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'font-size:13px;line-height:1.55;display:none}' +
    '#limeCookie.on{display:block}' +
    '#limeCookie h2{margin:0 0 6px;font-size:15px;font-weight:700;color:#fff}' +
    '#limeCookie p{margin:0 0 12px;color:#cfd3da}' +
    '#limeCookie a{color:#ff6b70;text-decoration:underline}' +
    '#limeCookie .lc-row{display:flex;flex-wrap:wrap;gap:8px}' +
    '#limeCookie button{font:inherit;font-weight:600;border-radius:999px;padding:10px 18px;cursor:pointer;border:1px solid transparent}' +
    '#limeCookie .lc-acc{background:#ED3237;color:#fff}' +
    '#limeCookie .lc-rej{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}' +
    '#limeCookie .lc-cus{background:transparent;color:#cfd3da;border-color:transparent;text-decoration:underline}' +
    '#limeCookie .lc-opts{display:none;margin:0 0 12px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px}' +
    '#limeCookie.cust .lc-opts{display:block}' +
    '#limeCookie label{display:flex;gap:10px;align-items:flex-start;margin:0 0 8px;cursor:pointer}' +
    '#limeCookie input{margin-top:3px;accent-color:#ED3237}' +
    '#limeCookie small{display:block;color:#9aa1ad}' +
    '@media(max-width:600px){#limeCookie{left:10px;right:10px;bottom:10px;padding:16px}#limeCookie button{flex:1 1 auto}}';

  var el;
  function build() {
    if (el) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div');
    el.id = 'limeCookie';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie preferences');
    el.innerHTML =
      '<h2>Your cookie choices</h2>' +
      '<p>We use essential cookies to run this site. With your permission we also use analytics and marketing cookies to improve it and measure our ads. ' +
      'You can change your mind any time. <a href="/privacy-policy#cookies">Cookie policy</a></p>' +
      '<div class="lc-opts">' +
      '<label><input type="checkbox" checked disabled><span><strong>Essential</strong><small>Needed for forms, security and basic site features. Always on.</small></span></label>' +
      '<label><input type="checkbox" id="lcAn"><span><strong>Analytics</strong><small>Helps us see which pages work, so we can improve them.</small></span></label>' +
      '<label><input type="checkbox" id="lcMk"><span><strong>Marketing</strong><small>Lets us measure ads and show relevant ads on other sites.</small></span></label>' +
      '</div>' +
      '<div class="lc-row">' +
      '<button type="button" class="lc-acc" data-a="all">Accept all</button>' +
      '<button type="button" class="lc-rej" data-a="none">Reject non-essential</button>' +
      '<button type="button" class="lc-cus" data-a="cust">Customise</button>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'all') { save({ analytics: true, marketing: true }); hide(); }
      else if (a === 'none') { save({ analytics: false, marketing: false }); hide(); }
      else if (a === 'cust') {
        if (el.classList.contains('cust')) {
          save({ analytics: el.querySelector('#lcAn').checked, marketing: el.querySelector('#lcMk').checked }); hide();
        } else {
          el.classList.add('cust'); b.textContent = 'Save choices';
          b.className = 'lc-acc'; b.style.textDecoration = 'none';
        }
      }
    });
  }
  function show(open) {
    build();
    var c = read() || {};
    el.querySelector('#lcAn').checked = !!c.analytics;
    el.querySelector('#lcMk').checked = !!c.marketing && !gpc();
    el.classList.add('on');
    if (open) {
      el.classList.add('cust');
      var b = el.querySelector('[data-a="cust"]'); b.textContent = 'Save choices'; b.className = 'lc-acc';
    }
  }
  function hide() { if (el) { el.classList.remove('on'); el.classList.remove('cust'); } }

  function init() {
    var c = read();
    if (c) { push(c); } else { show(false); }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); show(true); }
    });
  }
  window.LimeConsent = { open: function () { show(true); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

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

  function push(c) {
    var a = c.analytics ? 'granted' : 'denied';
    var m = c.marketing ? 'granted' : 'denied';
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
      '<h2>Cookies and tracking</h2>' +
      '<p>We use cookies and tracking tools, including analytics and advertising pixels, to run this site, improve it and measure our ads. ' +
      'By clicking Accept you agree to all of them. <a href="/privacy-policy#cookies">Cookie policy</a></p>' +
      '<div class="lc-row"><button type="button" class="lc-acc">Accept</button></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (!e.target.closest('.lc-acc')) return;
      save({ analytics: true, marketing: true });
      hide();
    });
  }
  function show() { build(); el.classList.add('on'); }
  function hide() { if (el) el.classList.remove('on'); }

  function init() {
    var c = read();
    if (c) { push(c); } else { show(); }
  }
  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

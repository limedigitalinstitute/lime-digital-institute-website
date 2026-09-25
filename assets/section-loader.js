/* Lime Digital Institute — Global Sections loader.
   Drop <div data-global-section="section-name"></div> anywhere on any page
   and this script fills it in from the backend at /data/sections/<name>.json.
   Edit that section once in /lime-admin (Global Sections tab) and every page
   that references it updates together — no per-page copy/paste.

   To add a new reusable section TYPE (not just a new use of an existing one):
   add a render function to RENDERERS below, keyed by the section's "type"
   field, then create data/sections/<name>.json with that type. */
(function () {
  'use strict';

  var RENDERERS = {
    'raw-html': function (data) {
      return data.html || '';
    },
    'video-testimonials': function (data) {
      var items = Array.isArray(data.items) ? data.items : [];
      var cards = items.map(function (v) {
        var alt = (v.name || '') + (v.role ? ' - ' + v.role : '');
        return (
          '<div class="lid-video-card">' +
            '<img src="' + v.photo + '" alt="' + alt.replace(/"/g, '&quot;') + '" class="lid-video-poster" loading="lazy">' +
            '<div class="lid-play-pill">&#9654; Watch Video</div>' +
          '</div>'
        );
      }).join('');

      return (
        '<div class="lid-testi-head">' +
          '<h2>' + (data.heading || '') + '</h2>' +
          '<p>' + (data.subhead || '') + '</p>' +
        '</div>' +
        '<div class="lid-video-carousel-wrap">' +
          '<div class="lid-video-grid">' + cards + '</div>' +
          '<button type="button" class="lid-carousel-arrow lid-carousel-prev" onclick="limeScrollCarousel(this,-1)" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>' +
          '<button type="button" class="lid-carousel-arrow lid-carousel-next" onclick="limeScrollCarousel(this,1)" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>' +
        '</div>' +
        '<div class="lid-video-cta-wrap">' +
          '<a href="#book-seat" class="btn btn-primary open-modal-btn" data-course="Free Trial Class">Start Your 3-Day Trial</a>' +
        '</div>'
      );
    }
  };

  // Shared by every page that renders a video-testimonials carousel — scrolls
  // the track by one card. Defined globally so inline onclick handlers work
  // regardless of how the markup was injected.
  window.limeScrollCarousel = function (btn, dir) {
    var wrap = btn.closest('.lid-video-carousel-wrap');
    var track = wrap && wrap.querySelector('.lid-video-grid');
    if (!track) return;
    var card = track.querySelector('.lid-video-card');
    var amount = card ? card.getBoundingClientRect().width + 12 : 220;
    track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  var placeholders = document.querySelectorAll('[data-global-section]');
  if (!placeholders.length) return;

  var base = window.location.pathname.indexOf('/lime-admin') === 0 ? '../api' : 'api';
  var names = Array.from(new Set(Array.from(placeholders).map(function (el) {
    return el.getAttribute('data-global-section');
  })));

  names.forEach(function (name) {
    fetch(base + '/sections?name=' + encodeURIComponent(name))
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (res) {
        if (!res || !res.success || !res.section) return;
        var renderer = RENDERERS[res.section.type];
        if (!renderer) return;
        var html = renderer(res.section);
        document.querySelectorAll('[data-global-section="' + name + '"]').forEach(function (el) {
          el.innerHTML = html;
        });
      })
      .catch(function () { /* placeholder stays empty — page still loads fine */ });
  });
})();

/* Lime Digital Institute — Sections CMS loader.
   Any element with data-cms="page.key" gets its text replaced with the
   admin-saved value, if one exists. No saved value = static HTML stays,
   so the page always renders correctly even if this script or the API fails. */
(function () {
  'use strict';
  var page = document.body.getAttribute('data-cms-page');
  if (!page) return;

  var base = window.location.pathname.indexOf('/lime-admin') === 0 ? '../api' : 'api';

  fetch(base + '/content?page=' + encodeURIComponent(page))
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.success || !data.content) return;
      Object.keys(data.content).forEach(function (key) {
        var value = data.content[key];
        if (value === null || value === undefined || value === '') return;
        document.querySelectorAll('[data-cms="' + key + '"]').forEach(function (el) {
          el.textContent = value;
        });
      });
    })
    .catch(function () { /* static HTML already on the page — nothing to do */ });
})();

<?php
// Public course brochure page. Not indexed by search engines.
// The page body lives in _private/ (blocked from direct access).
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, max-age=0');
readfile(__DIR__ . '/_private/brochure-page.html');

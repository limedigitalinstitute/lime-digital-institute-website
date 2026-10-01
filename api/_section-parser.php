<?php
// Shared byte-exact <section> block parser, used by every admin endpoint that
// edits page HTML directly (reorder-section.php, promote-to-global.php,
// edit-section.php). Keeping this in one place means the boundary-detection
// logic — the part most likely to have a subtle bug — only has to be correct
// once, not separately in every endpoint.

// Whitelist of page keys -> real file path, so a request body can never point
// these endpoints at an arbitrary file on disk. Keep in sync with PAGES_MAP
// in lime-admin/admin.js.
function lime_page_files() {
    return [
        'homepage' => 'index.html',
        'about' => 'about.html',
        'courses' => 'courses.html',
        'foundation-program' => 'foundation-program.html',
        'digital-marketing-professional' => 'digital-marketing-professional.html',
        'bachelors-in-digital-business' => 'bachelors-in-digital-business.html',
        'masters-in-digital-business' => 'masters-in-digital-business.html',
        'case-studies' => 'case-studies.html',
        'placements' => 'placements.html',
        'hire-from-us' => 'hire-from-us.html',
        'trainers' => 'trainers.html',
        'student-life' => 'student-life.html',
        'alumni' => 'alumni.html',
        'reviews' => 'reviews.html',
        'blog' => 'blog.html',
        'contact' => 'contact.html',
        'refer-earn' => 'refer-earn.html',
        'free-masterclass' => 'masterclass.html',
        'event' => 'event.html',
        '3-day-demo-class' => '3-day-demo-class.html',
        'thank-you' => 'thank-you.html',
        'event-thank-you' => 'event-thank-you.html',
    ];
}

// --- Locate every TOP-LEVEL <section>...</section> block in the file. ---
// A "block" is: the gap text right after the previous block (whitespace,
// HTML comments) + the section tag itself + its content, up to the matching
// </section>. Depth tracking means a <section> nested inside another one is
// absorbed into its parent's block instead of being treated as a sibling.
function find_top_level_sections($html) {
    $blocks = [];
    $offset = 0;
    $cursor = 0; // end of the previously closed top-level block

    while (preg_match('/<section\b/i', $html, $m, PREG_OFFSET_CAPTURE, $offset)) {
        $tagStart = $m[0][1];
        $depth = 1;
        $scan = $tagStart + strlen($m[0][0]);
        $endOfBlock = null;

        while (preg_match('/<section\b|<\/section\s*>/i', $html, $m2, PREG_OFFSET_CAPTURE, $scan)) {
            $isClose = (stripos($m2[0][0], '/') !== false);
            $pos = $m2[0][1];
            $tokLen = strlen($m2[0][0]);
            if ($isClose) {
                $depth--;
                if ($depth === 0) {
                    $endOfBlock = $pos + $tokLen;
                    break;
                }
            } else {
                $depth++;
            }
            $scan = $pos + $tokLen;
        }

        if ($endOfBlock === null) {
            // Unbalanced tags somewhere — bail out, caller treats this as failure.
            return null;
        }

        $idMatch = null;
        preg_match('/<section\b[^>]*\bid=["\']([a-zA-Z0-9\-]+)["\']/i', substr($html, $tagStart, $endOfBlock - $tagStart), $idm);
        $id = isset($idm[1]) ? $idm[1] : null;

        $blocks[] = [
            'gap' => substr($html, $cursor, $tagStart - $cursor),
            'html' => substr($html, $tagStart, $endOfBlock - $tagStart),
            'id' => $id,
        ];

        $cursor = $endOfBlock;
        $offset = $endOfBlock;
    }

    return ['blocks' => $blocks, 'tail' => substr($html, $cursor)];
}

// Splits one block's full HTML ("<section ...>INNER</section>") into its
// opening tag, inner content, and closing tag. The opening tag is assumed to
// have no literal ">" inside an attribute value (true for every section tag
// in this codebase — plain class/id/style attributes only).
function split_section_block($blockHtml) {
    $openEnd = strpos($blockHtml, '>');
    if ($openEnd === false) return null;
    $openTag = substr($blockHtml, 0, $openEnd + 1);

    if (!preg_match('/<\/section\s*>\s*$/i', $blockHtml, $m, PREG_OFFSET_CAPTURE)) return null;
    $closeStart = $m[0][1];
    $closeTag = substr($blockHtml, $closeStart);

    $inner = substr($blockHtml, $openEnd + 1, $closeStart - ($openEnd + 1));
    return ['openTag' => $openTag, 'inner' => $inner, 'closeTag' => $closeTag];
}

// Finds the top-level section with the given id in $html. Returns the parsed
// blocks array plus the matched index, or null if not found / unparsable.
function find_section_by_id($html, $sectionId) {
    $parsed = find_top_level_sections($html);
    if ($parsed === null) return null;
    foreach ($parsed['blocks'] as $i => $b) {
        if ($b['id'] === $sectionId) {
            return ['parsed' => $parsed, 'index' => $i];
        }
    }
    return null;
}

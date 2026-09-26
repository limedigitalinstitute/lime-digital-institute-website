<?php
// Never let PHP warnings/notices leak into the response body — this endpoint
// must always return pure JSON, or the admin UI's res.json() call breaks.
ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/_auth.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
    exit;
}

if (!checkAuthHeader()) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

// Whitelist of page keys -> real file path, so the request body can never
// point this at an arbitrary file on disk. Keep in sync with PAGES_MAP in
// lime-admin/admin.js.
$PAGE_FILES = [
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
    'free-masterclass' => 'free-masterclass.html',
    'event' => 'event.html',
    '3-day-demo-class' => '3-day-demo-class.html',
    'thank-you' => 'thank-you.html',
    'event-thank-you' => 'event-thank-you.html',
];

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Body must be a JSON object"]);
    exit;
}

$page = isset($body['page']) ? trim($body['page']) : '';
$sectionId = isset($body['sectionId']) ? trim($body['sectionId']) : '';
$direction = isset($body['direction']) ? trim($body['direction']) : '';

if (!isset($PAGE_FILES[$page])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Unknown page"]);
    exit;
}
if (!preg_match('/^[a-zA-Z0-9\-]{1,80}$/', $sectionId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid sectionId"]);
    exit;
}
if ($direction !== 'up' && $direction !== 'down') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "direction must be 'up' or 'down'"]);
    exit;
}

$filePath = __DIR__ . '/../' . $PAGE_FILES[$page];
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "Page file not found"]);
    exit;
}

$original = file_get_contents($filePath);

// --- Locate every TOP-LEVEL <section>...</section> block in the file. ---
// A "block" is: the gap text right after the previous block (whitespace,
// HTML comments) + the section tag itself + its content, up to the matching
// </section>. Depth tracking means a <section> nested inside another one
// (none exist in this codebase today, but stay safe) is absorbed into its
// parent's block instead of being treated as a sibling.
function find_top_level_sections($html) {
    $blocks = [];
    $offset = 0;
    $len = strlen($html);
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

$parsed = find_top_level_sections($original);
if ($parsed === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not safely parse section boundaries — no changes made"]);
    exit;
}

$blocks = $parsed['blocks'];
$targetIndex = null;
foreach ($blocks as $i => $b) {
    if ($b['id'] === $sectionId) { $targetIndex = $i; break; }
}
if ($targetIndex === null) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "Section id not found on this page"]);
    exit;
}

$swapIndex = $direction === 'up' ? $targetIndex - 1 : $targetIndex + 1;
if ($swapIndex < 0 || $swapIndex >= count($blocks)) {
    http_response_code(409);
    echo json_encode(["success" => false, "error" => "Section is already at the " . ($direction === 'up' ? 'top' : 'bottom')]);
    exit;
}

// Each position's "gap" (leading whitespace/HTML comment) stays put — it's
// separator content between the previous block and this slot. Only the
// <section>...</section> HTML (and its id) actually moves between slots.
$targetHtml = $blocks[$targetIndex]['html'];
$targetId = $blocks[$targetIndex]['id'];
$blocks[$targetIndex]['html'] = $blocks[$swapIndex]['html'];
$blocks[$targetIndex]['id'] = $blocks[$swapIndex]['id'];
$blocks[$swapIndex]['html'] = $targetHtml;
$blocks[$swapIndex]['id'] = $targetId;

$rebuilt = '';
foreach ($blocks as $b) {
    $rebuilt .= $b['gap'] . $b['html'];
}
$rebuilt .= $parsed['tail'];

// Safety net: a reorder only rearranges existing bytes, it must never change
// the file's total length. If it does, something went wrong — abort, don't write.
if (strlen($rebuilt) !== strlen($original)) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Safety check failed (length mismatch) — no changes made"]);
    exit;
}

$written = @file_put_contents($filePath, $rebuilt);
if ($written === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not write file (permission denied?) — no changes made"]);
    exit;
}

echo json_encode([
    "success" => true,
    "page" => $page,
    "sectionId" => $sectionId,
    "direction" => $direction,
    "newOrder" => array_map(function ($b) { return $b['id']; }, $blocks),
]);

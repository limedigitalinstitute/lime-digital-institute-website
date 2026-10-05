<?php
// Turns one page's <section id="X">...</section> into a Global Section:
// its inner content is saved to data/sections/<name>.json (type raw-html,
// same format Global Sections already edits) and replaced in the page with
// <div data-global-section="name"></div>. From then on it's edited once in
// the Global Sections tab and updates every page that uses it.
ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_section-parser.php';

sendCorsHeaders();
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

$PAGE_FILES = lime_page_files();
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Body must be a JSON object"]);
    exit;
}

$page = isset($body['page']) ? trim($body['page']) : '';
$sectionId = isset($body['sectionId']) ? trim($body['sectionId']) : '';
$globalName = isset($body['globalName']) ? trim($body['globalName']) : $sectionId;

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
if (!preg_match('/^[a-z0-9\-]{1,64}$/', $globalName)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid globalName (lowercase, numbers, hyphens only)"]);
    exit;
}

$SECTIONS_DIR = __DIR__ . '/../data/sections';
$jsonPath = $SECTIONS_DIR . '/' . $globalName . '.json';
if (file_exists($jsonPath) && empty($body['overwrite'])) {
    http_response_code(409);
    echo json_encode(["success" => false, "error" => "A global section named \"$globalName\" already exists"]);
    exit;
}

$filePath = __DIR__ . '/../' . $PAGE_FILES[$page];
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "Page file not found"]);
    exit;
}

$original = file_get_contents($filePath);
$found = find_section_by_id($original, $sectionId);
if ($found === null) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "Section id not found on this page"]);
    exit;
}

$blocks = $found['parsed']['blocks'];
$idx = $found['index'];
$split = split_section_block($blocks[$idx]['html']);
if ($split === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not safely split this section's tags — no changes made"]);
    exit;
}

$innerHtml = $split['inner'];

// Replace this block's inner content with the global-section placeholder.
$blocks[$idx]['html'] = $split['openTag'] . "\n    <div data-global-section=\"" . $globalName . "\"></div>\n  " . $split['closeTag'];

$rebuilt = '';
foreach ($blocks as $b) {
    $rebuilt .= $b['gap'] . $b['html'];
}
$rebuilt .= $found['parsed']['tail'];

// Structural safety net: the rebuilt file must still parse into the same
// number of top-level sections as before (we only swapped one block's inner
// content, never added/removed a <section> tag).
$reparsed = find_top_level_sections($rebuilt);
if ($reparsed === null || count($reparsed['blocks']) !== count($blocks)) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Safety check failed after rebuild — no changes made"]);
    exit;
}

// Write the JSON first: if the page-file write then fails, we're left with
// an unused global section (harmless, visible in the list) rather than a
// page pointing at a global section that doesn't exist.
if (!is_dir($SECTIONS_DIR)) mkdir($SECTIONS_DIR, 0755, true);
$jsonWritten = @file_put_contents($jsonPath, json_encode(
    ["type" => "raw-html", "html" => $innerHtml],
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
));
if ($jsonWritten === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not write global section data (permission denied?) — no changes made"]);
    exit;
}

$pageWritten = @file_put_contents($filePath, $rebuilt);
if ($pageWritten === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Global section saved, but could not update the page file (permission denied?). The section is not yet linked — try again."]);
    exit;
}

echo json_encode([
    "success" => true,
    "page" => $page,
    "sectionId" => $sectionId,
    "globalName" => $globalName,
]);

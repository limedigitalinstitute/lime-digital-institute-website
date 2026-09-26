<?php
// Never let PHP warnings/notices leak into the response body — this endpoint
// must always return pure JSON, or the admin UI's res.json() call breaks.
ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_section-parser.php';

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

$PAGE_FILES = lime_page_files();

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

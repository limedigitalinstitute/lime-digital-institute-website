<?php
// Page-local section editor: reads/writes a <section id="X">...</section>'s
// inner HTML directly on one page. Unlike Global Sections, this only affects
// the page it's called on — for a section that isn't (and doesn't need to
// be) shared across pages.
ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_section-parser.php';

sendCorsHeaders();
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$PAGE_FILES = lime_page_files();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $page = isset($_GET['page']) ? trim($_GET['page']) : '';
    $sectionId = isset($_GET['sectionId']) ? trim($_GET['sectionId']) : '';

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

    $filePath = __DIR__ . '/../' . $PAGE_FILES[$page];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Page file not found"]);
        exit;
    }

    $found = find_section_by_id(file_get_contents($filePath), $sectionId);
    if ($found === null) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Section id not found on this page"]);
        exit;
    }
    $split = split_section_block($found['parsed']['blocks'][$found['index']]['html']);
    if ($split === null) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Could not safely split this section's tags"]);
        exit;
    }
    echo json_encode(["success" => true, "html" => $split['inner']]);
    exit;
}

if ($method === 'POST') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Body must be a JSON object"]);
        exit;
    }
    $page = isset($body['page']) ? trim($body['page']) : '';
    $sectionId = isset($body['sectionId']) ? trim($body['sectionId']) : '';
    $html = isset($body['html']) ? $body['html'] : null;

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
    if (!is_string($html)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing html"]);
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

    $blocks[$idx]['html'] = $split['openTag'] . $html . $split['closeTag'];

    $rebuilt = '';
    foreach ($blocks as $b) {
        $rebuilt .= $b['gap'] . $b['html'];
    }
    $rebuilt .= $found['parsed']['tail'];

    $reparsed = find_top_level_sections($rebuilt);
    if ($reparsed === null || count($reparsed['blocks']) !== count($blocks)) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Safety check failed after rebuild (unbalanced HTML in your edit?) — no changes made"]);
        exit;
    }

    $written = @file_put_contents($filePath, $rebuilt);
    if ($written === false) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Could not write file (permission denied?) — no changes made"]);
        exit;
    }

    echo json_encode(["success" => true, "page" => $page, "sectionId" => $sectionId]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "error" => "Method not allowed"]);

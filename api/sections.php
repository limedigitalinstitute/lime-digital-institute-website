<?php
require_once __DIR__ . '/_auth.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$SECTIONS_DIR = __DIR__ . '/../data/sections';

// Only simple lowercase-alnum-and-hyphen names, so the URL/query can never
// be used to read/write outside data/sections/.
function safeSectionName($raw) {
    $name = isset($raw) ? trim($raw) : '';
    if (!preg_match('/^[a-z0-9\-]{1,64}$/', $name)) return null;
    return $name;
}

$method = $_SERVER['REQUEST_METHOD'];
$name = safeSectionName(isset($_GET['name']) ? $_GET['name'] : '');

if ($method === 'GET' && !isset($_GET['name'])) {
    // List all registered sections (used by the admin panel).
    $files = is_dir($SECTIONS_DIR) ? glob($SECTIONS_DIR . '/*.json') : [];
    $sections = [];
    foreach ($files as $f) {
        $key = basename($f, '.json');
        $data = json_decode(file_get_contents($f), true);
        if (is_array($data)) $sections[$key] = $data;
    }
    echo json_encode(["success" => true, "sections" => $sections]);
    exit;
}

if (!$name) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing or invalid section name"]);
    exit;
}

$file = $SECTIONS_DIR . '/' . $name . '.json';

if ($method === 'GET') {
    if (!file_exists($file)) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Section not found"]);
        exit;
    }
    $data = json_decode(file_get_contents($file), true);
    echo json_encode(["success" => true, "name" => $name, "section" => $data]);
    exit;
}

if ($method === 'PUT' || $method === 'POST') {
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
    if (!is_dir($SECTIONS_DIR)) mkdir($SECTIONS_DIR, 0755, true);
    file_put_contents($file, json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    echo json_encode(["success" => true, "name" => $name, "section" => $body]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "error" => "Method not allowed"]);

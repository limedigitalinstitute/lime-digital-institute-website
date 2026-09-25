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

$CONTENT_DIR = __DIR__ . '/../data/content';

// Only simple lowercase-alnum-and-hyphen page keys are allowed, so the
// query param can never be used to read/write outside data/content/.
function safePageKey($raw) {
    $key = isset($raw) ? trim($raw) : '';
    if (!preg_match('/^[a-z0-9\-]{1,64}$/', $key)) return null;
    return $key;
}

function getContentFile($dir, $page) {
    return $dir . '/' . $page . '.json';
}

function readContent($file) {
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

$method = $_SERVER['REQUEST_METHOD'];
$page = safePageKey(isset($_GET['page']) ? $_GET['page'] : '');

if ($method === 'GET') {
    if (!$page) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing or invalid ?page= key"]);
        exit;
    }
    $content = readContent(getContentFile($CONTENT_DIR, $page));
    echo json_encode(["success" => true, "page" => $page, "content" => $content]);
    exit;
}

if ($method === 'PUT' || $method === 'POST') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    if (!$page) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing or invalid ?page= key"]);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Body must be a JSON object of key/value pairs"]);
        exit;
    }

    if (!is_dir($CONTENT_DIR)) mkdir($CONTENT_DIR, 0755, true);
    $file = getContentFile($CONTENT_DIR, $page);
    $content = readContent($file);
    foreach ($body as $k => $v) {
        // Only plain strings are stored — this is a text-content CMS, not
        // a general data store.
        if (is_string($k) && (is_string($v) || $v === null)) {
            if ($v === null) {
                unset($content[$k]);
            } else {
                $content[$k] = $v;
            }
        }
    }
    file_put_contents($file, json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    echo json_encode(["success" => true, "page" => $page, "content" => $content]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "error" => "Method not allowed"]);

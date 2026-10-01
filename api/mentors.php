<?php
require_once __DIR__ . '/_auth.php';

sendCorsHeaders('GET, POST, PUT, DELETE, OPTIONS');
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/../data/mentors.json';
$method = $_SERVER['REQUEST_METHOD'];

function getMentors($file) {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    return json_decode($raw, true) ?: [];
}

function saveMentors($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

if ($method === 'GET') {
    echo json_encode(["success" => true, "mentors" => getMentors($dataFile)]);
    exit;
}

if ($method === 'POST') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    if (empty($body['name'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Name is required"]);
        exit;
    }
    $mentors = getMentors($dataFile);
    $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['name']), '-')) . '-' . rand(100, 999);
    $newMentor = [
        "id" => $slug,
        "name" => $body['name'],
        "role" => isset($body['role']) ? $body['role'] : '',
        "photo" => isset($body['photo']) ? $body['photo'] : 'assets/mentors/paras-patel.webp',
        "bio" => isset($body['bio']) ? $body['bio'] : ''
    ];
    $mentors[] = $newMentor;
    saveMentors($dataFile, $mentors);
    http_response_code(201);
    echo json_encode(["success" => true, "mentor" => $newMentor]);
    exit;
}

if ($method === 'PUT') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $mentors = getMentors($dataFile);
    $found = false;
    foreach ($mentors as &$m) {
        if ($m['id'] === $id) {
            $m = array_merge($m, $body, ["id" => $id]);
            $found = true;
            break;
        }
    }
    unset($m);
    if (!$found) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Mentor not found"]);
        exit;
    }
    saveMentors($dataFile, $mentors);
    echo json_encode(["success" => true]);
    exit;
}

if ($method === 'DELETE') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $mentors = getMentors($dataFile);
    $newMentors = array_values(array_filter($mentors, function($m) use ($id) { return $m['id'] !== $id; }));
    saveMentors($dataFile, $newMentors);
    echo json_encode(["success" => true, "deletedId" => $id]);
    exit;
}

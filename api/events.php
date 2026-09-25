<?php
require_once __DIR__ . '/_auth.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/../data/events.json';
$method = $_SERVER['REQUEST_METHOD'];

function getEvents($file) {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    return json_decode($raw, true) ?: [];
}

function saveEvents($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $events = getEvents($dataFile);
    if (!empty($id)) {
        foreach ($events as $e) {
            if ($e['id'] === $id) {
                echo json_encode(["success" => true, "event" => $e]);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Event not found"]);
        exit;
    }
    echo json_encode(["success" => true, "events" => $events]);
    exit;
}

if ($method === 'POST') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    if (empty($body['title'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Title is required"]);
        exit;
    }
    $events = getEvents($dataFile);
    $slug = (!empty($body['id']) ? $body['id'] : strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['title']), '-'))) . '-' . rand(100, 999);
    $newEvent = array_merge([
        "id" => $slug,
        "type" => "online",
        "status" => "upcoming",
        "badge" => "New Session",
        "seatsLeft" => 20
    ], $body, ["id" => $slug]);

    array_unshift($events, $newEvent);
    saveEvents($dataFile, $events);
    http_response_code(201);
    echo json_encode(["success" => true, "event" => $newEvent]);
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
    $events = getEvents($dataFile);
    $found = false;
    foreach ($events as &$e) {
        if ($e['id'] === $id) {
            $e = array_merge($e, $body, ["id" => $id]);
            $found = true;
            break;
        }
    }
    if (!$found) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Event not found"]);
        exit;
    }
    saveEvents($dataFile, $events);
    echo json_encode(["success" => true, "event" => $body]);
    exit;
}

if ($method === 'DELETE') {
    if (!checkAuthHeader()) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        exit;
    }
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $events = getEvents($dataFile);
    $newEvents = array_values(array_filter($events, function($e) use ($id) { return $e['id'] !== $id; }));
    saveEvents($dataFile, $newEvents);
    echo json_encode(["success" => true, "deletedId" => $id]);
    exit;
}


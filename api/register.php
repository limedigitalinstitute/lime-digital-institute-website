<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/../data/registrations.json';
$eventsFile = __DIR__ . '/../data/events.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = isset($body['name']) ? trim($body['name']) : '';
    $phone = isset($body['phone']) ? trim($body['phone']) : '';
    $email = isset($body['email']) ? trim($body['email']) : '';
    $countryCode = isset($body['countryCode']) ? trim($body['countryCode']) : '';

    if (empty($name) || empty($phone) || empty($email)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Name, Phone and Email are required"]);
        exit;
    }

    $registrations = file_exists($dataFile) ? json_decode(file_get_contents($dataFile), true) : [];
    if (!is_array($registrations)) $registrations = [];

    $reg = [
        "id" => "reg_" . time() . "_" . rand(100, 999),
        "eventId" => isset($body['eventId']) ? $body['eventId'] : 'general-masterclass',
        "eventTitle" => isset($body['eventTitle']) ? $body['eventTitle'] : 'Free Masterclass',
        "name" => $name,
        "email" => strtolower($email),
        "phone" => (!empty($countryCode) ? $countryCode . ' ' : '') . $phone,
        "goal" => isset($body['goal']) ? $body['goal'] : 'Career Growth',
        "submittedAt" => date('c'),
        "ip" => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : ''
    ];

    array_unshift($registrations, $reg);
    file_put_contents($dataFile, json_encode($registrations, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    // Decrement seats
    if (file_exists($eventsFile)) {
        $events = json_decode(file_get_contents($eventsFile), true) ?: [];
        foreach ($events as &$e) {
            if ($e['id'] === $reg['eventId'] && isset($e['seatsLeft']) && $e['seatsLeft'] > 0) {
                $e['seatsLeft'] -= 1;
                break;
            }
        }
        file_put_contents($eventsFile, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    echo json_encode([
        "success" => true,
        "message" => "Registration successful",
        "registrationId" => $reg['id']
    ]);
    exit;
}


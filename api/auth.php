<?php
require_once __DIR__ . '/_auth.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$ADMIN_USER = getenv('ADMIN_USERNAME') ?: 'paras';
$ADMIN_EMAIL = getenv('ADMIN_EMAIL') ?: 'admin@limeinstitute.org';
$ADMIN_PASS = getenv('ADMIN_PASSWORD') ?: 'change-me-set-ADMIN_PASSWORD-env-var';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $user = strtolower(trim(isset($body['username']) ? $body['username'] : (isset($body['email']) ? $body['email'] : '')));
    $pass = isset($body['password']) ? $body['password'] : '';

    if (($user === $ADMIN_USER || $user === $ADMIN_EMAIL) && hash_equals($ADMIN_PASS, $pass)) {
        $userInfo = [
            "name" => "Paras Patel",
            "email" => $ADMIN_EMAIL,
            "role" => "Administrator"
        ];
        $token = issueToken($userInfo);
        echo json_encode([
            "success" => true,
            "token" => $token,
            "user" => $userInfo
        ]);
        exit;
    }

    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid Admin ID or Password"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tokenRecord = checkAuthHeader();
    if ($tokenRecord) {
        echo json_encode(["success" => true, "authenticated" => true]);
        exit;
    }
    http_response_code(401);
    echo json_encode(["success" => false, "authenticated" => false]);
    exit;
}


<?php
require_once __DIR__ . '/_auth.php';

sendCorsHeaders('POST, OPTIONS');
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

$target = isset($_POST['target']) ? $_POST['target'] : '';
$allowedTargets = [
    'webinar' => 'assets/uploads/webinars',
    'mentor' => 'assets/uploads/mentors',
];
if (!isset($allowedTargets[$target])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid target"]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "No file uploaded"]);
    exit;
}

$file = $_FILES['file'];
$maxBytes = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "File too large (max 5MB)"]);
    exit;
}

$allowedMime = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!isset($allowedMime[$mime])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Only JPG, PNG, or WEBP images are allowed"]);
    exit;
}
$ext = $allowedMime[$mime];

$baseName = isset($_POST['name']) ? trim($_POST['name']) : 'upload';
$slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $baseName));
$slug = trim($slug, '-');
if ($slug === '') $slug = 'upload';
$filename = $slug . '-' . time() . '.' . $ext;

$destDir = __DIR__ . '/../' . $allowedTargets[$target];
if (!is_dir($destDir)) {
    mkdir($destDir, 0755, true);
}
$destPath = $destDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to save file"]);
    exit;
}

$publicPath = $allowedTargets[$target] . '/' . $filename;
echo json_encode(["success" => true, "path" => $publicPath]);
exit;

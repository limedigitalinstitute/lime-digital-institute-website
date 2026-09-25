<?php
require_once __DIR__ . '/_auth.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!checkAuthHeader()) {
    http_response_code(401);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

$dataFile = __DIR__ . '/../data/registrations.json';
$registrations = file_exists($dataFile) ? json_decode(file_get_contents($dataFile), true) : [];
if (!is_array($registrations)) $registrations = [];

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'export') {
    header("Content-Type: text/csv; charset=UTF-8");
    header('Content-Disposition: attachment; filename="lime-masterclass-leads-' . date('Y-m-d') . '.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['ID', 'Event Title', 'Attendee Name', 'Email', 'Phone', 'Goal', 'Submitted At']);
    foreach ($registrations as $r) {
        fputcsv($output, [
            isset($r['id']) ? $r['id'] : '',
            isset($r['eventTitle']) ? $r['eventTitle'] : '',
            isset($r['name']) ? $r['name'] : '',
            isset($r['email']) ? $r['email'] : '',
            isset($r['phone']) ? $r['phone'] : '',
            isset($r['goal']) ? $r['goal'] : '',
            isset($r['submittedAt']) ? $r['submittedAt'] : ''
        ]);
    }
    fclose($output);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
echo json_encode(["success" => true, "leads" => $registrations]);
exit;


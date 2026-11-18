<?php
// Browser forms (lime-form.js) post here after sending to Zoho; we copy the lead into Durva OS.
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_durva.php';

sendCorsHeaders('POST, OPTIONS');
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }

$body = json_decode(file_get_contents('php://input', false, null, 0, 16384), true) ?: [];
$name = trim((string)($body['name'] ?? ''));
$phone = preg_replace('/[^0-9]/', '', (string)($body['phone'] ?? ''));
if ($name === '' || strlen($name) > 100 || strlen($phone) < 7 || strlen($phone) > 15) {
    http_response_code(400); echo '{"ok":false}'; exit;
}

// Public endpoint: at most 5 copies per visitor IP per 10 minutes.
// ponytail: JSON file + no lock, move to flock/DB if lead volume gets high.
$hitsFile = __DIR__ . '/../data/lead_copy_hits.json';
$ip = _lime_client_ip();
$now = time();
$hits = json_decode(@file_get_contents($hitsFile) ?: '[]', true) ?: [];
foreach ($hits as $k => $list) { $hits[$k] = array_values(array_filter($list, fn($t) => $now - $t < 600)); if (!$hits[$k]) unset($hits[$k]); }
if (count($hits[$ip] ?? []) >= 5) { http_response_code(429); echo '{"ok":false}'; exit; }
$hits[$ip][] = $now;
@file_put_contents($hitsFile, json_encode($hits));

$ok = durvaCopyLead($body);
echo json_encode(['ok' => $ok]);

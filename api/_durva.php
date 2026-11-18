<?php
// Copies a website lead into Durva OS CRM (os.limeinstitute.cloud) as a crmContacts record.
// Zoho stays the main destination; this is a best-effort copy and never blocks or fails a form.
// Needs env DURVA_OS_AGENT_KEY (a dva_... agent key with CRM edit). Without it this does nothing.

function durvaCopyLead(array $lead) {
    $key = getenv('DURVA_OS_AGENT_KEY');
    if (!$key) return false;
    $base = rtrim(getenv('DURVA_OS_URL') ?: 'https://os.limeinstitute.cloud', '/');

    $s = function ($v, $max = 200) { return is_scalar($v) ? mb_substr(trim((string)$v), 0, $max) : ''; };
    $parts = preg_split('/\s+/', $s($lead['name'] ?? '', 100), 2);
    $code = $s($lead['countryCode'] ?? '', 6);
    $phone = preg_replace('/[^0-9]/', '', $s($lead['phone'] ?? '', 20));
    $extra = array_filter([
        'Interest' => $s($lead['interest'] ?? ''),
        'Level' => $s($lead['level'] ?? ''),
        'Start' => $s($lead['start'] ?? ''),
        'Goal' => $s($lead['goal'] ?? ''),
    ]);
    $source = 'Website: ' . ($s($lead['formName'] ?? '', 80) ?: 'Form');
    foreach ($extra as $k => $v) $source .= " | $k: $v";

    $data = array_filter([
        'firstName' => $parts[0] ?? '',
        'lastName' => $parts[1] ?? '',
        'whatsapp' => trim(($code ? $code . ' ' : '') . $phone),
        'email' => $s($lead['email'] ?? '', 120),
        'leadSource' => $s($lead['leadSource'] ?? '', 120) ?: 'Website',
        'utmSource' => $s($lead['utm_source'] ?? ''),
        'utmMedium' => $s($lead['utm_medium'] ?? ''),
        'utmCampaign' => $s($lead['utm_campaign'] ?? ''),
        'utmTerm' => $s($lead['utm_term'] ?? ''),
        'utmContent' => $s($lead['utm_content'] ?? ''),
        'source' => mb_substr($source, 0, 500),
    ], 'strlen');

    $call = function ($method, $query, $body = null) use ($base, $key) {
        $ctx = stream_context_create(['http' => [
            'method' => $method,
            'header' => "Content-Type: application/json\r\nAuthorization: Bearer $key\r\n",
            'content' => $body === null ? '' : json_encode($body),
            'timeout' => 5,
            'ignore_errors' => true,
        ]]);
        $resp = @file_get_contents($base . '/api/agent/v1/records' . $query, false, $ctx);
        $status = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m) ? (int)$m[1] : 0;
        return [$status, json_decode((string)$resp, true), $resp];
    };

    // Same WhatsApp number (last 10 digits) or same email as an existing inquiry = duplicate.
    // The new inquiry is still added, tagged "Duplicate Lead", so no submission is lost.
    $last10 = substr($phone, -10);
    $email = strtolower($data['email'] ?? '');
    $dup = null;
    // Durva's q= is a raw substring search and stored numbers may contain spaces
    // ("98765 43210"), so search by the last 4 digits and compare all 10 below.
    foreach (array_filter([strlen($last10) >= 7 ? substr($last10, -4) : '', $email]) as $needle) {
        [$st, $found] = $call('GET', '?collection=crmContacts&limit=500&q=' . urlencode($needle));
        foreach (($st === 200 ? ($found['records'] ?? []) : []) as $r) {
            $rPhone = preg_replace('/[^0-9]/', '', (string)($r['whatsapp'] ?? ''));
            if (($last10 && strlen($last10) >= 7 && substr($rPhone, -10) === $last10) ||
                ($email && strtolower((string)($r['email'] ?? '')) === $email)) { $dup = $r; break 2; }
        }
    }
    if ($dup) {
        $data['tags'] = ['Duplicate Lead'];
        $orig = trim(($dup['firstName'] ?? '') . ' ' . ($dup['lastName'] ?? '')) ?: ($dup['id'] ?? '');
        $data['source'] = mb_substr($data['source'] . " | Duplicate of: $orig", 0, 500);
    }

    [$status, , $resp] = $call('POST', '', ['collection' => 'crmContacts', 'data' => $data]);
    if ($status !== 200) error_log("Durva OS lead copy failed: HTTP $status " . substr((string)$resp, 0, 200));
    return $status === 200;
}

<?php
// Shared token store for the PHP API. Tokens are persisted to data/tokens.json
// so auth survives across requests (PHP has no in-process shared state).

define('TOKENS_FILE', __DIR__ . '/../data/tokens.json');
define('TOKEN_TTL_SECONDS', 60 * 60 * 24 * 7); // 7 days

function _lime_read_tokens() {
    if (!file_exists(TOKENS_FILE)) return [];
    $raw = file_get_contents(TOKENS_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function _lime_write_tokens($tokens) {
    file_put_contents(TOKENS_FILE, json_encode($tokens, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function _lime_prune_expired($tokens) {
    $now = time();
    return array_values(array_filter($tokens, function ($t) use ($now) {
        return isset($t['expires']) && $t['expires'] > $now;
    }));
}

// Call after a successful login to mint + persist a new token.
function issueToken($user) {
    $token = 'lime_sec_' . bin2hex(random_bytes(24));
    $tokens = _lime_prune_expired(_lime_read_tokens());
    $tokens[] = [
        'token' => $token,
        'user' => $user,
        'issued' => time(),
        'expires' => time() + TOKEN_TTL_SECONDS
    ];
    _lime_write_tokens($tokens);
    return $token;
}

// Returns the matching token record if the request carries a valid, unexpired
// bearer token (or ?token= query param for endpoints like CSV export that
// can't set headers), otherwise false.
function checkAuthHeader() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = isset($headers['Authorization']) ? $headers['Authorization']
        : (isset($headers['authorization']) ? $headers['authorization'] : '');
    $token = trim(preg_replace('/^Bearer\s+/i', '', $auth));
    if (empty($token) && isset($_GET['token'])) {
        $token = trim($_GET['token']);
    }
    if (empty($token)) return false;

    $tokens = _lime_prune_expired(_lime_read_tokens());
    _lime_write_tokens($tokens); // persist pruning
    foreach ($tokens as $t) {
        if (hash_equals($t['token'], $token)) return $t;
    }
    return false;
}

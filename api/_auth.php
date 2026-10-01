<?php
// Shared token store for the PHP API. Tokens are persisted to data/tokens.json
// so auth survives across requests (PHP has no in-process shared state).

// Send a CORS header that only allows our own domains, instead of '*'.
// Call this before any other headers in each api/*.php entrypoint.
function sendCorsHeaders($methods = 'GET, POST, OPTIONS') {
    $allowedOrigins = [
        'https://limedigitalinstitute.org',
        'https://www.limedigitalinstitute.org',
        'https://courses.limedigitalinstitute.org',
        'https://campus.limedigitalinstitute.org',
    ];
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
    }
    header("Access-Control-Allow-Methods: $methods");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}

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

// --- Login brute-force protection ---
define('LOGIN_ATTEMPTS_FILE', __DIR__ . '/../data/login_attempts.json');
define('LOGIN_MAX_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_SECONDS', 15 * 60); // 15 minutes

function _lime_client_ip() {
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
}

function _lime_read_login_attempts() {
    if (!file_exists(LOGIN_ATTEMPTS_FILE)) return [];
    $raw = file_get_contents(LOGIN_ATTEMPTS_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function _lime_write_login_attempts($attempts) {
    file_put_contents(LOGIN_ATTEMPTS_FILE, json_encode($attempts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Call before checking credentials. Returns seconds remaining if locked out, else 0.
function loginLockoutSecondsRemaining() {
    $ip = _lime_client_ip();
    $attempts = _lime_read_login_attempts();
    $now = time();
    if (!isset($attempts[$ip])) return 0;
    $entry = $attempts[$ip];
    if ($entry['count'] >= LOGIN_MAX_ATTEMPTS) {
        $elapsed = $now - $entry['lastAttempt'];
        if ($elapsed < LOGIN_LOCKOUT_SECONDS) {
            return LOGIN_LOCKOUT_SECONDS - $elapsed;
        }
        // Lockout expired — reset.
        unset($attempts[$ip]);
        _lime_write_login_attempts($attempts);
    }
    return 0;
}

function recordLoginFailure() {
    $ip = _lime_client_ip();
    $attempts = _lime_read_login_attempts();
    $now = time();
    if (!isset($attempts[$ip]) || ($now - $attempts[$ip]['lastAttempt']) > LOGIN_LOCKOUT_SECONDS) {
        $attempts[$ip] = ['count' => 0, 'lastAttempt' => $now];
    }
    $attempts[$ip]['count'] += 1;
    $attempts[$ip]['lastAttempt'] = $now;
    _lime_write_login_attempts($attempts);
}

function clearLoginFailures() {
    $ip = _lime_client_ip();
    $attempts = _lime_read_login_attempts();
    if (isset($attempts[$ip])) {
        unset($attempts[$ip]);
        _lime_write_login_attempts($attempts);
    }
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

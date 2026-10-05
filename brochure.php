<?php
// Password-protected course brochure page.
// The page body lives in _private/ (blocked from direct access) and is only
// sent after a correct password. The password is stored as a PBKDF2 hash.
const BROCHURE_SALT = '198eab3736bd4e8daf3e9ea371c1d173';
const BROCHURE_HASH = 'af183316763d124ff463c060d70b0822da9769636714c22fc4bf1e396960abb5';
const BROCHURE_ITER = 200000;
const BROCHURE_MAX_FAILS = 8;
const BROCHURE_LOCK_SECONDS = 900;
const BROCHURE_SESSION_SECONDS = 43200; // 12 hours
const BROCHURE_ATTEMPTS_FILE = __DIR__ . '/data/brochure_attempts.json';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store, max-age=0');
header('Referrer-Policy: no-referrer');

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax',
]);
session_name('lime_brochure');
session_start();

function brochure_ip() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']));
        $ip = end($parts);
        if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
    }
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
}
function brochure_read_attempts() {
    if (!file_exists(BROCHURE_ATTEMPTS_FILE)) return [];
    $d = json_decode(file_get_contents(BROCHURE_ATTEMPTS_FILE), true);
    return is_array($d) ? $d : [];
}
function brochure_write_attempts($a) {
    @file_put_contents(BROCHURE_ATTEMPTS_FILE, json_encode($a), LOCK_EX);
}
function brochure_locked_seconds() {
    $a = brochure_read_attempts(); $ip = brochure_ip();
    if (isset($a[$ip]) && $a[$ip]['count'] >= BROCHURE_MAX_FAILS) {
        $left = BROCHURE_LOCK_SECONDS - (time() - $a[$ip]['last']);
        if ($left > 0) return $left;
        unset($a[$ip]); brochure_write_attempts($a);
    }
    return 0;
}
function brochure_fail() {
    $a = brochure_read_attempts(); $ip = brochure_ip(); $now = time();
    if (!isset($a[$ip]) || ($now - $a[$ip]['last']) > BROCHURE_LOCK_SECONDS) $a[$ip] = ['count' => 0, 'last' => $now];
    $a[$ip]['count']++; $a[$ip]['last'] = $now;
    brochure_write_attempts($a);
}
function brochure_clear() {
    $a = brochure_read_attempts(); $ip = brochure_ip();
    if (isset($a[$ip])) { unset($a[$ip]); brochure_write_attempts($a); }
}

$ok = isset($_SESSION['brochure_ok']) && (time() - (int)$_SESSION['brochure_ok']) < BROCHURE_SESSION_SECONDS;
$error = '';

if (!$ok && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $left = brochure_locked_seconds();
    if ($left > 0) {
        $error = 'Too many wrong attempts. Please try again in ' . ceil($left / 60) . ' minute(s).';
    } else {
        $pw = isset($_POST['password']) ? (string)$_POST['password'] : '';
        $calc = hash_pbkdf2('sha256', $pw, BROCHURE_SALT, BROCHURE_ITER);
        if (hash_equals(BROCHURE_HASH, $calc)) {
            brochure_clear();
            session_regenerate_id(true);
            $_SESSION['brochure_ok'] = time();
            header('Location: /brochure', true, 303);
            exit;
        }
        brochure_fail();
        sleep(1);
        $error = 'Incorrect password. Please try again.';
    }
}

if ($ok) {
    readfile(__DIR__ . '/_private/brochure-page.html');
    exit;
}
http_response_code($error ? 401 : 200);
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Course Brochure | Lime Digital Institute</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:radial-gradient(1200px 600px at 50% -10%,#7a1216 0,#1a0709 45%,#050506 100%);color:#fff}
.card{width:100%;max-width:420px;background:#0b0f16;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:34px 28px;box-shadow:0 30px 80px rgba(0,0,0,.55);text-align:center}
.card img{height:44px;width:auto;margin:0 auto 18px;display:block;background:#fff;border-radius:10px;padding:6px 10px}
h1{margin:0 0 6px;font-size:22px;font-weight:700}
p{margin:0 0 20px;color:#b9bec8;font-size:14px;line-height:1.55}
input{width:100%;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:#05080d;color:#fff;font-size:15px;font-family:inherit;margin-bottom:12px}
input:focus{outline:2px solid #ED3237;border-color:#ED3237}
button{width:100%;padding:14px;border:0;border-radius:999px;background:#ED3237;color:#fff;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer}
button:hover{background:#d62a2f}
.err{background:#3a0f12;border:1px solid #7a1c20;color:#ffb3b6;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px}
.small{margin-top:16px;font-size:12px;color:#8b909b}
</style>
</head>
<body>
<main class="card">
<img src="/assets/lime-logo.png" alt="Lime Digital Institute" width="120" height="44">
<h1>Course Brochure</h1>
<p>This page is password protected. Enter the password to view the complete curriculum.</p>
<?php if ($error): ?><div class="err" role="alert"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div><?php endif; ?>
<form method="post" action="/brochure" autocomplete="off">
<input type="password" name="password" placeholder="Password" required autofocus autocomplete="current-password">
<button type="submit">View Brochure</button>
</form>
<div class="small">Lime Digital Institute, Rajkot</div>
</main>
</body>
</html>

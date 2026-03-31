<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);

if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}
if (!$admin['can_create_admins']) {
    error_response('FORBIDDEN', 403);
}

$token     = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$expiresAt = (new DateTime('+48 hours', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');

$stmt = $db->prepare('INSERT INTO admin_tokens (token_hash, expires_at) VALUES (:token_hash, :expires_at)');
$stmt->execute([':token_hash' => $tokenHash, ':expires_at' => $expiresAt]);

json_response([
    'adminToken' => $token,
    'expiresAt'  => format_datetime($expiresAt),
], 201);

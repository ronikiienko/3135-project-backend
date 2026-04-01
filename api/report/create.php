<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER']);
$db      = get_db();

$role = $session['role'];
if ($role === 'RENTER') {
    $reporter = fetch_renter($db, $session['user_id']);
} else {
    $reporter = fetch_shelter($db, $session['user_id']);
}
if ($reporter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$body       = json_decode(file_get_contents('php://input'), true);
$reportedId = isset($body['reported_id']) ? (int) $body['reported_id'] : null;
$reason     = trim($body['reason'] ?? '');
$detail     = trim($body['body'] ?? '');

if (!$reportedId || $reason === '' || $detail === '') {
    error_response('PAYLOAD_MALFORMED', 400);
}

if ($reportedId === $session['user_id']) {
    error_response('CANNOT_REPORT_SELF', 400);
}

$stmt = $db->prepare('SELECT id FROM users WHERE id = :id AND is_deleted = false');
$stmt->execute([':id' => $reportedId]);
if (!$stmt->fetch()) {
    error_response('USER_NOT_FOUND', 404);
}

$stmt = $db->prepare('INSERT INTO reports (reporter_id, reported_id, reason, body) VALUES (:reporter_id, :reported_id, :reason, :body)');
$stmt->execute([
    ':reporter_id' => $session['user_id'],
    ':reported_id' => $reportedId,
    ':reason'      => $reason,
    ':body'        => $detail,
]);

json_response([], 201);

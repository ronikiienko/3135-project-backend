<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER', 'ADMIN']);
$db      = get_db();

$correspondentId = isset($_GET['correspondentId']) ? (int) $_GET['correspondentId'] : null;
if (!$correspondentId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

// Check correspondent exists (allow deleted and suspended)
$stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute([':id' => $correspondentId]);
if (!$stmt->fetch()) {
    error_response('CORRESPONDENT_NOT_FOUND', 404);
}

$stmt = $db->prepare('
    SELECT id, sender_id, recipient_id, body, created_at
    FROM messages
    WHERE (sender_id = :user_id AND recipient_id = :correspondent_id)
       OR (sender_id = :correspondent_id2 AND recipient_id = :user_id2)
    ORDER BY created_at ASC
');
$stmt->execute([
    ':user_id'           => $session['user_id'],
    ':correspondent_id'  => $correspondentId,
    ':correspondent_id2' => $correspondentId,
    ':user_id2'          => $session['user_id'],
]);
$rows = $stmt->fetchAll();

$messages = array_map(fn($m) => [
    'id'           => (int) $m['id'],
    'sender_id'    => (int) $m['sender_id'],
    'recipient_id' => (int) $m['recipient_id'],
    'body'         => $m['body'],
    'created_at'   => format_datetime($m['created_at']),
], $rows);

json_response(['messages' => $messages]);

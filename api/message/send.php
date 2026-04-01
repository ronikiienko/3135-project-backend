<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER', 'ADMIN']);
$db      = get_db();

$recipientId = isset($_GET['recipientId']) ? (int) $_GET['recipientId'] : null;
if (!$recipientId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$body = json_decode(file_get_contents('php://input'), true);
$text = trim($body['body'] ?? '');
if ($text === '') {
    error_response('PAYLOAD_MALFORMED', 400);
}

// Check recipient exists and not deleted
$stmt = $db->prepare('SELECT id, is_deleted FROM users WHERE id = :id');
$stmt->execute([':id' => $recipientId]);
$recipient = $stmt->fetch();

if (!$recipient) {
    error_response('RECIPIENT_NOT_FOUND', 404);
}
if ((bool) $recipient['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('
    INSERT INTO messages (sender_id, recipient_id, body)
    VALUES (:sender_id, :recipient_id, :body)
');
$stmt->execute([
    ':sender_id'    => $session['user_id'],
    ':recipient_id' => $recipientId,
    ':body'         => $text,
]);
$messageId = (int) $db->lastInsertId();

$stmt = $db->prepare('SELECT * FROM messages WHERE id = :id');
$stmt->execute([':id' => $messageId]);
$message = $stmt->fetch();

json_response([
    'message' => [
        'id'           => (int) $message['id'],
        'sender_id'    => (int) $message['sender_id'],
        'recipient_id' => (int) $message['recipient_id'],
        'body'         => $message['body'],
        'created_at'   => format_datetime($message['created_at']),
    ],
], 201);

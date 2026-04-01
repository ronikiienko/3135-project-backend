<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);
if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$reportId = isset($_GET['reportId']) ? (int) $_GET['reportId'] : null;
if (!$reportId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT reporter_id, reported_id FROM reports WHERE id = :id');
$stmt->execute([':id' => $reportId]);
$report = $stmt->fetch();

if (!$report) {
    error_response('REPORT_NOT_FOUND', 404);
}

$reporterId = $report['reporter_id'] !== null ? (int) $report['reporter_id'] : null;
$reportedId = (int) $report['reported_id'];

if (!$reporterId) {
    json_response(['messages' => [], 'reporter_id' => null, 'reported_id' => $reportedId]);
    exit;
}

$stmt = $db->prepare('
    SELECT id, sender_id, recipient_id, body, created_at
    FROM messages
    WHERE (sender_id = :reporter_id  AND recipient_id = :reported_id)
       OR (sender_id = :reported_id2 AND recipient_id = :reporter_id2)
    ORDER BY created_at ASC
');
$stmt->execute([
    ':reporter_id'  => $reporterId,
    ':reported_id'  => $reportedId,
    ':reported_id2' => $reportedId,
    ':reporter_id2' => $reporterId,
]);

$messages = array_map(fn($m) => [
    'id'           => (int) $m['id'],
    'sender_id'    => (int) $m['sender_id'],
    'recipient_id' => (int) $m['recipient_id'],
    'body'         => $m['body'],
    'created_at'   => format_datetime($m['created_at']),
], $stmt->fetchAll());

json_response(['messages' => $messages, 'reporter_id' => $reporterId, 'reported_id' => $reportedId]);

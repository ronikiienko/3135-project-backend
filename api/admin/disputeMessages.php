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

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('
    SELECT renter_id, shelter_id
    FROM rentals
    WHERE id = :rental_id
      AND status = "DISPUTE"
      AND assigned_admin_id = :admin_id
');
$stmt->execute([':rental_id' => $rentalId, ':admin_id' => $session['user_id']]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('FORBIDDEN', 403);
}

$renterId  = (int) $rental['renter_id'];
$shelterId = (int) $rental['shelter_id'];

$stmt = $db->prepare('
    SELECT id, sender_id, recipient_id, body, created_at
    FROM messages
    WHERE (sender_id = :renter_id  AND recipient_id = :shelter_id)
       OR (sender_id = :shelter_id2 AND recipient_id = :renter_id2)
    ORDER BY created_at ASC
');
$stmt->execute([
    ':renter_id'   => $renterId,
    ':shelter_id'  => $shelterId,
    ':shelter_id2' => $shelterId,
    ':renter_id2'  => $renterId,
]);

$messages = array_map(fn($m) => [
    'id'           => (int) $m['id'],
    'sender_id'    => (int) $m['sender_id'],
    'recipient_id' => (int) $m['recipient_id'],
    'body'         => $m['body'],
    'created_at'   => format_datetime($m['created_at']),
], $stmt->fetchAll());

json_response(['messages' => $messages, 'renter_id' => $renterId, 'shelter_id' => $shelterId]);

<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$renter = fetch_renter($db, $session['user_id']);
if ($renter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('SELECT * FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ((int) $rental['renter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($rental['status'] !== 'PAYMENT_PENDING') {
    error_response('WRONG_RENTAL_STATUS', 409);
}

// Check terms_proposed_at is within 24 hours
if (empty($rental['terms_proposed_at'])) {
    error_response('WRONG_RENTAL_STATUS', 409);
}
$proposedAt = strtotime($rental['terms_proposed_at']);
if ($proposedAt === false || (time() - $proposedAt) > 86400) {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!isset($body['response'])) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$response = $body['response'];

if ($response === 'ACCEPT') {
    $stmt = $db->prepare('UPDATE rentals SET status = "PAID" WHERE id = :id');
    $stmt->execute([':id' => $rentalId]);

} elseif ($response === 'DECLINE') {
    $stmt = $db->prepare('UPDATE rentals SET status = "RENTER_DECLINED", closed_at = NOW() WHERE id = :id');
    $stmt->execute([':id' => $rentalId]);

} else {
    error_response('PAYLOAD_MALFORMED', 400);
}

json_response([]);

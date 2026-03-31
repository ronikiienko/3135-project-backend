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
if ($rental['status'] !== 'PAID') {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$rentalEndsTs    = strtotime($rental['rental_ends']);
$disputeWindowTs = 24 * 60 * 60;

if ($rentalEndsTs === false || $rentalEndsTs > time()) {
    error_response('WRONG_RENTAL_STATUS', 409);
}
if ((time() - $rentalEndsTs) > $disputeWindowTs) {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$body = json_decode(file_get_contents('php://input'), true);
if (empty($body['reason']) || !is_string($body['reason'])) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('UPDATE rentals SET status = "DISPUTE", dispute_reason = :reason WHERE id = :id');
$stmt->execute([':reason' => $body['reason'], ':id' => $rentalId]);

json_response([]);

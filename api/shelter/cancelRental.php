<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$shelter = fetch_shelter($db, $session['user_id']);
if ($shelter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}
if (!$shelter['is_verified']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('SELECT * FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ((int) $rental['shelter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($rental['status'] !== 'PAID') {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$stmt = $db->prepare('UPDATE rentals SET status = "SHELTER_CANCELLED", closed_at = NOW() WHERE id = :id');
$stmt->execute([':id' => $rentalId]);

json_response([]);

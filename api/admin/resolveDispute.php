<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
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

$stmt = $db->prepare('SELECT id, status, assigned_admin_id FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ($rental['status'] !== 'DISPUTE') {
    error_response('WRONG_RENTAL_STATUS', 409);
}
if ((int) $rental['assigned_admin_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}

$body = json_decode(file_get_contents('php://input'), true);
if (empty($body['resolution']) || !in_array($body['resolution'], ['IN_FAVOR_OF_SHELTER', 'IN_FAVOR_OF_RENTER'])) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$newStatus = $body['resolution'] === 'IN_FAVOR_OF_SHELTER'
    ? 'DISPUTE_IN_FAVOR_OF_SHELTER'
    : 'DISPUTE_IN_FAVOR_OF_RENTER';

$stmt = $db->prepare('UPDATE rentals SET status = :status, closed_at = NOW() WHERE id = :id');
$stmt->execute([':status' => $newStatus, ':id' => $rentalId]);

json_response([]);

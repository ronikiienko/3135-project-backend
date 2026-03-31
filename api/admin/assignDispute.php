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
if ($rental['assigned_admin_id'] !== null) {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$stmt = $db->prepare('UPDATE rentals SET assigned_admin_id = :admin_id WHERE id = :id');
$stmt->execute([':admin_id' => $session['user_id'], ':id' => $rentalId]);

json_response([]);

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

$shelterId = isset($_GET['shelterId']) ? (int) $_GET['shelterId'] : null;
if (!$shelterId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT s.is_verified, u.is_deleted FROM shelters s JOIN users u ON u.id = s.id WHERE s.id = :id');
$stmt->execute([':id' => $shelterId]);
$shelter = $stmt->fetch();

if (!$shelter) {
    error_response('SHELTER_NOT_FOUND', 404);
}
if ($shelter['is_verified']) {
    error_response('SHELTER_ALREADY_VERIFIED', 409);
}

$stmt = $db->prepare('UPDATE shelters SET is_verified = true WHERE id = :id');
$stmt->execute([':id' => $shelterId]);

json_response([]);

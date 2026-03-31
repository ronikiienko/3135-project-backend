<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

require_auth(['ADMIN']);

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : null;
if (!$userId) {
    error_response('userId is required.', 400);
}

$body = json_decode(file_get_contents('php://input'), true);
$suspendUntil = $body['suspend_until'] ?? null;

if ($suspendUntil !== null) {
    $ts = strtotime($suspendUntil);
    if ($ts === false || $ts <= time()) {
        error_response('suspend_until must be a valid timestamp in the future.', 400);
    }
}

$db = get_db();

// Find the user in shelters or renters
$stmt = $db->prepare('SELECT s.id, "SHELTER" AS role FROM shelters s JOIN users u ON u.id = s.id WHERE s.id = :id1 AND u.is_deleted = 0
                      UNION
                      SELECT r.id, "RENTER" AS role FROM renters r JOIN users u ON u.id = r.id WHERE r.id = :id2 AND u.is_deleted = 0');
$stmt->execute([':id1' => $userId, ':id2' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    error_response('User not found.', 404);
}

$table = $user['role'] === 'SHELTER' ? 'shelters' : 'renters';

$stmt = $db->prepare("UPDATE {$table} SET suspended_until = :suspended_until WHERE id = :id");
$stmt->execute([
    ':suspended_until' => $suspendUntil,
    ':id' => $userId,
]);

json_response(['success' => true]);

<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$db = get_db();

$tableMap = ['SHELTER' => 'shelters', 'RENTER' => 'renters', 'ADMIN' => 'admins'];
$table    = $tableMap[$body['role']];

$stmt = $db->prepare("
    SELECT u.id, u.password_hash
    FROM users u
    JOIN $table t ON t.id = u.id
    WHERE u.email = :email AND u.is_deleted = false
");
$stmt->execute([':email' => $body['email']]);
$row = $stmt->fetch();

if (!$row || !password_verify($body['password'], $row['password_hash'])) {
    error_response('INVALID_CREDENTIALS', 401);
}

$userId = (int) $row['id'];

set_session($userId, $body['role']);

$user = match ($body['role']) {
    'SHELTER' => fetch_shelter($db, $userId),
    'RENTER'  => fetch_renter($db, $userId),
    'ADMIN'   => fetch_admin($db, $userId),
};

json_response(['user' => $user]);

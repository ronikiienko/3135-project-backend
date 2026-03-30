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

$stmt = $db->query('
    SELECT u.id, u.email, u.avatar_filename, u.is_deleted,
           s.name, s.is_verified, s.location, s.description, s.rating, s.suspended_until
    FROM users u
    JOIN shelters s ON s.id = u.id
    WHERE u.is_deleted = false
');

$shelters = [];
foreach ($stmt->fetchAll() as $row) {
    $shelters[] = [
        'id'              => (int) $row['id'],
        'email'           => $row['email'],
        'avatar_filename' => $row['avatar_filename'],
        'is_deleted'      => (bool) $row['is_deleted'],
        'name'            => $row['name'],
        'is_verified'     => (bool) $row['is_verified'],
        'location'        => $row['location'],
        'description'     => $row['description'],
        'rating'          => $row['rating'] !== null ? (float) $row['rating'] : null,
        'suspended_until' => $row['suspended_until'],
    ];
}

json_response(['shelters' => $shelters]);
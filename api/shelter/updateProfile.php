<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$shelter = fetch_shelter($db, $session['user_id']);
if ($shelter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$body = json_decode(file_get_contents('php://input'), true);
$name        = trim($body['name'] ?? '');
$location    = trim($body['location'] ?? '');
$description = trim($body['description'] ?? '');

if ($name === '' || $location === '' || $description === '') {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('UPDATE shelters SET name = :name, location = :location, description = :description WHERE id = :id');
$stmt->execute([
    ':name'        => $name,
    ':location'    => $location,
    ':description' => $description,
    ':id'          => $session['user_id'],
]);

json_response(['shelter' => fetch_shelter($db, $session['user_id'])]);

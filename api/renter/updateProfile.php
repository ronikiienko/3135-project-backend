<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER']);
$db      = get_db();

$renter = fetch_renter($db, $session['user_id']);
if ($renter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$body = json_decode(file_get_contents('php://input'), true);
$fName       = trim($body['fName'] ?? '');
$lName       = trim($body['lName'] ?? '');
$location    = trim($body['location'] ?? '');
$description = trim($body['description'] ?? '');

if ($fName === '' || $lName === '' || $location === '' || $description === '') {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('UPDATE renters SET fName = :fName, lName = :lName, location = :location, description = :description WHERE id = :id');
$stmt->execute([
    ':fName'       => $fName,
    ':lName'       => $lName,
    ':location'    => $location,
    ':description' => $description,
    ':id'          => $session['user_id'],
]);

json_response(['renter' => fetch_renter($db, $session['user_id'])]);

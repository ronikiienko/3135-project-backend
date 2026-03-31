<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

require_auth();
$db = get_db();

$renterId = isset($_GET['renterId']) ? (int) $_GET['renterId'] : null;
if (!$renterId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT 1 FROM renters WHERE id = :id');
$stmt->execute([':id' => $renterId]);
if (!$stmt->fetch()) {
    error_response('RENTER_NOT_FOUND', 404);
}

$renter = fetch_renter($db, $renterId);

json_response([
    'renter' => [
        'id'              => $renter['id'],
        'fName'           => $renter['fName'],
        'lName'           => $renter['lName'],
        'location'        => $renter['location'],
        'description'     => $renter['description'],
        'rating'          => $renter['rating'],
        'avatar_filename'  => $renter['avatar_filename'],
        'profile_images'   => $renter['profile_images'],
        'suspended_until'  => $renter['suspended_until'] ? format_datetime($renter['suspended_until']) : null,
    ],
]);

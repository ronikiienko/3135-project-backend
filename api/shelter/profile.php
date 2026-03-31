<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

require_auth();
$db = get_db();

$shelterId = isset($_GET['shelterId']) ? (int) $_GET['shelterId'] : null;
if (!$shelterId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT 1 FROM shelters WHERE id = :id');
$stmt->execute([':id' => $shelterId]);
if (!$stmt->fetch()) {
    error_response('SHELTER_NOT_FOUND', 404);
}

$shelter = fetch_shelter($db, $shelterId);

json_response([
    'shelter' => [
        'id'              => $shelter['id'],
        'name'            => $shelter['name'],
        'is_verified'     => $shelter['is_verified'],
        'location'        => $shelter['location'],
        'description'     => $shelter['description'],
        'rating'          => $shelter['rating'],
        'avatar_filename'  => $shelter['avatar_filename'],
        'profile_images'   => $shelter['profile_images'],
        'suspended_until'  => $shelter['suspended_until'] ? format_datetime($shelter['suspended_until']) : null,
    ],
]);

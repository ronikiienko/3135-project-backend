<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

require_auth();
$db = get_db();

$listingId = isset($_GET['listingId']) ? (int) $_GET['listingId'] : null;
if (!$listingId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT id, shelter_id, name, species, age, description, is_closed, rate FROM listings WHERE id = :id');
$stmt->execute([':id' => $listingId]);
$row = $stmt->fetch();

if (!$row) {
    error_response('LISTING_NOT_FOUND', 404);
}

$stmt2 = $db->prepare('SELECT filename FROM listing_images WHERE listing_id = :id');
$stmt2->execute([':id' => $listingId]);
$images = array_column($stmt2->fetchAll(), 'filename');

json_response([
    'listing' => [
        'id'             => (int) $row['id'],
        'shelter_id'     => (int) $row['shelter_id'],
        'name'           => $row['name'],
        'species'        => $row['species'],
        'age'            => (int) $row['age'],
        'description'    => $row['description'],
        'is_closed'      => (bool) $row['is_closed'],
        'rate'           => (float) $row['rate'],
        'listing_images' => $images,
    ],
]);
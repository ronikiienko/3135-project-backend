<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$shelter = fetch_shelter($db, $session['user_id']);
if (!$shelter['is_verified'] || ($shelter['suspended_until'] !== null && strtotime($shelter['suspended_until']) > time()) || !$shelter['stripe_account_id']) {
    error_response('FORBIDDEN', 403);
}

$metadata = json_decode($_POST['metadata'] ?? '', true);
if (
    !is_array($metadata) ||
    empty($metadata['name']) ||
    empty($metadata['species']) ||
    !isset($metadata['age']) ||
    empty($metadata['description']) ||
    !isset($metadata['rate'])
) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$listingImages = save_multi_files('listing_images', 'listing_images');

try {
    $db->beginTransaction();

    $stmt = $db->prepare('
        INSERT INTO listings (shelter_id, name, species, age, description, rate)
        VALUES (:shelter_id, :name, :species, :age, :description, :rate)
    ');
    $stmt->execute([
        ':shelter_id'  => $session['user_id'],
        ':name'        => $metadata['name'],
        ':species'     => $metadata['species'],
        ':age'         => (int) $metadata['age'],
        ':description' => $metadata['description'],
        ':rate'        => (float) $metadata['rate'],
    ]);
    $listingId = (int) $db->lastInsertId();

    foreach ($listingImages as $filename) {
        $stmt = $db->prepare('INSERT INTO listing_images (filename, listing_id) VALUES (:filename, :listing_id)');
        $stmt->execute([':filename' => $filename, ':listing_id' => $listingId]);
    }

    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    error_response('INTERNAL_SERVER', 500);
}

$stmt = $db->prepare('SELECT id, shelter_id, name, species, age, description, is_closed, rate FROM listings WHERE id = :id');
$stmt->execute([':id' => $listingId]);
$row = $stmt->fetch();

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
], 201);
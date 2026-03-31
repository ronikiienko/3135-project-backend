<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

require_auth();
$db = get_db();

$stmt = $db->query('
    SELECT l.id, l.shelter_id, l.name, l.species, l.age, l.description, l.is_closed, l.rate,
           s.name AS shelter_name
    FROM listings l
    JOIN shelters s ON s.id = l.shelter_id
');

$listings = [];
foreach ($stmt->fetchAll() as $row) {
    $stmt2 = $db->prepare('SELECT filename FROM listing_images WHERE listing_id = :id');
    $stmt2->execute([':id' => $row['id']]);
    $images = array_column($stmt2->fetchAll(), 'filename');

    $listings[] = [
        'id'             => (int) $row['id'],
        'shelter_id'     => (int) $row['shelter_id'],
        'name'           => $row['name'],
        'species'        => $row['species'],
        'age'            => (int) $row['age'],
        'description'    => $row['description'],
        'is_closed'      => (bool) $row['is_closed'],
        'rate'           => (float) $row['rate'],
        'shelter_name'   => $row['shelter_name'],
        'listing_images' => $images,
    ];
}

json_response(['listings' => $listings]);
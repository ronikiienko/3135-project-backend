<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

require_auth(['RENTER', 'SHELTER', 'ADMIN']);
$db = get_db();

$reviewedId = isset($_GET['reviewedId']) ? (int) $_GET['reviewedId'] : null;
if (!$reviewedId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

// Check user exists
$stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute([':id' => $reviewedId]);
if (!$stmt->fetch()) {
    error_response('REVIEWED_USER_NOT_FOUND', 404);
}

// If admin, return empty array (admins cannot be reviewed)
$stmt = $db->prepare('SELECT 1 FROM admins WHERE id = :id');
$stmt->execute([':id' => $reviewedId]);
if ($stmt->fetch()) {
    json_response(['reviews' => []]);
}

$stmt = $db->prepare('
    SELECT r.id, r.rental_id, r.reviewer_id, r.reviewed_id, r.body, r.score, r.created_at,
           COALESCE(s.name, CONCAT(rn.fName, " ", rn.lName)) AS reviewer_name,
           l.id AS listing_id, l.name AS listing_name, rt.status AS rental_status
    FROM reviews r
    LEFT JOIN shelters s ON s.id = r.reviewer_id
    LEFT JOIN renters rn ON rn.id = r.reviewer_id
    LEFT JOIN rentals rt ON rt.id = r.rental_id
    LEFT JOIN listings l ON l.id = rt.listing_id
    WHERE r.reviewed_id = :reviewed_id
    ORDER BY r.id DESC
');
$stmt->execute([':reviewed_id' => $reviewedId]);
$rows = $stmt->fetchAll();

$reviews = array_map(fn($r) => [
    'id'          => (int) $r['id'],
    'rental_id'   => (int) $r['rental_id'],
    'reviewer_id' => (int) $r['reviewer_id'],
    'reviewed_id' => (int) $r['reviewed_id'],
    'body'        => $r['body'],
    'score'       => (float) $r['score'],
    'created_at'   => format_datetime($r['created_at']),
    'reviewer_name' => $r['reviewer_name'],
    'listing_id'    => $r['listing_id'] !== null ? (int) $r['listing_id'] : null,
    'listing_name'  => $r['listing_name'],
    'rental_status' => $r['rental_status'],
], $rows);

json_response(['reviews' => $reviews]);

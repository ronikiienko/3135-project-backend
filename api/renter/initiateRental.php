<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER']);
$db      = get_db();

$listingId = isset($_GET['listingId']) ? (int) $_GET['listingId'] : null;
if (!$listingId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$renter = fetch_renter($db, $session['user_id']);
if ($renter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}
if ($renter['suspended_until'] !== null && strtotime($renter['suspended_until']) > time()) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare("
    SELECT id FROM rentals
    WHERE renter_id = :renter_id AND listing_id = :listing_id
    AND status IN ('REQUESTED', 'PAYMENT_PENDING', 'PAID')
");
$stmt->execute([':renter_id' => $session['user_id'], ':listing_id' => $listingId]);
if ($stmt->fetch()) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('SELECT id, shelter_id, is_closed FROM listings WHERE id = :id');
$stmt->execute([':id' => $listingId]);
$listing = $stmt->fetch();

if (!$listing) {
    error_response('LISTING_NOT_FOUND', 404);
}
if ($listing['is_closed']) {
    error_response('FORBIDDEN', 403);
}

try {
    $stmt = $db->prepare('
        INSERT INTO rentals (shelter_id, renter_id, listing_id, status)
        VALUES (:shelter_id, :renter_id, :listing_id, "REQUESTED")
    ');
    $stmt->execute([
        ':shelter_id' => (int) $listing['shelter_id'],
        ':renter_id'  => $session['user_id'],
        ':listing_id' => $listingId,
    ]);
    $rentalId = (int) $db->lastInsertId();
} catch (Exception $e) {
    error_response('INTERNAL_SERVER', 500);
}

$stmt = $db->prepare('SELECT * FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$row = $stmt->fetch();

json_response([
    'rental' => [
        'id'                   => (int) $row['id'],
        'shelter_id'           => (int) $row['shelter_id'],
        'renter_id'            => (int) $row['renter_id'],
        'listing_id'           => (int) $row['listing_id'],
        'assigned_admin_id'    => $row['assigned_admin_id'] ? (int) $row['assigned_admin_id'] : null,
        'rental_begins'        => $row['rental_begins'],
        'rental_ends'          => $row['rental_ends'],
        'terms_proposed_at'    => $row['terms_proposed_at'],
        'status'               => $row['status'],
        'dispute_reason'       => $row['dispute_reason'],
        'total_cost'           => $row['total_cost'] !== null ? (float) $row['total_cost'] : null,
        'stripe_transaction_id'=> $row['stripe_transaction_id'],
    ],
], 201);

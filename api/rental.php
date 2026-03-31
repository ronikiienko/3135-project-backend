<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER', 'RENTER']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT r.*, l.name AS listing_name FROM rentals r LEFT JOIN listings l ON l.id = r.listing_id WHERE r.id = :id');
$stmt->execute([':id' => $rentalId]);
$row = $stmt->fetch();

if (!$row) {
    error_response('RENTAL_NOT_FOUND', 404);
}

if ($session['role'] === 'SHELTER' && (int) $row['shelter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($session['role'] === 'RENTER' && (int) $row['renter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}

json_response([
    'rental' => [
        'id'                    => (int) $row['id'],
        'shelter_id'            => (int) $row['shelter_id'],
        'renter_id'             => (int) $row['renter_id'],
        'listing_id'            => (int) $row['listing_id'],
        'listing_name'          => $row['listing_name'],
        'assigned_admin_id'     => $row['assigned_admin_id'] ? (int) $row['assigned_admin_id'] : null,
        'rental_begins'         => $row['rental_begins'],
        'rental_ends'           => $row['rental_ends'],
        'terms_proposed_at'     => $row['terms_proposed_at'],
        'status'                => $row['status'],
        'dispute_reason'        => $row['dispute_reason'],
        'total_cost'            => $row['total_cost'] !== null ? (float) $row['total_cost'] : null,
        'stripe_transaction_id' => $row['stripe_transaction_id'],
    ],
]);

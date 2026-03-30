<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER', 'RENTER']);
$db      = get_db();

if ($session['role'] === 'SHELTER') {
    $stmt = $db->prepare('SELECT * FROM rentals WHERE shelter_id = :id');
} else {
    $stmt = $db->prepare('SELECT * FROM rentals WHERE renter_id = :id');
}
$stmt->execute([':id' => $session['user_id']]);

$rentals = [];
foreach ($stmt->fetchAll() as $row) {
    $rentals[] = [
        'id'                    => (int) $row['id'],
        'shelter_id'            => (int) $row['shelter_id'],
        'renter_id'             => (int) $row['renter_id'],
        'listing_id'            => (int) $row['listing_id'],
        'assigned_admin_id'     => $row['assigned_admin_id'] ? (int) $row['assigned_admin_id'] : null,
        'rental_begins'         => $row['rental_begins'],
        'rental_ends'           => $row['rental_ends'],
        'terms_proposed_at'     => $row['terms_proposed_at'],
        'status'                => $row['status'],
        'dispute_reason'        => $row['dispute_reason'],
        'total_cost'            => $row['total_cost'] !== null ? (float) $row['total_cost'] : null,
        'stripe_transaction_id' => $row['stripe_transaction_id'],
    ];
}

json_response(['rentals' => $rentals]);

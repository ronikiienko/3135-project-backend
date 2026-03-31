<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER', 'RENTER']);
$db      = get_db();

$joinSql = 'SELECT r.*, l.name AS listing_name, CONCAT(rn.fName, " ", rn.lName) AS renter_name, s.name AS shelter_name
            FROM rentals r
            JOIN listings l ON l.id = r.listing_id
            JOIN renters rn ON rn.id = r.renter_id
            JOIN shelters s ON s.id = r.shelter_id';

if ($session['role'] === 'SHELTER') {
    $stmt = $db->prepare($joinSql . ' WHERE r.shelter_id = :id');
} else {
    $stmt = $db->prepare($joinSql . ' WHERE r.renter_id = :id');
}
$stmt->execute([':id' => $session['user_id']]);

$rentals = [];
foreach ($stmt->fetchAll() as $row) {
    $rentals[] = [
        'id'                    => (int) $row['id'],
        'shelter_id'            => (int) $row['shelter_id'],
        'renter_id'             => (int) $row['renter_id'],
        'listing_id'            => (int) $row['listing_id'],
        'listing_name'          => $row['listing_name'],
        'renter_name'           => $row['renter_name'],
        'shelter_name'          => $row['shelter_name'],
        'assigned_admin_id'     => $row['assigned_admin_id'] ? (int) $row['assigned_admin_id'] : null,
        'rental_begins'         => format_datetime($row['rental_begins']),
        'rental_ends'           => format_datetime($row['rental_ends']),
        'terms_proposed_at'     => format_datetime($row['terms_proposed_at']),
        'status'                => $row['status'],
        'dispute_reason'        => $row['dispute_reason'],
        'total_cost'            => $row['total_cost'] !== null ? (float) $row['total_cost'] : null,
        'stripe_transaction_id' => $row['stripe_transaction_id'],
        'closed_at'             => format_datetime($row['closed_at']),
    ];
}

json_response(['rentals' => $rentals]);

<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER', 'RENTER', 'ADMIN']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('
    SELECT r.*, l.name AS listing_name, CONCAT(rn.fName, " ", rn.lName) AS renter_name, s.name AS shelter_name
    FROM rentals r
    JOIN listings l ON l.id = r.listing_id
    JOIN renters rn ON rn.id = r.renter_id
    JOIN shelters s ON s.id = r.shelter_id
    WHERE r.id = :id
');
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
// admins can view any rental

json_response([
    'rental' => [
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
    ],
]);

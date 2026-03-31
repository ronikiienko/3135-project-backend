<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);
if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->query('
    SELECT r.id, r.shelter_id, r.renter_id, r.listing_id, r.assigned_admin_id,
           r.rental_begins, r.rental_ends, r.status, r.dispute_reason, r.total_cost, r.closed_at,
           l.name AS listing_name,
           CONCAT(rn.fName, " ", rn.lName) AS renter_name,
           s.name AS shelter_name
    FROM rentals r
    JOIN listings l ON l.id = r.listing_id
    JOIN renters rn ON rn.id = r.renter_id
    JOIN shelters s ON s.id = r.shelter_id
    WHERE r.status = "DISPUTE"
');

$disputes = [];
foreach ($stmt->fetchAll() as $row) {
    $disputes[] = [
        'id'                => (int) $row['id'],
        'shelter_id'        => (int) $row['shelter_id'],
        'renter_id'         => (int) $row['renter_id'],
        'listing_id'        => (int) $row['listing_id'],
        'assigned_admin_id' => $row['assigned_admin_id'] !== null ? (int) $row['assigned_admin_id'] : null,
        'listing_name'      => $row['listing_name'],
        'renter_name'       => $row['renter_name'],
        'shelter_name'      => $row['shelter_name'],
        'rental_begins'     => format_datetime($row['rental_begins']),
        'rental_ends'       => format_datetime($row['rental_ends']),
        'status'            => $row['status'],
        'dispute_reason'    => $row['dispute_reason'],
        'total_cost'        => $row['total_cost'] !== null ? (float) $row['total_cost'] : null,
        'closed_at'         => format_datetime($row['closed_at']),
    ];
}

json_response(['disputes' => $disputes]);

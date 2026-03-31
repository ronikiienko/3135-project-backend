<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$shelter = fetch_shelter($db, $session['user_id']);
if ($shelter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}
if (!$shelter['is_verified']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('SELECT * FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ((int) $rental['shelter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($rental['status'] !== 'REQUESTED') {
    error_response('WRONG_RENTAL_STATUS', 409);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!isset($body['response'])) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$response = $body['response'];

if ($response === 'CONFIRM') {
    if (empty($body['suggestedRentalBegins']) || empty($body['suggestedRentalEnds'])) {
        error_response('PAYLOAD_MALFORMED', 400);
    }

    $begins = $body['suggestedRentalBegins'];
    $ends   = $body['suggestedRentalEnds'];

    $beginsTs = strtotime($begins);
    $endsTs   = strtotime($ends);

    if ($beginsTs === false || $endsTs === false || $beginsTs <= time() || $endsTs <= $beginsTs) {
        error_response('PAYLOAD_MALFORMED', 400);
    }

    // Fetch rate from listings table
    $stmt = $db->prepare('SELECT rate FROM listings WHERE id = :id');
    $stmt->execute([':id' => (int) $rental['listing_id']]);
    $listing = $stmt->fetch();
    if (!$listing) {
        error_response('INTERNAL_SERVER', 500);
    }

    $hours     = ($endsTs - $beginsTs) / 3600;
    $totalCost = round((float) $listing['rate'] * $hours, 2);

    $stmt = $db->prepare('
        UPDATE rentals
        SET status = "PAYMENT_PENDING",
            rental_begins = :rental_begins,
            rental_ends = :rental_ends,
            terms_proposed_at = NOW(),
            total_cost = :total_cost
        WHERE id = :id
    ');
    $stmt->execute([
        ':rental_begins' => $begins,
        ':rental_ends'   => $ends,
        ':total_cost'    => $totalCost,
        ':id'            => $rentalId,
    ]);

} elseif ($response === 'DENY') {
    $stmt = $db->prepare('UPDATE rentals SET status = "SHELTER_DECLINED", closed_at = NOW() WHERE id = :id');
    $stmt->execute([':id' => $rentalId]);

} else {
    error_response('PAYLOAD_MALFORMED', 400);
}

json_response([]);

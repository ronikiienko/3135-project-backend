<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);
if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('
    SELECT r.id, r.status, r.assigned_admin_id, r.stripe_payment_intent_id, s.stripe_account_id
    FROM rentals r
    JOIN shelters s ON s.id = r.shelter_id
    WHERE r.id = :id
');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ($rental['status'] !== 'DISPUTE') {
    error_response('WRONG_RENTAL_STATUS', 409);
}
if ((int) $rental['assigned_admin_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}

$body = json_decode(file_get_contents('php://input'), true);
if (empty($body['resolution']) || !in_array($body['resolution'], ['IN_FAVOR_OF_SHELTER', 'IN_FAVOR_OF_RENTER'])) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$newStatus = $body['resolution'] === 'IN_FAVOR_OF_SHELTER'
    ? 'DISPUTE_IN_FAVOR_OF_SHELTER'
    : 'DISPUTE_IN_FAVOR_OF_RENTER';

$stmt = $db->prepare('UPDATE rentals SET status = :status, closed_at = NOW() WHERE id = :id');
$stmt->execute([':status' => $newStatus, ':id' => $rentalId]);

if ($rental['stripe_payment_intent_id']) {
    try {
        \Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);
        if ($body['resolution'] === 'IN_FAVOR_OF_RENTER') {
            \Stripe\Refund::create(['payment_intent' => $rental['stripe_payment_intent_id']]);
        } elseif ($body['resolution'] === 'IN_FAVOR_OF_SHELTER' && $rental['stripe_account_id']) {
            $intent = \Stripe\PaymentIntent::retrieve($rental['stripe_payment_intent_id']);
            \Stripe\Transfer::create([
                'amount'             => $intent->amount_received,
                'currency'           => $intent->currency,
                'destination'        => $rental['stripe_account_id'],
                'source_transaction' => $intent->latest_charge,
            ]);
        }
    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log('Stripe payout failed for rental ' . $rentalId . ': ' . $e->getMessage());
    }
}

json_response([]);

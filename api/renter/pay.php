<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER']);
$db      = get_db();

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
if (!$rentalId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$renter = fetch_renter($db, $session['user_id']);
if ($renter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('
    SELECT r.*, l.name AS listing_name
    FROM rentals r
    JOIN listings l ON r.listing_id = l.id
    WHERE r.id = :id
');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}
if ((int) $rental['renter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($rental['status'] !== 'PAYMENT_PENDING') {
    error_response('WRONG_RENTAL_STATUS', 409);
}
if ($rental['total_cost'] === null) {
    error_response('PAYLOAD_MALFORMED', 400);
}

\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

$scheme      = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl     = $scheme . '://' . $_SERVER['HTTP_HOST'];
$successUrl  = $baseUrl . '/3135-project-backend/api/stripe/success.php?session_id={CHECKOUT_SESSION_ID}';
$cancelUrl   = $baseUrl . '/3135-project-backend/public/dist/index.html#/rental/' . $rentalId;

$amountCents = (int) round((float) $rental['total_cost'] * 100);

try {
    $checkoutSession = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items'           => [[
            'price_data' => [
                'currency'     => 'usd',
                'product_data' => ['name' => $rental['listing_name']],
                'unit_amount'  => $amountCents,
            ],
            'quantity' => 1,
        ]],
        'mode'        => 'payment',
        'success_url' => $successUrl,
        'cancel_url'  => $cancelUrl,
    ]);
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_response($e->getMessage(), 400);
}

$stmt = $db->prepare('UPDATE rentals SET stripe_transaction_id = :sid WHERE id = :id');
$stmt->execute([':sid' => $checkoutSession->id, ':id' => $rentalId]);

json_response(['url' => $checkoutSession->url]);

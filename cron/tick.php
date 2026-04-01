<?php

require_once __DIR__ . '/../src/bootstrap.php';

\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

$db = get_db();

// Expire payments: PAYMENT_PENDING rentals where rental_begins has passed
$stmt = $db->prepare('
    UPDATE rentals
    SET status = "PAYMENT_EXPIRED", closed_at = NOW()
    WHERE status = "PAYMENT_PENDING"
      AND rental_begins < NOW()
');
$stmt->execute();
$expired = $stmt->rowCount();

// Close rentals: PAID rentals where rental_ends + 24h has passed (no dispute filed)
$disputeWindowSeconds = 60; // 10 seconds for testing (normally 24 * 60 * 60)
$stmt = $db->prepare('
    SELECT r.id, r.shelter_id, r.stripe_payment_intent_id, s.stripe_account_id
    FROM rentals r
    JOIN shelters s ON s.id = r.shelter_id
    WHERE r.status = "PAID"
      AND r.rental_ends + INTERVAL :window SECOND < NOW()
');
$stmt->execute([':window' => $disputeWindowSeconds]);
$toClose = $stmt->fetchAll();

$closed   = 0;
$paid_out = 0;

foreach ($toClose as $rental) {
    if (!$rental['stripe_payment_intent_id'] || !$rental['stripe_account_id']) {
        // No payment on file — close without payout and log
        $stmt = $db->prepare('UPDATE rentals SET status = "PEACEFULLY_TERMINATED", closed_at = NOW() WHERE id = :id AND status = "PAID"');
        $stmt->execute([':id' => $rental['id']]);
        if ($stmt->rowCount() > 0) {
            $closed++;
            error_log('Closed rental ' . $rental['id'] . ' without payout: missing payment intent or shelter Stripe account');
        }
        continue;
    }

    try {
        $intent  = \Stripe\PaymentIntent::retrieve($rental['stripe_payment_intent_id']);
        $charge  = \Stripe\Charge::retrieve($intent->latest_charge);
        $balTxn  = \Stripe\BalanceTransaction::retrieve($charge->balance_transaction);

        \Stripe\Transfer::create([
            'amount'             => $balTxn->net,
            'currency'           => $balTxn->currency,
            'destination'        => $rental['stripe_account_id'],
            'source_transaction' => $intent->latest_charge,
        ]);

        $stmt = $db->prepare('UPDATE rentals SET status = "PEACEFULLY_TERMINATED", closed_at = NOW() WHERE id = :id AND status = "PAID"');
        $stmt->execute([':id' => $rental['id']]);
        if ($stmt->rowCount() > 0) {
            $closed++;
            $paid_out++;
        }
    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log('Stripe transfer failed for rental ' . $rental['id'] . ', will retry next run: ' . $e->getMessage());
    }
}

echo "Expired: $expired, Closed: $closed, Paid out: $paid_out\n";

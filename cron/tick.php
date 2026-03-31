<?php

require_once __DIR__ . '/../src/bootstrap.php';

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
$disputeWindowSeconds = 24 * 60 * 60;
$stmt = $db->prepare('
    UPDATE rentals
    SET status = "PEACEFULLY_TERMINATED", closed_at = NOW()
    WHERE status = "PAID"
      AND rental_ends + INTERVAL :window SECOND < NOW()
');
$stmt->execute([':window' => $disputeWindowSeconds]);
$closed = $stmt->rowCount();

echo "Expired: $expired, Closed: $closed\n";

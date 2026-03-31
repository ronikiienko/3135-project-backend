<?php

require_once __DIR__ . '/../../src/bootstrap.php';

$scheme  = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl = $scheme . '://' . $_SERVER['HTTP_HOST'];
$frontendBase = $baseUrl . '/3135-project-backend/public/dist/index.html#';

$sessionId = $_GET['session_id'] ?? null;
if (!$sessionId) {
    header('Location: ' . $frontendBase . '/dashboard');
    exit;
}

\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

try {
    $checkoutSession = \Stripe\Checkout\Session::retrieve($sessionId);
} catch (\Exception $e) {
    header('Location: ' . $frontendBase . '/dashboard');
    exit;
}

$db   = get_db();
$stmt = $db->prepare('SELECT * FROM rentals WHERE stripe_transaction_id = :sid');
$stmt->execute([':sid' => $sessionId]);
$rental = $stmt->fetch();

if (!$rental) {
    header('Location: ' . $frontendBase . '/dashboard');
    exit;
}

$rentalUrl = $frontendBase . '/rental/' . $rental['id'];

// Idempotent: already paid
if ($rental['status'] === 'PAID') {
    header('Location: ' . $rentalUrl);
    exit;
}

if ($checkoutSession->payment_status !== 'paid' || $rental['status'] !== 'PAYMENT_PENDING') {
    header('Location: ' . $rentalUrl);
    exit;
}

$stmt = $db->prepare('UPDATE rentals SET status = "PAID" WHERE id = :id AND status = "PAYMENT_PENDING"');
$stmt->execute([':id' => $rental['id']]);

header('Location: ' . $rentalUrl);
exit;

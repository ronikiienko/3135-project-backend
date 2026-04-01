<?php

require_once __DIR__ . '/../../src/bootstrap.php';

$scheme       = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl      = $scheme . '://' . $_SERVER['HTTP_HOST'];
$frontendBase = $baseUrl . '/3135-project-backend/public/dist/index.html#';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : null;
if (!$userId) {
    header('Location: ' . $frontendBase . '/dashboard');
    exit;
}

$db   = get_db();
$stmt = $db->prepare('SELECT stripe_account_id FROM shelters WHERE id = :id');
$stmt->execute([':id' => $userId]);
$shelter = $stmt->fetch();

if (!$shelter || !$shelter['stripe_account_id']) {
    header('Location: ' . $frontendBase . '/shelter/account?stripe=error');
    exit;
}

\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

try {
    $account = \Stripe\Account::retrieve($shelter['stripe_account_id']);
} catch (\Exception $e) {
    header('Location: ' . $frontendBase . '/shelter/account?stripe=error');
    exit;
}

if ($account->charges_enabled) {
    header('Location: ' . $frontendBase . '/shelter/account?stripe=success');
} else {
    header('Location: ' . $frontendBase . '/shelter/account?stripe=incomplete');
}
exit;

<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$shelter = fetch_shelter($db, $session['user_id']);
if ($shelter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

$scheme      = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl     = $scheme . '://' . $_SERVER['HTTP_HOST'];
$returnUrl  = $baseUrl . '/3135-project-backend/api/stripe/connectReturn.php?userId=' . $session['user_id'];
$refreshUrl = $baseUrl . '/3135-project-backend/public/dist/index.html#/shelter/account?stripe=incomplete';

// Reuse existing connected account or create a new one
$accountId = $shelter['stripe_account_id'];
if (!$accountId) {
    $account   = \Stripe\Account::create(['type' => 'express']);
    $accountId = $account->id;

    $stmt = $db->prepare('UPDATE shelters SET stripe_account_id = :aid WHERE id = :id');
    $stmt->execute([':aid' => $accountId, ':id' => $session['user_id']]);
}

$accountLink = \Stripe\AccountLink::create([
    'account'     => $accountId,
    'refresh_url' => $refreshUrl,
    'return_url'  => $returnUrl,
    'type'        => 'account_onboarding',
]);

json_response(['url' => $accountLink->url]);

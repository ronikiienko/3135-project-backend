<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['SHELTER']);
$db      = get_db();

$listingId = isset($_GET['listingId']) ? (int) $_GET['listingId'] : null;
if (!$listingId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$shelter = fetch_shelter($db, $session['user_id']);
if ($shelter['is_deleted']) {
    error_response('FORBIDDEN', 403);
}
if (!$shelter['is_verified']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->prepare('SELECT id, shelter_id, is_closed FROM listings WHERE id = :id');
$stmt->execute([':id' => $listingId]);
$listing = $stmt->fetch();

if (!$listing) {
    error_response('LISTING_NOT_FOUND', 404);
}
if ((int) $listing['shelter_id'] !== $session['user_id']) {
    error_response('FORBIDDEN', 403);
}
if ($listing['is_closed']) {
    error_response('LISTING_ALREADY_CLOSED', 409);
}

$stmt = $db->prepare('UPDATE listings SET is_closed = true WHERE id = :id');
$stmt->execute([':id' => $listingId]);

json_response([]);

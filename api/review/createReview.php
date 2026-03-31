<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER']);
$db      = get_db();

$rentalId   = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;
$reviewedId = isset($_GET['reviewedId']) ? (int) $_GET['reviewedId'] : null;
if (!$rentalId || !$reviewedId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$body  = json_decode(file_get_contents('php://input'), true);
$text  = trim($body['body'] ?? '');
$score = isset($body['score']) ? (float) $body['score'] : null;

if ($text === '' || $score === null || $score < 0 || $score > 1) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$role = $session['role'];

// Check reviewer is not deleted
if ($role === 'RENTER') {
    $reviewer = fetch_renter($db, $session['user_id']);
} else {
    $reviewer = fetch_shelter($db, $session['user_id']);
}
if ($reviewer['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

// Fetch rental
$stmt = $db->prepare('SELECT * FROM rentals WHERE id = :id');
$stmt->execute([':id' => $rentalId]);
$rental = $stmt->fetch();

if (!$rental) {
    error_response('RENTAL_NOT_FOUND', 404);
}

// Check reviewer is party to this rental and reviewedId is the other party
if ($role === 'RENTER') {
    if ((int) $rental['renter_id'] !== $session['user_id']) error_response('FORBIDDEN', 403);
    if ((int) $rental['shelter_id'] !== $reviewedId) error_response('FORBIDDEN', 403);
    $qualifyingStatuses = ['PEACEFULLY_TERMINATED', 'DISPUTE_IN_FAVOR_OF_SHELTER', 'DISPUTE_IN_FAVOR_OF_RENTER', 'SHELTER_CANCELLED'];
} else {
    if ((int) $rental['shelter_id'] !== $session['user_id']) error_response('FORBIDDEN', 403);
    if ((int) $rental['renter_id'] !== $reviewedId) error_response('FORBIDDEN', 403);
    $qualifyingStatuses = ['PEACEFULLY_TERMINATED', 'DISPUTE_IN_FAVOR_OF_SHELTER', 'DISPUTE_IN_FAVOR_OF_RENTER', 'PAYMENT_EXPIRED'];
}

if (!in_array($rental['status'], $qualifyingStatuses)) {
    error_response('FORBIDDEN', 403);
}

// Check reviewed user exists (allow deleted)
$stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute([':id' => $reviewedId]);
if (!$stmt->fetch()) {
    error_response('REVIEWED_USER_NOT_FOUND', 404);
}

// Check not already reviewed for this rental by this reviewer
$stmt = $db->prepare('SELECT 1 FROM reviews WHERE rental_id = :rental_id AND reviewer_id = :reviewer_id LIMIT 1');
$stmt->execute([':rental_id' => $rentalId, ':reviewer_id' => $session['user_id']]);
if ($stmt->fetch()) {
    error_response('ALREADY_REVIEWED', 409);
}

// Insert
$stmt = $db->prepare('INSERT INTO reviews (rental_id, reviewer_id, reviewed_id, body, score) VALUES (:rental_id, :reviewer_id, :reviewed_id, :body, :score)');
$stmt->execute([
    ':rental_id'   => $rentalId,
    ':reviewer_id' => $session['user_id'],
    ':reviewed_id' => $reviewedId,
    ':body'        => $text,
    ':score'       => $score,
]);
$reviewId = (int) $db->lastInsertId();

// Recalculate rating
$stmt = $db->prepare('SELECT AVG(score) AS avg_score FROM reviews WHERE reviewed_id = :id');
$stmt->execute([':id' => $reviewedId]);
$avg = (float) $stmt->fetchColumn();

$stmt = $db->prepare('UPDATE shelters SET rating = :rating WHERE id = :id');
$stmt->execute([':rating' => $avg, ':id' => $reviewedId]);
if ($stmt->rowCount() === 0) {
    $stmt = $db->prepare('UPDATE renters SET rating = :rating WHERE id = :id');
    $stmt->execute([':rating' => $avg, ':id' => $reviewedId]);
}

json_response([
    'review' => [
        'id'          => $reviewId,
        'rental_id'   => $rentalId,
        'reviewer_id' => $session['user_id'],
        'reviewed_id' => $reviewedId,
        'body'        => $text,
        'score'       => $score,
    ],
], 201);

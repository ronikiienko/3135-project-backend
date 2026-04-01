<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER']);
$db      = get_db();

$filenames = save_multi_files('profile_images', 'profile_images');

if (empty($filenames)) {
    error_response('PAYLOAD_MALFORMED', 400);
}

foreach ($filenames as $filename) {
    $stmt = $db->prepare('INSERT INTO user_images (filename, user_id) VALUES (:filename, :user_id)');
    $stmt->execute([':filename' => $filename, ':user_id' => $session['user_id']]);
}

json_response(['added' => $filenames]);

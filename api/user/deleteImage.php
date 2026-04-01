<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER']);
$db      = get_db();

$filename = $_GET['filename'] ?? '';
if ($filename === '') {
    error_response('PAYLOAD_MALFORMED', 400);
}

// Verify this image belongs to the current user
$stmt = $db->prepare('SELECT filename FROM user_images WHERE filename = :filename AND user_id = :user_id');
$stmt->execute([':filename' => $filename, ':user_id' => $session['user_id']]);
if (!$stmt->fetch()) {
    error_response('NOT_FOUND', 404);
}

$stmt = $db->prepare('DELETE FROM user_images WHERE filename = :filename AND user_id = :user_id');
$stmt->execute([':filename' => $filename, ':user_id' => $session['user_id']]);

$path = __DIR__ . '/../../public/profile_images/' . $filename;
if (file_exists($path)) {
    unlink($path);
}

json_response([]);

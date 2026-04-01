<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER']);
$db      = get_db();

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$newFilename = save_file($_FILES['avatar'], 'avatars');

// Delete old avatar file if present
$stmt = $db->prepare('SELECT avatar_filename FROM users WHERE id = :id');
$stmt->execute([':id' => $session['user_id']]);
$old = $stmt->fetchColumn();
if ($old) {
    $oldPath = __DIR__ . '/../../public/avatars/' . $old;
    if (file_exists($oldPath)) {
        unlink($oldPath);
    }
}

$stmt = $db->prepare('UPDATE users SET avatar_filename = :filename WHERE id = :id');
$stmt->execute([':filename' => $newFilename, ':id' => $session['user_id']]);

json_response(['avatar_filename' => $newFilename]);

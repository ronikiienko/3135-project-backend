<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$metadata = json_decode($_POST['metadata'] ?? '', true);
if (!is_array($metadata)) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$db = get_db();

$stmt = $db->prepare('
    SELECT u.id FROM users u
    JOIN renters r ON r.id = u.id
    WHERE u.email = :email AND u.is_deleted = false
');
$stmt->execute([':email' => $metadata['email']]);
if ($stmt->fetch()) {
    error_response('EMAIL_ALREADY_IN_USE', 409);
}

$avatarFilename = null;
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $avatarFilename = save_file($_FILES['avatar'], 'avatars');
}

$profileImages = save_multi_files('profile_images', 'profile_images');

try {
    $db->beginTransaction();

    $stmt = $db->prepare('
        INSERT INTO users (email, password_hash, avatar_filename, is_deleted)
        VALUES (:email, :password_hash, :avatar_filename, false)
    ');
    $stmt->execute([
        ':email'           => $metadata['email'],
        ':password_hash'   => password_hash($metadata['password'], PASSWORD_BCRYPT),
        ':avatar_filename' => $avatarFilename,
    ]);
    $userId = (int) $db->lastInsertId();

    $stmt = $db->prepare('
        INSERT INTO renters (id, fName, lName, location, description)
        VALUES (:id, :fName, :lName, :location, :description)
    ');
    $stmt->execute([
        ':id'          => $userId,
        ':fName'       => $metadata['fName'],
        ':lName'       => $metadata['lName'],
        ':location'    => $metadata['location'],
        ':description' => $metadata['description'],
    ]);

    foreach ($profileImages as $filename) {
        $stmt = $db->prepare('INSERT INTO user_images (filename, user_id) VALUES (:filename, :user_id)');
        $stmt->execute([':filename' => $filename, ':user_id' => $userId]);
    }

    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    error_response('INTERNAL_SERVER', 500);
}

set_session($userId, 'RENTER');

json_response(['renter' => fetch_renter($db, $userId)], 201);

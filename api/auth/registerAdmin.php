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

$token = trim($metadata['token'] ?? '');
$name  = trim($metadata['name'] ?? '');
$email = trim($metadata['email'] ?? '');
$password = $metadata['password'] ?? '';
$canCreateAdmins = isset($metadata['can_create_admins']) ? (bool) $metadata['can_create_admins'] : false;

if (!$token || !$name || !$email || strlen($password) < 8) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$db = get_db();

// Validate token
$tokenHash = hash('sha256', $token);
$stmt = $db->prepare('SELECT * FROM admin_tokens WHERE token_hash = :hash AND expires_at > NOW()');
$stmt->execute([':hash' => $tokenHash]);
$adminToken = $stmt->fetch();

if (!$adminToken) {
    error_response('UNAUTHENTICATED', 401);
}

// Check email not already used by non-deleted admin
$stmt = $db->prepare('
    SELECT u.id FROM users u
    JOIN admins a ON a.id = u.id
    WHERE u.email = :email AND u.is_deleted = false
');
$stmt->execute([':email' => $email]);
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
        ':email'           => $email,
        ':password_hash'   => password_hash($password, PASSWORD_BCRYPT),
        ':avatar_filename' => $avatarFilename,
    ]);
    $userId = (int) $db->lastInsertId();

    $stmt = $db->prepare('
        INSERT INTO admins (id, name, can_create_admins)
        VALUES (:id, :name, :can_create_admins)
    ');
    $stmt->execute([
        ':id'               => $userId,
        ':name'             => $name,
        ':can_create_admins' => $canCreateAdmins,
    ]);

    foreach ($profileImages as $filename) {
        $stmt = $db->prepare('INSERT INTO user_images (filename, user_id) VALUES (:filename, :user_id)');
        $stmt->execute([':filename' => $filename, ':user_id' => $userId]);
    }

    // Consume the token
    $stmt = $db->prepare('DELETE FROM admin_tokens WHERE token_hash = :hash');
    $stmt->execute([':hash' => $tokenHash]);

    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    error_response('INTERNAL_SERVER', 500);
}

set_session($userId, 'ADMIN');

json_response(['admin' => fetch_admin($db, $userId)], 201);

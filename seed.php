<?php

if (getenv('APP_ENV') === 'production') {
    echo "Refusing to run seed in production.\n";
    exit(1);
}

require_once __DIR__ . '/src/bootstrap.php';

$db = get_db();

$email    = 'admin@dev.com';
$password = 'admin123';
$name     = 'Dev Admin';

// Check if already seeded
$stmt = $db->prepare("SELECT u.id FROM users u JOIN admins a ON a.id = u.id WHERE u.email = :email");
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    echo "Admin already exists, skipping.\n";
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare("INSERT INTO users (email, password_hash) VALUES (:email, :hash)");
$stmt->execute([':email' => $email, ':hash' => $hash]);
$userId = (int) $db->lastInsertId();

$stmt = $db->prepare("INSERT INTO admins (id, name, can_create_admins) VALUES (:id, :name, true)");
$stmt->execute([':id' => $userId, ':name' => $name]);

echo "Seeded admin: $email / $password\n";
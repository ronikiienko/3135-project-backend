<?php

function fetch_shelter(PDO $db, int $userId): array
{
    $stmt = $db->prepare('
        SELECT u.id, u.email, u.avatar_filename, u.is_deleted,
               s.name, s.is_verified, s.location, s.description, s.rating, s.suspended_until
        FROM users u
        JOIN shelters s ON s.id = u.id
        WHERE u.id = :id
    ');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch();

    $stmt2 = $db->prepare('SELECT filename FROM user_images WHERE user_id = :user_id');
    $stmt2->execute([':user_id' => $userId]);
    $profileImages = array_column($stmt2->fetchAll(), 'filename');

    return [
        'id'              => $row['id'],
        'email'           => $row['email'],
        'avatar_filename' => $row['avatar_filename'],
        'profile_images'  => $profileImages,
        'is_deleted'      => (bool) $row['is_deleted'],
        'name'            => $row['name'],
        'is_verified'     => (bool) $row['is_verified'],
        'location'        => $row['location'],
        'description'     => $row['description'],
        'rating'          => $row['rating'] !== null ? (float) $row['rating'] : null,
        'suspended_until' => $row['suspended_until'],
    ];
}

function fetch_renter(PDO $db, int $userId): array
{
    $stmt = $db->prepare('
        SELECT u.id, u.email, u.avatar_filename, u.is_deleted,
               r.fName, r.lName, r.location, r.description, r.rating, r.suspended_until
        FROM users u
        JOIN renters r ON r.id = u.id
        WHERE u.id = :id
    ');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch();

    $stmt2 = $db->prepare('SELECT filename FROM user_images WHERE user_id = :user_id');
    $stmt2->execute([':user_id' => $userId]);
    $profileImages = array_column($stmt2->fetchAll(), 'filename');

    return [
        'id'              => $row['id'],
        'email'           => $row['email'],
        'avatar_filename' => $row['avatar_filename'],
        'profile_images'  => $profileImages,
        'is_deleted'      => (bool) $row['is_deleted'],
        'fName'           => $row['fName'],
        'lName'           => $row['lName'],
        'location'        => $row['location'],
        'description'     => $row['description'],
        'rating'          => $row['rating'] !== null ? (float) $row['rating'] : null,
        'suspended_until' => $row['suspended_until'],
    ];
}

function fetch_admin(PDO $db, int $userId): array
{
    $stmt = $db->prepare('
        SELECT u.id, u.email, u.avatar_filename, u.is_deleted,
               a.name, a.can_create_admins
        FROM users u
        JOIN admins a ON a.id = u.id
        WHERE u.id = :id
    ');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch();

    $stmt2 = $db->prepare('SELECT filename FROM user_images WHERE user_id = :user_id');
    $stmt2->execute([':user_id' => $userId]);
    $profileImages = array_column($stmt2->fetchAll(), 'filename');

    return [
        'id'                => $row['id'],
        'email'             => $row['email'],
        'avatar_filename'   => $row['avatar_filename'],
        'profile_images'    => $profileImages,
        'is_deleted'        => (bool) $row['is_deleted'],
        'name'              => $row['name'],
        'can_create_admins' => (bool) $row['can_create_admins'],
    ];
}
